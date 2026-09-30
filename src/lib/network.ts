import type { Network } from './data/catalog';

// Common Nigerian MSISDN prefixes by network. Not exhaustive/legally
// authoritative — new ranges get allocated over time, and Number
// Portability means a prefix is only ever a good guess, never a
// guarantee (someone can port a "0803" MTN number to Airtel). That's
// exactly why this is presented as an auto-*detected* default the
// user can turn off, not an enforced fact.
const PREFIX_MAP: Record<string, Network> = {
  // MTN
  '0803': 'MTN', '0806': 'MTN', '0810': 'MTN', '0813': 'MTN', '0814': 'MTN',
  '0816': 'MTN', '0903': 'MTN', '0906': 'MTN', '0913': 'MTN', '0916': 'MTN',
  '0704': 'MTN', '0703': 'MTN',
  // Glo
  '0805': 'GLO', '0807': 'GLO', '0811': 'GLO', '0815': 'GLO', '0905': 'GLO',
  '0915': 'GLO', '0705': 'GLO', '0100': 'GLO',
  // Airtel
  '0802': 'AIRTEL', '0808': 'AIRTEL', '0812': 'AIRTEL', '0708': 'AIRTEL',
  '0701': 'AIRTEL', '0902': 'AIRTEL', '0904': 'AIRTEL', '0907': 'AIRTEL',
  '0912': 'AIRTEL', '0901': 'AIRTEL',
  // 9mobile
  '0809': '9MOBILE', '0817': '9MOBILE', '0818': '9MOBILE', '0908': '9MOBILE',
  '0909': '9MOBILE'
};

/**
 * Cleans up the real-world variations a phone number shows up in —
 * spaces/dashes from how it's displayed, +234/234 international
 * prefixes, or a missing leading 0 — down to the plain 11-digit local
 * format ("0803...") the prefix table is keyed on. Without this, a
 * pasted number (which almost always carries spaces or +234) would
 * simply never match, silently.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+234')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('234') && digits.length === 13) digits = '0' + digits.slice(3);
  else if (digits.length === 10 && !digits.startsWith('0')) digits = '0' + digits;
  return digits;
}

export function detectNetwork(phoneNumber: string): Network | null {
  const normalized = normalizePhone(phoneNumber);
  if (!/^0\d{10}$/.test(normalized)) return null;
  return PREFIX_MAP[normalized.slice(0, 4)] ?? null;
}
