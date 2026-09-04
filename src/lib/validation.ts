export interface ValidationResult {
  valid: boolean;
  customerName?: string;
  error?: string;
}

// Deterministic fake-name generator so the same number always
// resolves to the same "customer" during a demo session, rather than
// a different random name every time you type it.
const FIRST_NAMES = ['Adaeze', 'Chinedu', 'Bola', 'Ifeoma', 'Tunde', 'Amaka', 'Segun', 'Ngozi', 'Femi', 'Yetunde'];
const LAST_NAMES = ['Okafor', 'Balogun', 'Eze', 'Adeyemi', 'Nwosu', 'Okonkwo', 'Bello', 'Uche', 'Afolabi', 'Ibrahim'];

function hashToIndex(value: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h % mod;
}

function fakeNameFor(value: string): string {
  const first = FIRST_NAMES[hashToIndex(value, FIRST_NAMES.length)];
  const last = LAST_NAMES[hashToIndex(value + 'x', LAST_NAMES.length)];
  return `${first} ${last}`;
}

/**
 * Stands in for a real provider "validate meter" / "validate IUC"
 * API call (network delay included) until the buy-electricity /
 * buy-cable Edge Functions are wired up. Numbers ending in specific
 * digits are treated as intentionally invalid so the failure state is
 * demoable too.
 */
export function mockValidateAccount(
  value: string,
  minLength: number
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < minLength) {
        resolve({ valid: false, error: 'Number is too short.' });
        return;
      }
      // Treat numbers ending in "00" as a demo "not found" case.
      if (digitsOnly.endsWith('00')) {
        resolve({ valid: false, error: 'No account found for this number. Double-check and try again.' });
        return;
      }
      resolve({ valid: true, customerName: fakeNameFor(digitsOnly) });
    }, 700);
  });
}
