// Brand styling for every network, electricity company (DisCo) and cable TV provider.
//
// Official logos: drop a file named after the code into static/logos/ (svg or png),
// e.g. mtn.svg, ikedc.png, dstv.svg — it is picked up automatically (see static/logos/README.txt).
// Until a file exists, a clean brand-coloured badge is shown instead.

export interface Brand {
  code: string;
  label: string;
  bg: string;     // badge background
  fg: string;     // badge text colour
  short: string;  // text on the badge
}

export const BRANDS: Record<string, Brand> = {
  // Networks (MTN/Glo/Airtel/9mobile keep their mark from NETWORKS in catalog.ts)
  MTN:     { code: 'MTN',     label: 'MTN',     bg: '#FFCB05', fg: '#002B5B', short: 'MTN' },
  GLO:     { code: 'GLO',     label: 'Glo',     bg: '#00A651', fg: '#FFFFFF', short: 'glo' },
  AIRTEL:  { code: 'AIRTEL',  label: 'Airtel',  bg: '#ED1C24', fg: '#FFFFFF', short: 'airtel' },
  '9MOBILE': { code: '9MOBILE', label: '9mobile', bg: '#006D5B', fg: '#FFFFFF', short: '9mobile' },

  // Electricity distribution companies
  IKEDC:  { code: 'IKEDC',  label: 'Ikeja Electric',        bg: '#D7262D', fg: '#FFFFFF', short: 'IKEDC' },
  EKEDC:  { code: 'EKEDC',  label: 'Eko Electric',          bg: '#0072BC', fg: '#FFFFFF', short: 'EKEDC' },
  AEDC:   { code: 'AEDC',   label: 'Abuja Electric',        bg: '#0B8A4B', fg: '#FFFFFF', short: 'AEDC' },
  PHEDC:  { code: 'PHEDC',  label: 'Port Harcourt Electric', bg: '#B3202B', fg: '#FFFFFF', short: 'PHEDC' },
  KEDCO:  { code: 'KEDCO',  label: 'Kano Electric',         bg: '#00843D', fg: '#FFFFFF', short: 'KEDCO' },
  IBEDC:  { code: 'IBEDC',  label: 'Ibadan Electric',       bg: '#1B4F9C', fg: '#FFFFFF', short: 'IBEDC' },
  EEDC:   { code: 'EEDC',   label: 'Enugu Electric',        bg: '#E35205', fg: '#FFFFFF', short: 'EEDC' },
  JEDC:   { code: 'JEDC',   label: 'Jos Electric',          bg: '#6B2C91', fg: '#FFFFFF', short: 'JEDC' },
  KAEDCO: { code: 'KAEDCO', label: 'Kaduna Electric',       bg: '#0F7B5F', fg: '#FFFFFF', short: 'KAEDCO' },
  YEDC:   { code: 'YEDC',   label: 'Yola Electric',         bg: '#7A3E9D', fg: '#FFFFFF', short: 'YEDC' },
  BEDC:   { code: 'BEDC',   label: 'Benin Electric',        bg: '#C98A00', fg: '#FFFFFF', short: 'BEDC' },
  ABA:    { code: 'ABA',    label: 'Aba Power',             bg: '#D9482B', fg: '#FFFFFF', short: 'ABA' },

  // Cable TV
  DSTV:      { code: 'DSTV',      label: 'DStv',      bg: '#0A4DA2', fg: '#FFFFFF', short: 'DStv' },
  GOTV:      { code: 'GOTV',      label: 'GOtv',      bg: '#6FB000', fg: '#FFFFFF', short: 'GOtv' },
  STARTIMES: { code: 'STARTIMES', label: 'StarTimes', bg: '#F58220', fg: '#FFFFFF', short: 'StarTimes' }
};

export function brandFor(code: string): Brand {
  return BRANDS[code] ?? { code, label: code, bg: '#64748b', fg: '#FFFFFF', short: code.slice(0, 5) };
}
