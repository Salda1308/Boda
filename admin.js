const STORAGE_GUESTS_KEY = 'boda_invitados_locales';
const STORAGE_RSVP_KEY = 'boda_rsvp_confirmaciones';
const ADMIN_PASS = 'boda2026';

const form = document.getElementById('guest-form');
const statusEl = document.getElementById('form-status');
const guestListEl = document.getElementById('guest-list');
const btnExport = document.getElementById('btn-export');

function generarId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function leerJSONSeguro(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave) || '[]');
  } catch {
    return [];
  }
}

function invitadosLocales() {
  return leerJSONSeguro(STORAGE_GUESTS_KEY);
}

function confirmacionesLocales() {
  return leerJSONSeguro(STORAGE_RSVP_KEY);
}

function guardarInvitados(arr) {
  localStorage.setItem(STORAGE_GUESTS_KEY, JSON.stringify(arr));
}

function guardarConfirmacionesLocales(arr) {
  localStorage.setItem(STORAGE_RSVP_KEY, JSON.stringify(arr));
}

async function cargarConfirmacionesRemotas() {
  if (window.BODA_CONFIG && window.BODA_CONFIG.rsvpEndpoint) {
    try {
      if(statusEl) statusEl.innerText = "Sincronizando RSVPs...";
      const res = await fetch(window.BODA_CONFIG.rsvpEndpoint);
      if (res.ok) {
        const remotas = await res.json();
        if (Array.isArray(remotas)) {
          const locales = confirmacionesLocales();
          const mapa = new Map();
          // Dar prioridad a lo remoto
          locales.forEach(c => mapa.set(String(c.invitadoId), c));
          remotas.forEach(c => mapa.set(String(c.invitadoId), c));
          guardarConfirmacionesLocales([...mapa.values()]);
        }
        if(statusEl) statusEl.innerText = "Sincronizado correctamente.";
        setTimeout(() => { if (statusEl && statusEl.innerText === 'Sincronizado correctamente.') statusEl.innerText = ''; }, 3000);
      }
    } catch(e) {
      console.error("Error sincronizando:", e);
      if(statusEl) statusEl.innerText = "Usando datos locales (Error de conexión).";
    }
  }
}

function crearLinkPerfil(inv) {
  // Pasa los datos por URL para que el celular del invitado sepa su nombre sin descargar datos locales
  return `index.html?invitado=${encodeURIComponent(inv.id)}&n=${encodeURIComponent(inv.nombre)}&p=${inv.pases}&t=${encodeURIComponent(inv.tipo)}`;
}

function copiar(texto) {
  navigator.clipboard.writeText(texto).then(() => {
    statusEl.innerText = 'Link copiado al portapapeles.';
  });
}

function renderInvitados() {
  const invitados = invitadosLocales();
  const confirmaciones = confirmacionesLocales();

  if (!invitados.length) {
    guestListEl.innerHTML = '<p style="padding: 1rem; color: var(--ink-soft);">No hay perfiles locales todavia. Crea uno para empezar.</p>';
    return;
  }

  guestListEl.innerHTML = invitados.map((inv) => {
    const link = crearLinkPerfil(inv);
    let basePath = window.location.pathname;
    basePath = basePath.replace(/\/admin(\.html)?\/?$/, '/');
    if (!basePath.endsWith('/')) {
        basePath += '/';
    }
    const fullLink = window.location.origin + basePath + link;
    
    // Evaluar estado RSVP convirtiendo ambos a string para evitar errores por tipos de datos
    const rsvp = confirmaciones.find(c => String(c.invitadoId) === String(inv.id));
    let badge = '<span style="color: #999; border: 1px solid #777; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">Sin confirmar</span>';
    if(rsvp) {
        if(rsvp.estado === 'si_asistire') {
            badge = '<span style="color: #10b981; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">Confirmó</span>';
        } else {
            badge = '<span style="color: #ef4444; border: 1px solid #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">No asistirá</span>';
        }
    }

    return `
      <article class="item" style="background: rgba(255,255,255,0.03);">
        <div class="item-head">
          <strong style="color: white">${inv.nombre}</strong>
          <div>${badge}</div>
        </div>
        <small>ID: ${inv.id} | ${inv.tipo} | ${inv.pases} pase(s)</small>
        <div class="item-actions">
          <a href="${link}" target="_blank" rel="noopener noreferrer">Ver</a>
          <button data-copy="${fullLink}">Copiar Link</button>
          <button data-delete="${inv.id}">Eliminar</button>
        </div>
      </article>
    `;
  }).join('');

  guestListEl.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copiar(btn.dataset.copy));
  });

  guestListEl.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      const filtrados = invitadosLocales().filter((item) => item.id !== id);
      guardarInvitados(filtrados);
      statusEl.innerText = 'Perfil eliminado.';
      renderInvitados();
    });
  });
}



form.addEventListener('submit', (event) => {
  event.preventDefault();
  const id = document.getElementById('guest-id').value.trim();
  const nombre = document.getElementById('guest-name').value.trim();
  const pases = Number(document.getElementById('guest-pases').value);
  const tipo = document.getElementById('guest-type').value;

  if (!id || !nombre || pases < 1) {
    statusEl.innerText = 'Completa todos los campos correctamente.';
    statusEl.style.color = '#e74c3c';
    return;
  }

  const invitados = invitadosLocales();
  if (invitados.some((item) => item.id === id)) {
    statusEl.innerText = 'Ese ID ya existe, usa otro diferente.';
    statusEl.style.color = '#e74c3c';
    return;
  }

  invitados.push({ id, nombre, pases, tipo });
  guardarInvitados(invitados);
  form.reset();
  document.getElementById('guest-pases').value = '1';
  document.getElementById('guest-id').value = generarId();
  statusEl.innerText = 'Perfil creado exitosamente.';
  statusEl.style.color = 'var(--accent)';
  renderInvitados();
});



// Inicializar y renderizar (sincronizando backend si existe)
async function inicializarAdmin() {
  const guestIdInput = document.getElementById('guest-id');
  if (guestIdInput) guestIdInput.value = generarId();
  await cargarConfirmacionesRemotas();
  renderInvitados();
}
inicializarAdmin();

// Basic Frontend Auth
function checkLogin() {
  const pass = document.getElementById('admin-pass').value;
  const loginErr = document.getElementById('login-err');
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem('admin_auth', 'true');
    document.getElementById('login-overlay').style.display = 'none';
  } else {
    loginErr.innerText = 'Contraseña incorrecta';
  }
}

if(sessionStorage.getItem('admin_auth') === 'true') {
  const overlay = document.getElementById('login-overlay');
  if(overlay) overlay.style.display = 'none';
}

const passInput = document.getElementById('admin-pass');
if(passInput) {
    passInput.addEventListener('keypress', function(e) {
        if(e.key === 'Enter') checkLogin();
    });
}
