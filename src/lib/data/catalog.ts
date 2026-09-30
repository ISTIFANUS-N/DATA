export type Network = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';

export const NETWORKS: { code: Network; label: string; color: string; bgColor: string; logo: string }[] = [
  {
    code: 'MTN', label: 'MTN', color: '#FFCB05', bgColor: '#FFF9E0',
    // MTN yellow sun-burst mark — simplified SVG
    logo: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#FFCB05"/><text x="100" y="130" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="68" fill="#002B5B">MTN</text></svg>`
  },
  {
    code: 'GLO', label: 'Glo', color: '#00A651', bgColor: '#E6F7EF',
    logo: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#00A651"/><text x="100" y="130" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="72" fill="#ffffff">glo</text></svg>`
  },
  {
    code: 'AIRTEL', label: 'Airtel', color: '#ED1C24', bgColor: '#FDEAEA',
    logo: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#ED1C24"/><text x="100" y="125" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="46" fill="#ffffff">airtel</text></svg>`
  },
  {
    code: '9MOBILE', label: '9mobile', color: '#00A99D', bgColor: '#E0F6F5',
    logo: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#006D5B"/><text x="100" y="115" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="52" fill="#ffffff">9mobile</text></svg>`
  }
];

export interface DataPlan {
  id: string;
  network: Network;
  apiPlanId: string;   // the ID sent to the VTU provider API
  sizeValue: number;   // numeric part of the size (e.g. 1, 500)
  sizeUnit: 'MB' | 'GB'; // unit
  validity: string;
  price: number;
  type: DataPlanType;
  isActive: boolean;
}

// Derived display: "1GB", "500MB"
export function planSizeLabel(plan: DataPlan): string {
  return `${plan.sizeValue}${plan.sizeUnit}`;
}

export type DataPlanType = 'GIFTING' | 'SME' | 'DATA_SHARE' | 'CORPORATE_GIFTING';

export const DATA_PLAN_TYPES: { code: DataPlanType; label: string; blurb: string }[] = [
  { code: 'GIFTING', label: 'Gifting', blurb: 'Standard data plan, works like your normal bundle' },
  { code: 'SME', label: 'SME', blurb: 'Cheaper, high-volume — no rollover, no data top-up while active' },
  { code: 'DATA_SHARE', label: 'Data Share', blurb: 'Share the bundle across multiple devices/lines' },
  { code: 'CORPORATE_GIFTING', label: 'Corporate Gifting', blurb: 'Bulk plans for teams and businesses' }
];

