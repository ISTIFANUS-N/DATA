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
  type: DataPlanType;
}

export type DataPlanType = 'GIFTING' | 'SME' | 'DATA_SHARE' | 'CORPORATE_GIFTING';

export const DATA_PLAN_TYPES: { code: DataPlanType; label: string; blurb: string }[] = [
  { code: 'GIFTING', label: 'Gifting', blurb: 'Standard data plan, works like your normal bundle' },
  { code: 'SME', label: 'SME', blurb: 'Cheaper, high-volume — no rollover, no data top-up while active' },
  { code: 'DATA_SHARE', label: 'Data Share', blurb: 'Share the bundle across multiple devices/lines' },
  { code: 'CORPORATE_GIFTING', label: 'Corporate Gifting', blurb: 'Bulk plans for teams and businesses' }
];

export const DATA_PLANS: DataPlan[] = [
  // --- MTN ---
  { id: 'mtn-gift-1gb-30', network: 'MTN', planName: 'MTN 1GB', size: '1GB', validity: '30 days', price: 650, type: 'GIFTING' },
  { id: 'mtn-gift-2gb-30', network: 'MTN', planName: 'MTN 2GB', size: '2GB', validity: '30 days', price: 1200, type: 'GIFTING' },
  { id: 'mtn-gift-5gb-30', network: 'MTN', planName: 'MTN 5GB', size: '5GB', validity: '30 days', price: 2500, type: 'GIFTING' },
  { id: 'mtn-gift-10gb-30', network: 'MTN', planName: 'MTN 10GB', size: '10GB', validity: '30 days', price: 4500, type: 'GIFTING' },
  { id: 'mtn-sme-1gb-30', network: 'MTN', planName: 'MTN SME 1GB', size: '1GB', validity: '30 days', price: 480, type: 'SME' },
  { id: 'mtn-sme-2gb-30', network: 'MTN', planName: 'MTN SME 2GB', size: '2GB', validity: '30 days', price: 900, type: 'SME' },
  { id: 'mtn-sme-5gb-30', network: 'MTN', planName: 'MTN SME 5GB', size: '5GB', validity: '30 days', price: 1950, type: 'SME' },
  { id: 'mtn-share-5gb-30', network: 'MTN', planName: 'MTN Data Share 5GB', size: '5GB', validity: '30 days', price: 2850, type: 'DATA_SHARE' },
  { id: 'mtn-share-10gb-30', network: 'MTN', planName: 'MTN Data Share 10GB', size: '10GB', validity: '30 days', price: 5100, type: 'DATA_SHARE' },
  { id: 'mtn-corp-20gb-30', network: 'MTN', planName: 'MTN Corporate Gifting 20GB', size: '20GB', validity: '30 days', price: 8000, type: 'CORPORATE_GIFTING' },
  { id: 'mtn-corp-40gb-30', network: 'MTN', planName: 'MTN Corporate Gifting 40GB', size: '40GB', validity: '30 days', price: 15000, type: 'CORPORATE_GIFTING' },

  // --- Glo ---
  { id: 'glo-gift-1.5gb-30', network: 'GLO', planName: 'Glo 1.5GB', size: '1.5GB', validity: '30 days', price: 600, type: 'GIFTING' },
  { id: 'glo-gift-4.1gb-30', network: 'GLO', planName: 'Glo 4.1GB', size: '4.1GB', validity: '30 days', price: 1500, type: 'GIFTING' },
  { id: 'glo-gift-10gb-30', network: 'GLO', planName: 'Glo 10GB', size: '10GB', validity: '30 days', price: 3000, type: 'GIFTING' },
  { id: 'glo-sme-1.5gb-30', network: 'GLO', planName: 'Glo SME 1.5GB', size: '1.5GB', validity: '30 days', price: 450, type: 'SME' },
  { id: 'glo-sme-5gb-30', network: 'GLO', planName: 'Glo SME 5GB', size: '5GB', validity: '30 days', price: 1700, type: 'SME' },
  { id: 'glo-share-5.8gb-30', network: 'GLO', planName: 'Glo Data Share 5.8GB', size: '5.8GB', validity: '30 days', price: 2200, type: 'DATA_SHARE' },
  { id: 'glo-corp-18gb-30', network: 'GLO', planName: 'Glo Corporate Gifting 18GB', size: '18GB', validity: '30 days', price: 6500, type: 'CORPORATE_GIFTING' },

  // --- Airtel ---
  { id: 'airtel-gift-1.5gb-30', network: 'AIRTEL', planName: 'Airtel 1.5GB', size: '1.5GB', validity: '30 days', price: 650, type: 'GIFTING' },
  { id: 'airtel-gift-4gb-30', network: 'AIRTEL', planName: 'Airtel 4GB', size: '4GB', validity: '30 days', price: 2000, type: 'GIFTING' },
  { id: 'airtel-gift-10gb-30', network: 'AIRTEL', planName: 'Airtel 10GB', size: '10GB', validity: '30 days', price: 4000, type: 'GIFTING' },
  { id: 'airtel-sme-1gb-30', network: 'AIRTEL', planName: 'Airtel SME 1GB', size: '1GB', validity: '30 days', price: 480, type: 'SME' },
  { id: 'airtel-sme-5gb-30', network: 'AIRTEL', planName: 'Airtel SME 5GB', size: '5GB', validity: '30 days', price: 1900, type: 'SME' },
  { id: 'airtel-share-6gb-30', network: 'AIRTEL', planName: 'Airtel Data Share 6GB', size: '6GB', validity: '30 days', price: 2500, type: 'DATA_SHARE' },
  { id: 'airtel-corp-25gb-30', network: 'AIRTEL', planName: 'Airtel Corporate Gifting 25GB', size: '25GB', validity: '30 days', price: 8500, type: 'CORPORATE_GIFTING' },

  // --- 9mobile ---
  { id: '9mobile-gift-1.5gb-30', network: '9MOBILE', planName: '9mobile 1.5GB', size: '1.5GB', validity: '30 days', price: 700, type: 'GIFTING' },
  { id: '9mobile-gift-4.5gb-30', network: '9MOBILE', planName: '9mobile 4.5GB', size: '4.5GB', validity: '30 days', price: 2000, type: 'GIFTING' },
  { id: '9mobile-sme-1.5gb-30', network: '9MOBILE', planName: '9mobile SME 1.5GB', size: '1.5GB', validity: '30 days', price: 550, type: 'SME' },
  { id: '9mobile-share-5gb-30', network: '9MOBILE', planName: '9mobile Data Share 5GB', size: '5GB', validity: '30 days', price: 2300, type: 'DATA_SHARE' }
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
