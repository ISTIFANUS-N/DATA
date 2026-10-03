export type Network = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';
export type ProviderService = 'airtime' | 'data' | 'electricity' | 'cable';

/**
 * success  — provider confirmed delivery
 * pending  — accepted but not confirmed yet, OR we couldn't tell (timeout). Never refund these.
 * failed   — provider definitely did not deliver. Safe to refund.
 */
export type ProviderStatus = 'success' | 'pending' | 'failed';

export interface ProviderResult {
  status: ProviderStatus;
  providerRef?: string;
  message?: string;
}

export interface AirtimeRequest {
  reference: string; // our unique id; send it as the provider's request id
  network: Network;
  phone: string;     // 11-digit local format, e.g. 08031234567
  amount: number;    // face value in Naira
}

export interface DataRequest {
  reference: string;
  network: Network;
  phone: string;
  planCode: string;  // the provider's plan/variation code (DataPlan.apiPlanId)
  amount: number;
}

/** A data plan as the provider lists it. */
export interface ProviderPlan {
  code: string;    // send this as DataRequest.planCode
  name: string;    // e.g. "N1,000 1.5GB - 30 days"
  amount: number;  // provider price in Naira
}

export interface VerifyMeterRequest {
  disco: string;          // DisCo code, e.g. IKEDC
  meterNumber: string;
  meterType: 'prepaid' | 'postpaid';
}

export interface VerifySmartcardRequest {
  provider: 'DSTV' | 'GOTV' | 'STARTIMES';
  smartcardNumber: string;
}

export interface VerifyResult {
  valid: boolean;
  customerName?: string;
  address?: string;
  error?: string; // shown to the customer when valid is false
}

/**
 * To add a new API: create a file that returns one of these, then register
 * it in providers/index.ts. Implement only the services that provider offers.
 * Return a ProviderResult for every provider response; throw only for bugs.
 */
export interface ProviderAdapter {
  id: string;
  name: string;
  airtime?(req: AirtimeRequest): Promise<ProviderResult>;
  /** Per-order airtime limits this provider enforces, checked before the customer is charged. */
  airtimeLimits?: { min: number; max: number };
  data?(req: DataRequest): Promise<ProviderResult>;
  /** Look up the customer behind a meter / smartcard number. */
  verifyMeter?(req: VerifyMeterRequest): Promise<VerifyResult>;
  verifySmartcard?(req: VerifySmartcardRequest): Promise<VerifyResult>;
  /** Ask the provider what happened to an earlier order (used to settle pending orders). */
  requery?(reference: string): Promise<ProviderResult>;
  /** The provider's current data plans for a network, so admins can pick real plan codes. */
  dataPlans?(network: Network): Promise<ProviderPlan[]>;
  /** Provider wallet balance in Naira, for low-balance alerts. */
  balance?(): Promise<number>;
}

/** Thrown when no usable provider is configured for a service. Safe to show as "unavailable". */
export class ProviderUnavailable extends Error {}
