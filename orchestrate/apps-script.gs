// Paste into a Google Sheet: Extensions → Apps Script. Deploy → New deployment → Web app,
// Execute as: Me, Who has access: Anyone. Copy the /exec URL into config.js (LIVE_URL).
// Clear the sheet (keep row 1) between training sessions.

function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // 30 people submitting at once must not overwrite each other's rows
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = sheet_();
    if (sh.getLastRow() === 0) sh.appendRow(["time", "sid", "name", "role", "mission", "data"]);
    sh.appendRow([new Date(), String(d.sid).slice(0, 20), String(d.name).slice(0, 30), String(d.role).slice(0, 40),
      String(d.mission).slice(0, 10), JSON.stringify(d.data).slice(0, 5000)]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify(sheet_().getDataRange().getValues()))
    .setMimeType(ContentService.MimeType.JSON);
}
