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
  | 'recharge_card_printing'
  | 'bulk_sms'
  | 'result_checker'
  | 'admin_adjustment';

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

// Super-admin approval workflow: any change an admin initiates that
// involves money (plan pricing) or account access (role changes) is
// staged as a pending proposal and only applied once a super admin
// approves it. This is the type that represents one such proposal.
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalAction =
  | 'update_data_plan_price'
  | 'add_data_plan'
  | 'delete_data_plan'
  | 'update_cable_plan_price'
  | 'add_cable_plan'
  | 'delete_cable_plan'
  | 'change_user_role'
  | 'admin_wallet_credit'
  | 'admin_wallet_debit'
  | 'delete_user';

export interface PendingApproval {
  id: string;
  action: ApprovalAction;
  requestedBy: string;       // email of the admin who staged this
  requestedAt: string;       // ISO timestamp
  status: ApprovalStatus;
  reviewedBy?: string;       // email of the super admin who acted on it
  reviewedAt?: string;
  note?: string;             // optional reason from the admin
  payload: Record<string, unknown>; // the data to apply on approval
}
