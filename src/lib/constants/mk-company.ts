/**
 * Mauna Kea International Pvt Ltd — Company constants for Legal documents
 * Source: Confirmed from actual Tax Invoice (sample invoice 2026-08-05)
 *
 * ⚠️  IMPORTANT: Before go-live, confirm bank account number and IFSC with business.
 *     SAC Code 998311 confirmed from actual invoice (was 998313 in earlier plan — CORRECTED).
 */
export const MK_COMPANY = {
  // Legal & Brand
  legalName: "Mauna Kea International Pvt Ltd",
  brand: "MAUNA KEA",
  tagline: "Executive Search & Advisory",

  // Address
  address:
    "Building No. Flat No.: D6 801, Road/Street: Golf course street, Parshavnath Exotica Apartment, Gurugram (Haryana-122011)",
  city: "Gurugram",
  state: "Haryana",
  stateCode: "06", // Haryana GST State Code

  // Tax identifiers
  gstin: "06AAUCM4115F1ZG",
  pan: "AAUCM4115F",

  // Bank details (confirm account number with business before live use)
  bank: {
    name: "HDFC Bank",
    accountNo: "99955456456456", // ⚠️ Confirm actual account number
    ifsc: "HDFC0000572",        // ⚠️ Confirm actual IFSC
    branch: "Gurugram",
  },

  // GST / Invoice config
  sacCode: "998311", // Confirmed from actual invoice (NOT 998313)
  gstRate: 18,
  reverseCharge: "No",
  currency: "INR",

  // Signatory
  authorisedSignatory: "Authorised Signatory",
  signatoryFor: "For Mauna Kea International Pvt Ltd",

  // Certification
  certification: "Certified that the particulars given above are true and correct",

  // Terms & Conditions (short standard)
  termsAndConditions:
    "1. Payment due as per agreed payment terms from invoice date. " +
    "2. Interest @ 1.5% per month applicable on delayed payments. " +
    "3. Subject to Gurugram jurisdiction.",
} as const;

// Indian GST State Code lookup
export const INDIA_STATE_CODES: Record<string, string> = {
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  "assam": "18",
  "bihar": "10",
  "chhattisgarh": "22",
  "goa": "30",
  "gujarat": "24",
  "haryana": "06",
  "himachal pradesh": "02",
  "jharkhand": "20",
  "karnataka": "29",
  "kerala": "32",
  "madhya pradesh": "23",
  "maharashtra": "27",
  "manipur": "14",
  "meghalaya": "17",
  "mizoram": "15",
  "nagaland": "13",
  "odisha": "21",
  "punjab": "03",
  "rajasthan": "08",
  "sikkim": "11",
  "tamil nadu": "33",
  "telangana": "36",
  "tripura": "16",
  "uttar pradesh": "09",
  "uttarakhand": "05",
  "west bengal": "19",
  "delhi": "07",
  "chandigarh": "04",
  "dadra and nagar haveli": "26",
  "daman and diu": "25",
  "jammu and kashmir": "01",
  "ladakh": "38",
  "lakshadweep": "31",
  "puducherry": "34",
  "andaman and nicobar": "35",
};

export function getStateCode(stateName: string | null | undefined): string {
  if (!stateName) return "";
  return INDIA_STATE_CODES[stateName.toLowerCase().trim()] ?? "";
}
