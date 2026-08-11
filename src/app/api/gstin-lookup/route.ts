import { NextRequest, NextResponse } from "next/server";

// State codes per GSTIN spec
const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh (New)", "38": "Ladakh", "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

function parseGstinLocally(gstin: string): {
  stateCode: string;
  stateName: string;
  pan: string;
  entityType: string;
} {
  const stateCode = gstin.substring(0, 2);
  const pan = gstin.substring(2, 12);
  const entityTypeChar = gstin.charAt(12);
  const entityTypeMap: Record<string, string> = {
    "1": "Proprietorship", "2": "Partnership",
    "3": "HUF", "4": "Company / LLP",
    "5": "Board of Trustees", "6": "AOP / BOI",
    "7": "Government Entity", "9": "PSU",
    "A": "AOP", "B": "Body of Individuals",
    "C": "Company", "F": "Firm / LLP",
    "G": "Government", "H": "HUF",
    "L": "Local Authority", "P": "Personal / Proprietorship",
    "T": "Trust",
  };
  return {
    stateCode,
    stateName: GST_STATE_CODES[stateCode] || "Unknown",
    pan,
    entityType: entityTypeMap[entityTypeChar] || "Business",
  };
}

export async function GET(request: NextRequest) {
  const gstin = request.nextUrl.searchParams.get("gstin")?.trim().toUpperCase();

  if (!gstin || gstin.length !== 15) {
    return NextResponse.json({ error: "Invalid GSTIN — must be 15 characters" }, { status: 400 });
  }

  // Basic format check: 2 digits + 10 alphanum PAN + 1 alphanum + Z + 1 alphanum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 });
  }

  // Local parse — always available
  const localData = parseGstinLocally(gstin);

  // Try external API for enriched data (legalName, address)
  // Using GST Search API — no key required for basic lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.gstincheck.co.in/check/${process.env.GST_API_KEY || "public"}/${gstin}`,
      { signal: controller.signal, headers: { "Content-Type": "application/json" } }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.data) {
        const d = data.data;
        return NextResponse.json({
          gstin,
          legalName: d.lgnm || d.tradeNam || null,
          tradeName: d.tradeNam || null,
          registeredAddress: d.pradr?.addr
            ? [d.pradr.addr.bno, d.pradr.addr.flno, d.pradr.addr.bnm, d.pradr.addr.st, d.pradr.addr.loc]
                .filter(Boolean).join(", ")
            : null,
          city: d.pradr?.addr?.dst || d.pradr?.addr?.loc || null,
          state: d.pradr?.addr?.stcd ? (GST_STATE_CODES[d.pradr.addr.stcd] || localData.stateName) : localData.stateName,
          pinCode: d.pradr?.addr?.pncd || null,
          pan: localData.pan,
          stateCode: localData.stateCode,
          entityType: localData.entityType,
          status: d.sts || "Active",
          fromApi: true,
        });
      }
    }
  } catch {
    // External API failed — fall through to local parse
  }

  // Return local parse only
  return NextResponse.json({
    gstin,
    legalName: null,
    tradeName: null,
    registeredAddress: null,
    city: null,
    state: localData.stateName,
    pinCode: null,
    pan: localData.pan,
    stateCode: localData.stateCode,
    entityType: localData.entityType,
    status: null,
    fromApi: false,
    note: "State derived from GSTIN. Legal name lookup unavailable — please enter manually.",
  });
}
