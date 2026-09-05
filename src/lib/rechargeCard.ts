export interface RechargeCard {
  serial: string;
  pin: string;
  denomination: number;
}

function randomDigits(length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => v % 10).join('');
}

export function generateRechargeCards(
  network: string,
  denomination: number,
  quantity: number
): RechargeCard[] {
  const prefix = network.slice(0, 2).toUpperCase();
  return Array.from({ length: quantity }, () => ({
    serial: `${prefix}${randomDigits(12)}`,
    pin: randomDigits(14),
    denomination
  }));
}

export function cardsToText(network: string, cards: RechargeCard[]): string {
  const lines = [
    `${network} recharge cards`,
    `Generated: ${new Date().toLocaleString('en-NG')}`,
    `Quantity: ${cards.length}`,
    '',
    'Serial'.padEnd(18) + 'PIN'.padEnd(18) + 'Denomination',
    '-'.repeat(48)
  ];
  for (const card of cards) {
    lines.push(card.serial.padEnd(18) + card.pin.padEnd(18) + `₦${card.denomination}`);
  }
  return lines.join('\n');
}
