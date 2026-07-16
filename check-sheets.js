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
    const resClient = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Form filled by Client!A1:Z50",
    });
    console.log("--- CLIENT SHEET ---");
    console.log(resClient.data.values || "EMPTY");

    const resCandidate = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Form filled by Candidate!A1:Z50",
    });
    console.log("--- CANDIDATE SHEET ---");
    console.log(resCandidate.data.values || "EMPTY");
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

checkSheets();
