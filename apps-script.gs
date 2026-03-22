function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('RSVP') || ss.insertSheet('RSVP');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['fecha', 'invitadoId', 'nombre', 'pases', 'tipo', 'estado', 'fuente']);
    }

    var payload = JSON.parse(e.postData.contents || '{}');
    sheet.appendRow([
      new Date(),
      payload.invitadoId || '',
      payload.nombre || '',
      payload.pases || '',
      payload.tipo || '',
      payload.estado || '',
      payload.fuente || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
