/**
 * lib/number-to-words.ts
 *
 * Converts numeric amounts (in INR) to words following standard Indian numbering rules
 * (Lakhs, Crores) for tax invoices.
 *
 * Example: 4560000 -> "Rupees Forty Five Lakh Sixty Thousand Only"
 */

const units = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertTwoDigits(n: number): string {
  if (n < 20) return units[n];
  const tenDigit = Math.floor(n / 10);
  const unitDigit = n % 10;
  return `${tens[tenDigit]} ${units[unitDigit]}`.trim();
}

function convertThreeDigits(n: number): string {
  const hundredDigit = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundredDigit === 0) return convertTwoDigits(remainder);
  const hundredText = `${units[hundredDigit]} Hundred`;
  return remainder > 0 ? `${hundredText} ${convertTwoDigits(remainder)}` : hundredText;
}

export function numberToWordsINR(amount: number): string {
  if (!amount || amount === 0) return "Rupees Zero Only";

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const rupees = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Rupees Zero Only";

  let words = "";

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) {
    words += `${convertThreeDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (rem > 0) {
    words += `${convertThreeDigits(rem)} `;
  }

  words = words.trim();
  let result = `Rupees ${words}`;

  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }

  result += " Only";
  return isNegative ? `Minus ${result}` : result;
}
