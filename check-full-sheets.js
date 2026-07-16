require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

async function checkSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  
  try {
    const resCandidate = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Form filled by Candidate",
    });
    console.log("--- CANDIDATE SHEET ---");
    const values = resCandidate.data.values || [];
    console.log("Total rows found:", values.length);
    if (values.length > 1) {
      console.log("Last row:", values[values.length - 1]);
    }
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

checkSheets();
