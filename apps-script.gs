function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('RSVP');

    // Si la hoja no existe, retornar array vacío
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      result.push(obj);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('RSVP') || ss.insertSheet('RSVP');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['fecha', 'invitadoId', 'nombre', 'pases', 'tipo', 'estado', 'fuente']);
    }

    var payload = JSON.parse(e.postData.contents || '{}');
    var invitadoId = payload.invitadoId || '';
    var newRow = [
      new Date(),
      invitadoId,
      payload.nombre || '',
      payload.pases || '',
      payload.tipo || '',
      payload.estado || '',
      payload.fuente || ''
    ];

    // Buscar si ya existe una fila con el mismo invitadoId (columna B = índice 1)
    var data = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(invitadoId)) {
        foundRow = i + 1; // getRange es 1-indexed
        break;
      }
    }

    if (foundRow > 0) {
      // Sobreescribir la fila existente
      sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      // Agregar nueva fila si no existe
      sheet.appendRow(newRow);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
