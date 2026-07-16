import { google } from "googleapis";
import { Readable } from "stream";

const getAuthClient = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Missing Google Service Account credentials");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
};

export async function uploadToDrive(file: File): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
  }

  const auth = getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload file
  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Failed to upload file to Google Drive");

  // Make it readable to anyone with the link
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data.webViewLink || "";
}

export async function appendRowToSheet(sheetName: string, values: string[]): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID");
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`, // Appends to the first available row
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}
