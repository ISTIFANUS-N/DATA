import { persisted } from './persisted';
import { derived } from 'svelte/store';

export type ApiServiceType = 'data' | 'airtime' | 'cable' | 'electricity' | 'bulk_sms' | 'result_checker' | 'recharge_cards';

export interface ApiProvider {
  id: string;
  service: ApiServiceType;
  name: string;           // e.g. "Vtpass", "N3T Data", "Clubkonnect"
  baseUrl: string;        // API base URL
  isActive: boolean;      // which provider is currently live for this service
  environment: 'live' | 'sandbox';
  notes: string;          // e.g. "Primary provider", "Failover"
  addedAt: string;
}

const DEFAULT_PROVIDERS: ApiProvider[] = [
  {
    id: 'vtpass-data',
    service: 'data',
    name: 'Vtpass',
    baseUrl: 'https://vtpass.com/api',
    isActive: true,
    environment: 'sandbox',
    notes: 'Primary data provider',
    addedAt: new Date().toISOString()
  },
  {
    id: 'vtpass-airtime',
    service: 'airtime',
    name: 'Vtpass',
    baseUrl: 'https://vtpass.com/api',
    isActive: true,
    environment: 'sandbox',
    notes: 'Primary airtime provider',
    addedAt: new Date().toISOString()
  },
  {
    id: 'vtpass-cable',
    service: 'cable',
    name: 'Vtpass',
    baseUrl: 'https://vtpass.com/api',
    isActive: true,
    environment: 'sandbox',
    notes: 'DSTV / GOtv / StarTimes',
    addedAt: new Date().toISOString()
  },
  {
    id: 'vtpass-electricity',
    service: 'electricity',
    name: 'Vtpass',
    baseUrl: 'https://vtpass.com/api',
    isActive: true,
    environment: 'sandbox',
    notes: 'All DisCos',
    addedAt: new Date().toISOString()
  },
  {
    id: 'multitexter-sms',
    service: 'bulk_sms',
    name: 'Multitexter',
    baseUrl: 'https://multitexter.com/v2/app',
    isActive: true,
    environment: 'sandbox',
    notes: 'Bulk SMS gateway',
    addedAt: new Date().toISOString()
  },
  {
    id: 'vtpass-result',
    service: 'result_checker',
    name: 'Vtpass',
    baseUrl: 'https://vtpass.com/api',
    isActive: true,
    environment: 'sandbox',
    notes: 'WAEC, NECO, JAMB, NABTEB',
    addedAt: new Date().toISOString()
  }
];

export const apiProviders = persisted<ApiProvider[]>('fanu_api_providers', DEFAULT_PROVIDERS);

// Credentials now live in server environment variables only. Strip any keys an
// earlier version of this page saved into this browser's local storage.
apiProviders.update((list) =>
  list.map((p) => {
    const { apiKey, secretKey, ...rest } = p as ApiProvider & { apiKey?: string; secretKey?: string };
    return rest;
  })
);

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export function adminAddApiProvider(input: Omit<ApiProvider, 'id' | 'addedAt'>): void {
  const provider: ApiProvider = { ...input, id: newId('api'), addedAt: new Date().toISOString() };
  apiProviders.update(list => [provider, ...list]);
}

export function adminUpdateApiProvider(id: string, updates: Partial<Omit<ApiProvider, 'id' | 'addedAt'>>): void {
  apiProviders.update(list => list.map(p => p.id === id ? { ...p, ...updates } : p));
}

export function adminDeleteApiProvider(id: string): void {
  apiProviders.update(list => list.filter(p => p.id !== id));
}

export function adminSetActiveProvider(service: ApiServiceType, id: string): void {
  apiProviders.update(list =>
    list.map(p => p.service === service ? { ...p, isActive: p.id === id } : p)
  );
}

export const SERVICE_LABELS: Record<ApiServiceType, string> = {
  data: 'Data',
  airtime: 'Airtime',
  cable: 'Cable TV',
  electricity: 'Electricity',
  bulk_sms: 'Bulk SMS',
  result_checker: 'Result checker',
  recharge_cards: 'Recharge cards'
};

export const API_SERVICES: ApiServiceType[] = ['data', 'airtime', 'cable', 'electricity', 'bulk_sms', 'result_checker', 'recharge_cards'];
