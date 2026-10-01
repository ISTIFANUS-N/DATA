export type Network = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';
export type ProviderService = 'airtime' | 'data';

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

/**
 * To add a new API: create a file that returns one of these, then register
 * it in providers/index.ts. Implement only the services that provider offers.
 * Return a ProviderResult for every provider response; throw only for bugs.
 */
export interface ProviderAdapter {
  id: string;
  name: string;
  airtime?(req: AirtimeRequest): Promise<ProviderResult>;
  data?(req: DataRequest): Promise<ProviderResult>;
  /** Provider wallet balance in Naira, for low-balance alerts. */
  balance?(): Promise<number>;
}

/** Thrown when no usable provider is configured for a service. Safe to show as "unavailable". */
export class ProviderUnavailable extends Error {}
