export interface ValidationResult {
  valid: boolean;
  customerName?: string;
  error?: string;
}

/**
 * Looks up the real account holder for a meter or smartcard/IUC number via our server,
 * which asks the configured provider. Never reports "valid" unless the provider confirmed it.
 */
export async function verifyAccount(params: {
  kind: 'electricity' | 'cable';
  code: string;          // DisCo code or cable provider
  number: string;
  meterType?: string;
}): Promise<ValidationResult> {
  try {
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return { valid: false, error: data?.error ?? 'Could not verify this number. Try again.' };
    return data.valid
      ? { valid: true, customerName: data.customerName }
      : { valid: false, error: data.error ?? 'No account found for this number.' };
  } catch {
    return { valid: false, error: 'Network problem. Check your connection and try again.' };
  }
}
