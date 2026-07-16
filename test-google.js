require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

async function testGoogle() {
  console.log("Starting test...");
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  console.log("Email:", email ? "Found" : "Missing");
  console.log("Key:", key ? "Found" : "Missing");
  console.log("Sheet ID:", spreadsheetId ? "Found" : "Missing");

  if (!email || !key) {
    console.log("Missing credentials!");
    return;
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  
  try {
    console.log("Attempting to get spreadsheet info...");
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("Success! Spreadsheet title:", res.data.properties.title);
    
    console.log("Tabs available:");
    res.data.sheets.forEach(s => console.log("- '" + s.properties.title + "'"));

    console.log("\nAttempting to append a test row to 'Form filled by Client'...");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Form filled by Client!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["TEST ROW", "DELETE ME"]] },
    });
    console.log("Successfully appended test row!");

  } catch (error) {
    console.error("\nERROR OCCURRED:");
    console.error(error.message);
  }
}

testGoogle();
