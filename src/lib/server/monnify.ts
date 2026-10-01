import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import {
  PUBLIC_MONNIFY_API_KEY,
  PUBLIC_MONNIFY_CONTRACT_CODE
} from '$env/static/public';

// Moniepoint MFB bank code on Monnify
const MONIEPOINT_CODE = '50515';

const baseUrl = () => env.MONNIFY_BASE_URL || 'https://api.monnify.com';

function secretKey(): string {
  if (!env.MONNIFY_SECRET_KEY) throw new Error('MONNIFY_SECRET_KEY is not set');
  return env.MONNIFY_SECRET_KEY;
}

export { adminClient } from './supabaseAdmin';

async function getToken(): Promise<string> {
  const basic = Buffer.from(`${PUBLIC_MONNIFY_API_KEY}:${secretKey()}`).toString('base64');
  const res = await fetch(`${baseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` }
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.requestSuccessful) {
    throw new Error(json?.responseMessage ?? 'Monnify authentication failed');
  }
  return json.responseBody.accessToken;
}

export type MonnifyAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
};

/**
 * Creates (or, if it already exists, fetches) the reserved account for a user.
 * `reference` must be stable per user — we use the Supabase user id, which is
 * also how the webhook maps a payment back to a wallet.
 */
export async function createReservedAccount(input: {
  reference: string;
  name: string;
  email: string;
  bvn: string;
}): Promise<MonnifyAccount> {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${baseUrl()}/api/v2/bank-transfer/reserved-accounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accountReference: input.reference,
      accountName: input.name,
      currencyCode: 'NGN',
      contractCode: PUBLIC_MONNIFY_CONTRACT_CODE,
      customerEmail: input.email,
      customerName: input.name,
      bvn: input.bvn,
      getAllAvailableBanks: false,
      preferredBanks: [MONIEPOINT_CODE]
    })
  });
  let json = await res.json().catch(() => null);

  // Reference already used → this user has an account on Monnify already; fetch it.
  if (!json?.requestSuccessful && /reference/i.test(json?.responseMessage ?? '')) {
    const existing = await fetch(
      `${baseUrl()}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(input.reference)}`,
      { headers }
    );
    json = await existing.json().catch(() => null);
  }

  if (!json?.requestSuccessful) {
    throw new Error(json?.responseMessage ?? 'Could not create account');
  }
  const accounts: MonnifyAccount[] = json.responseBody.accounts ?? [];
  const acc = accounts.find((a) => a.bankCode === MONIEPOINT_CODE) ?? accounts[0];
  if (!acc) throw new Error('Monnify returned no account');
  return acc;
}

/** Monnify signs the raw webhook body with HMAC-SHA512 (hex) using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Confirms a transaction with Monnify directly, so a forged webhook can't credit a wallet. */
export async function fetchTransaction(transactionReference: string) {
  const token = await getToken();
  const res = await fetch(
    `${baseUrl()}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const json = await res.json().catch(() => null);
  return json?.requestSuccessful ? json.responseBody : null;
}
