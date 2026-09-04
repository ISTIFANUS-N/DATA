export type Network = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';

export const NETWORKS: { code: Network; label: string; color: string }[] = [
  { code: 'MTN', label: 'MTN', color: '#FFCB05' },
  { code: 'GLO', label: 'Glo', color: '#00A651' },
  { code: 'AIRTEL', label: 'Airtel', color: '#ED1C24' },
  { code: '9MOBILE', label: '9mobile', color: '#00A99D' }
];

export interface DataPlan {
  id: string;
  network: Network;
  planName: string;
  size: string;
  validity: string;
  price: number;
}

export const DATA_PLANS: DataPlan[] = [
  { id: 'mtn-1gb-30', network: 'MTN', planName: 'MTN 1GB', size: '1GB', validity: '30 days', price: 650 },
  { id: 'mtn-2gb-30', network: 'MTN', planName: 'MTN 2GB', size: '2GB', validity: '30 days', price: 1200 },
  { id: 'mtn-5gb-30', network: 'MTN', planName: 'MTN 5GB', size: '5GB', validity: '30 days', price: 2500 },
  { id: 'mtn-10gb-30', network: 'MTN', planName: 'MTN 10GB', size: '10GB', validity: '30 days', price: 4500 },
  { id: 'glo-1.5gb-30', network: 'GLO', planName: 'Glo 1.5GB', size: '1.5GB', validity: '30 days', price: 600 },
  { id: 'glo-4.1gb-30', network: 'GLO', planName: 'Glo 4.1GB', size: '4.1GB', validity: '30 days', price: 1500 },
  { id: 'glo-10gb-30', network: 'GLO', planName: 'Glo 10GB', size: '10GB', validity: '30 days', price: 3000 },
  { id: 'airtel-1.5gb-30', network: 'AIRTEL', planName: 'Airtel 1.5GB', size: '1.5GB', validity: '30 days', price: 650 },
  { id: 'airtel-4gb-30', network: 'AIRTEL', planName: 'Airtel 4GB', size: '4GB', validity: '30 days', price: 2000 },
  { id: 'airtel-10gb-30', network: 'AIRTEL', planName: 'Airtel 10GB', size: '10GB', validity: '30 days', price: 4000 },
  { id: '9mobile-1.5gb-30', network: '9MOBILE', planName: '9mobile 1.5GB', size: '1.5GB', validity: '30 days', price: 700 },
  { id: '9mobile-4.5gb-30', network: '9MOBILE', planName: '9mobile 4.5GB', size: '4.5GB', validity: '30 days', price: 2000 }
];

export interface Disco {
  code: string;
  label: string;
}

export const DISCOS: Disco[] = [
  { code: 'IKEDC', label: 'Ikeja Electric (IKEDC)' },
  { code: 'EKEDC', label: 'Eko Electric (EKEDC)' },
  { code: 'AEDC', label: 'Abuja Electric (AEDC)' },
  { code: 'PHEDC', label: 'Port Harcourt Electric (PHEDC)' },
  { code: 'KEDCO', label: 'Kano Electric (KEDCO)' },
  { code: 'IBEDC', label: 'Ibadan Electric (IBEDC)' }
];

export interface CablePlan {
  id: string;
  provider: 'DSTV' | 'GOTV' | 'STARTIMES';
  packageName: string;
  price: number;
}

export const CABLE_PLANS: CablePlan[] = [
  { id: 'dstv-padi', provider: 'DSTV', packageName: 'DStv Padi', price: 4400 },
  { id: 'dstv-yanga', provider: 'DSTV', packageName: 'DStv Yanga', price: 6000 },
  { id: 'dstv-compact', provider: 'DSTV', packageName: 'DStv Compact', price: 19000 },
  { id: 'gotv-smallie', provider: 'GOTV', packageName: 'GOtv Smallie', price: 1900 },
  { id: 'gotv-jinja', provider: 'GOTV', packageName: 'GOtv Jinja', price: 3900 },
  { id: 'gotv-max', provider: 'GOTV', packageName: 'GOtv Max', price: 8500 },
  { id: 'startimes-nova', provider: 'STARTIMES', packageName: 'StarTimes Nova', price: 1900 },
  { id: 'startimes-basic', provider: 'STARTIMES', packageName: 'StarTimes Basic', price: 3700 }
];