export const DEFAULT_DATA_PLANS: DataPlan[] = [
  // ── MTN GIFTING ──────────────────────────────────────────────────────────
  { id: 'mtn-gift-1gb-30',  network: 'MTN', apiPlanId: 'mtn-gifting-1gb',   sizeValue: 1,   sizeUnit: 'GB', validity: '30 days',  price: 650,  type: 'GIFTING',          isActive: true },
  { id: 'mtn-gift-2gb-30',  network: 'MTN', apiPlanId: 'mtn-gifting-2gb',   sizeValue: 2,   sizeUnit: 'GB', validity: '30 days',  price: 1200, type: 'GIFTING',          isActive: true },
  { id: 'mtn-gift-5gb-30',  network: 'MTN', apiPlanId: 'mtn-gifting-5gb',   sizeValue: 5,   sizeUnit: 'GB', validity: '30 days',  price: 2500, type: 'GIFTING',          isActive: true },
  { id: 'mtn-gift-10gb-30', network: 'MTN', apiPlanId: 'mtn-gifting-10gb',  sizeValue: 10,  sizeUnit: 'GB', validity: '30 days',  price: 4500, type: 'GIFTING',          isActive: true },
  // ── MTN SME ──────────────────────────────────────────────────────────────
  { id: 'mtn-sme-500mb-30', network: 'MTN', apiPlanId: 'mtn-sme-500mb',     sizeValue: 500, sizeUnit: 'MB', validity: '30 days',  price: 135,  type: 'SME',              isActive: true },
  { id: 'mtn-sme-1gb-30',   network: 'MTN', apiPlanId: 'mtn-sme-1gb',       sizeValue: 1,   sizeUnit: 'GB', validity: '30 days',  price: 270,  type: 'SME',              isActive: true },
  { id: 'mtn-sme-2gb-30',   network: 'MTN', apiPlanId: 'mtn-sme-2gb',       sizeValue: 2,   sizeUnit: 'GB', validity: '30 days',  price: 540,  type: 'SME',              isActive: true },
  { id: 'mtn-sme-5gb-30',   network: 'MTN', apiPlanId: 'mtn-sme-5gb',       sizeValue: 5,   sizeUnit: 'GB', validity: '30 days',  price: 1350, type: 'SME',              isActive: true },
  { id: 'mtn-sme-10gb-30',  network: 'MTN', apiPlanId: 'mtn-sme-10gb',      sizeValue: 10,  sizeUnit: 'GB', validity: '30 days',  price: 2700, type: 'SME',              isActive: true },
  // ── MTN DATA SHARE ───────────────────────────────────────────────────────
  { id: 'mtn-share-5gb-30', network: 'MTN', apiPlanId: 'mtn-share-5gb',     sizeValue: 5,   sizeUnit: 'GB', validity: '30 days',  price: 2850, type: 'DATA_SHARE',       isActive: true },
  { id: 'mtn-share-10gb-30',network: 'MTN', apiPlanId: 'mtn-share-10gb',    sizeValue: 10,  sizeUnit: 'GB', validity: '30 days',  price: 5100, type: 'DATA_SHARE',       isActive: true },
  // ── MTN CORPORATE GIFTING ────────────────────────────────────────────────
  { id: 'mtn-corp-20gb-30', network: 'MTN', apiPlanId: 'mtn-corp-gift-20gb', sizeValue: 20, sizeUnit: 'GB', validity: '30 days',  price: 8000, type: 'CORPORATE_GIFTING', isActive: true },
  { id: 'mtn-corp-40gb-30', network: 'MTN', apiPlanId: 'mtn-corp-gift-40gb', sizeValue: 40, sizeUnit: 'GB', validity: '30 days',  price: 15000,type: 'CORPORATE_GIFTING', isActive: true },

  // ── GLO ──────────────────────────────────────────────────────────────────
  { id: 'glo-gift-1.5gb-30',  network: 'GLO', apiPlanId: 'glo-gifting-1.5gb',  sizeValue: 1.5, sizeUnit: 'GB', validity: '30 days', price: 600,  type: 'GIFTING',    isActive: true },
  { id: 'glo-gift-4.1gb-30',  network: 'GLO', apiPlanId: 'glo-gifting-4.1gb',  sizeValue: 4.1, sizeUnit: 'GB', validity: '30 days', price: 1500, type: 'GIFTING',    isActive: true },
  { id: 'glo-gift-10gb-30',   network: 'GLO', apiPlanId: 'glo-gifting-10gb',   sizeValue: 10,  sizeUnit: 'GB', validity: '30 days', price: 3000, type: 'GIFTING',    isActive: true },
  { id: 'glo-sme-1.5gb-30',   network: 'GLO', apiPlanId: 'glo-sme-1.5gb',      sizeValue: 1.5, sizeUnit: 'GB', validity: '30 days', price: 450,  type: 'SME',        isActive: true },
  { id: 'glo-sme-5gb-30',     network: 'GLO', apiPlanId: 'glo-sme-5gb',        sizeValue: 5,   sizeUnit: 'GB', validity: '30 days', price: 1700, type: 'SME',        isActive: true },
  { id: 'glo-share-5.8gb-30', network: 'GLO', apiPlanId: 'glo-share-5.8gb',    sizeValue: 5.8, sizeUnit: 'GB', validity: '30 days', price: 2200, type: 'DATA_SHARE', isActive: true },
  { id: 'glo-corp-18gb-30',   network: 'GLO', apiPlanId: 'glo-corp-gift-18gb', sizeValue: 18,  sizeUnit: 'GB', validity: '30 days', price: 6500, type: 'CORPORATE_GIFTING', isActive: true },

  // ── AIRTEL ───────────────────────────────────────────────────────────────
  { id: 'airtel-gift-1.5gb-30', network: 'AIRTEL', apiPlanId: 'airtel-gifting-1.5gb',  sizeValue: 1.5, sizeUnit: 'GB', validity: '30 days', price: 650,  type: 'GIFTING',    isActive: true },
  { id: 'airtel-gift-4gb-30',   network: 'AIRTEL', apiPlanId: 'airtel-gifting-4gb',    sizeValue: 4,   sizeUnit: 'GB', validity: '30 days', price: 2000, type: 'GIFTING',    isActive: true },
  { id: 'airtel-gift-10gb-30',  network: 'AIRTEL', apiPlanId: 'airtel-gifting-10gb',   sizeValue: 10,  sizeUnit: 'GB', validity: '30 days', price: 4000, type: 'GIFTING',    isActive: true },
  { id: 'airtel-sme-1gb-30',    network: 'AIRTEL', apiPlanId: 'airtel-sme-1gb',        sizeValue: 1,   sizeUnit: 'GB', validity: '30 days', price: 480,  type: 'SME',        isActive: true },
  { id: 'airtel-sme-5gb-30',    network: 'AIRTEL', apiPlanId: 'airtel-sme-5gb',        sizeValue: 5,   sizeUnit: 'GB', validity: '30 days', price: 1900, type: 'SME',        isActive: true },
  { id: 'airtel-share-6gb-30',  network: 'AIRTEL', apiPlanId: 'airtel-share-6gb',      sizeValue: 6,   sizeUnit: 'GB', validity: '30 days', price: 2500, type: 'DATA_SHARE', isActive: true },
  { id: 'airtel-corp-25gb-30',  network: 'AIRTEL', apiPlanId: 'airtel-corp-gift-25gb', sizeValue: 25,  sizeUnit: 'GB', validity: '30 days', price: 8500, type: 'CORPORATE_GIFTING', isActive: true },

  // ── 9MOBILE ──────────────────────────────────────────────────────────────
  { id: '9mobile-gift-1.5gb-30', network: '9MOBILE', apiPlanId: '9mobile-gifting-1.5gb', sizeValue: 1.5, sizeUnit: 'GB', validity: '30 days', price: 700,  type: 'GIFTING',    isActive: true },
  { id: '9mobile-gift-4.5gb-30', network: '9MOBILE', apiPlanId: '9mobile-gifting-4.5gb', sizeValue: 4.5, sizeUnit: 'GB', validity: '30 days', price: 2000, type: 'GIFTING',    isActive: true },
  { id: '9mobile-sme-1.5gb-30',  network: '9MOBILE', apiPlanId: '9mobile-sme-1.5gb',     sizeValue: 1.5, sizeUnit: 'GB', validity: '30 days', price: 550,  type: 'SME',        isActive: true },
  { id: '9mobile-share-5gb-30',  network: '9MOBILE', apiPlanId: '9mobile-share-5gb',     sizeValue: 5,   sizeUnit: 'GB', validity: '30 days', price: 2300, type: 'DATA_SHARE', isActive: true }
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
  isActive: boolean;
}

