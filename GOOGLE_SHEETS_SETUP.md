# Configurar guardado de confirmaciones en Google Sheets

## 1) Crea la hoja
1. Abre Google Sheets y crea un archivo nuevo.
2. Nombra una hoja como RSVP.

## 2) Crea el Apps Script
1. En el Sheet ve a Extensiones > Apps Script.
2. Borra el contenido y pega el archivo apps-script.gs de este proyecto.
3. Guarda el proyecto.

## 3) Publica como Web App
1. Ve a Implementar > Nueva implementacion.
2. Tipo: Aplicacion web.
3. Ejecutar como: tu cuenta.
4. Quien tiene acceso: Cualquiera.
5. Implementa y copia la URL final (termina en /exec).

## 4) Pega la URL en config.js
En config.js, coloca:

rsvpEndpoint: "https://script.google.com/macros/s/.../exec"

## 5) Prueba
1. Abre una invitacion con opening.html?invitado=inv001
2. Confirma SI o NO.
3. Verifica que aparezca una fila nueva en tu Google Sheet.

## Notas
- Sin endpoint, la confirmacion se guarda localmente en el navegador.
- Con endpoint, se guarda en Google Sheets y tambien localmente como respaldo.
- Si cambias de navegador o dispositivo, los datos locales no se sincronizan.
