export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  authProvider: 'email' | 'google';
  role: 'customer' | 'admin';
  package: 'smart_user' | 'reseller';
}

export type TransactionType =
  | 'wallet_funding'
  | 'airtime'
  | 'data'
  | 'electricity'
  | 'cable'
  | 'airtime_to_cash'
  | 'recharge_card_printing';

export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  reference: string;
  description: string;
  createdAt: string; // ISO timestamp
  meta?: Record<string, string>;
}

// A saved recipient, named by the user after a successful purchase so
// it can be reused next time without retyping. 'phone' covers both
// airtime and data (same address book); electricity and cable use
// their own number formats so get their own kind.
export type BeneficiaryKind = 'phone' | 'meter' | 'smartcard';

export interface Beneficiary {
  id: string;
  kind: BeneficiaryKind;
  name: string;
  value: string;
  extra?: string; // network (MTN/GLO/...), disco, or cable provider
  createdAt: string;
}
