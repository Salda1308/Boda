const STORAGE_GUESTS_KEY = 'boda_invitados_locales';
const STORAGE_RSVP_KEY = 'boda_rsvp_confirmaciones';
const ADMIN_PASS = 'boda2026';

const form = document.getElementById('guest-form');
const statusEl = document.getElementById('form-status');
const guestListEl = document.getElementById('guest-list');
const btnExport = document.getElementById('btn-export');

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

function crearLinkPerfil(id) {
  // Ahora el link lleva directo a index.html
  return `index.html?invitado=${encodeURIComponent(id)}`;
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
    const link = crearLinkPerfil(inv.id);
    const fullLink = window.location.origin + window.location.pathname.replace('admin.html', '') + link;
    
    // Evaluar estado RSVP
    const rsvp = confirmaciones.find(c => c.invitadoId === inv.id);
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
          <button data-copy="${fullLink}">Copiar WhatsApp</button>
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

function exportarAExcel() {
  const confirmaciones = confirmacionesLocales();
  const invitados = invitadosLocales().map(i => {
    const link = window.location.origin + window.location.pathname.replace('admin.html', '') + `index.html?invitado=${i.id}`;
    
    let estadoPlano = 'Sin confirmar';
    const rsvp = confirmaciones.find(c => c.invitadoId === i.id);
    if(rsvp) {
        if(rsvp.estado === 'si_asistire') estadoPlano = 'Confirmó';
        else estadoPlano = 'No asistirá';
    }

    return {
      "ID Único": i.id,
      "Nombre Invitado": i.nombre,
      "Pases": i.pases,
      "Tipo": i.tipo,
      "Estado RSVP": estadoPlano,
      "Link de Invitación (WhatsApp)": link
    }
  });

  if (!invitados.length) {
    alert("No hay invitados guardados para exportar.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(invitados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mis Invitados Boda");
  XLSX.writeFile(wb, "Lista_Invitados_Boda.xlsx");
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
  statusEl.innerText = 'Perfil creado exitosamente.';
  statusEl.style.color = 'var(--accent)';
  renderInvitados();
});

if(btnExport) {
    btnExport.addEventListener('click', exportarAExcel);
}

renderInvitados();

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