export const DEFAULT_CABLE_PLANS: CablePlan[] = [
  { id: 'dstv-padi', provider: 'DSTV', packageName: 'DStv Padi', price: 4400, isActive: true },
  { id: 'dstv-yanga', provider: 'DSTV', packageName: 'DStv Yanga', price: 6000, isActive: true },
  { id: 'dstv-compact', provider: 'DSTV', packageName: 'DStv Compact', price: 19000, isActive: true },
  { id: 'gotv-smallie', provider: 'GOTV', packageName: 'GOtv Smallie', price: 1900, isActive: true },
  { id: 'gotv-jinja', provider: 'GOTV', packageName: 'GOtv Jinja', price: 3900, isActive: true },
  { id: 'gotv-max', provider: 'GOTV', packageName: 'GOtv Max', price: 8500, isActive: true },
  { id: 'startimes-nova', provider: 'STARTIMES', packageName: 'StarTimes Nova', price: 1900, isActive: true },
  { id: 'startimes-basic', provider: 'STARTIMES', packageName: 'StarTimes Basic', price: 3700, isActive: true }
];

// Bulk SMS pricing (₦2.5 kobo per unit = ₦0.025, billed per-SMS)
// Rate from the live stefanxdata.com site.
export interface BulkSmsPackage {
  id: string;
  units: number;
  price: number; // total price for the bundle
  isActive: boolean;
}

export const BULK_SMS_PACKAGES: BulkSmsPackage[] = [
  { id: 'sms-100', units: 100, price: 3, isActive: true },
  { id: 'sms-500', units: 500, price: 13, isActive: true },
  { id: 'sms-1000', units: 1000, price: 25, isActive: true },
  { id: 'sms-5000', units: 5000, price: 125, isActive: true },
  { id: 'sms-10000', units: 10000, price: 250, isActive: true },
  { id: 'sms-50000', units: 50000, price: 1250, isActive: true }
];

// Result checker e-PIN catalog (WAEC, NECO, NABTEB, JAMB)
export type ResultCheckerType = 'WAEC' | 'NECO' | 'NABTEB' | 'JAMB';

export interface ResultCheckerPin {
  id: string;
  type: ResultCheckerType;
  label: string;
  price: number;
  isActive: boolean;
}

export const RESULT_CHECKER_PINS: ResultCheckerPin[] = [
  { id: 'waec-pin', type: 'WAEC', label: 'WAEC Result Checker PIN', price: 2000, isActive: true },
  { id: 'neco-pin', type: 'NECO', label: 'NECO Result Checker PIN', price: 1000, isActive: true },
  { id: 'nabteb-pin', type: 'NABTEB', label: 'NABTEB Result Checker PIN', price: 900, isActive: true },
  { id: 'jamb-pin', type: 'JAMB', label: 'JAMB Result Checker / e-PIN', price: 3500, isActive: true }
];
