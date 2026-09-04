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

export function detectNetwork(phoneNumber: string): Network | null {
  if (!/^0\d{10}$/.test(phoneNumber)) return null;
  return PREFIX_MAP[phoneNumber.slice(0, 4)] ?? null;
}
