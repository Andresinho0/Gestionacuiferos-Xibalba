// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// Requiere js/script.js (API_BASE_URL) y SweetAlert2.
// ==========================================

const CLAVE_CORREO = 'correoRecuperacion';
const CLAVE_TOKEN = 'tokenRecuperacion';
const CLAVE_REENVIO = 'reenvioHasta';
const PAGINA_SOLICITAR = 'recuperar_contrasena.html';
const PAGINA_VERIFICAR = 'codigo-verificacion.html';
const PAGINA_CAMBIAR = 'Continuar_recuperar_contrasena.html';
const PAGINA_LOGIN = 'Inicio_sesion.html';
const SEGUNDOS_REENVIO = 60;

// --- Utilidades de almacenamiento (sessionStorage puede lanzar en modo privado) ---
function leerSesion(clave) {
  try { return sessionStorage.getItem(clave); } catch (e) { return null; }
}
function guardarSesion(clave, valor) {
  try { sessionStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ }
}
function limpiarRecuperacion() {
  try {
    sessionStorage.removeItem(CLAVE_CORREO);
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_REENVIO);
  } catch (e) { /* sin almacenamiento */ }
}

// --- Petición POST JSON → { ok, data } ---
async function postRecuperacion(ruta, body) {
  try {
    const res = await fetch(`${API_BASE_URL}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!data.mensaje && !res.ok) data.mensaje = 'Ocurrió un error. Intenta de nuevo.';
    return { ok: res.ok, data };
  } catch (error) {
    console.error('Error de red en recuperación:', error);
    return { ok: false, data: { mensaje: 'No se pudo conectar con el servidor. Revisa tu conexión.' } };
  }
}

function contrasenaValida(p) {
  return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
}

// Deshabilita un botón mientras corre una petición
async function conBotonOcupado(boton, textoOcupado, accion) {
  const original = boton.innerHTML;
  boton.disabled = true;
  boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${textoOcupado}`;
  try {
    return await accion();
  } finally {
    boton.disabled = false;
    boton.innerHTML = original;
  }
}

// --- Cuenta regresiva para "Reenviar código" ---
function marcarReenvio() {
  guardarSesion(CLAVE_REENVIO, String(Date.now() + SEGUNDOS_REENVIO * 1000));
}

let intervaloReenvio = null;
function iniciarCuentaRegresiva(boton) {
  const textoBase = '<i class="fa-solid fa-rotate-right"></i> Reenviar código';
  clearInterval(intervaloReenvio);

  const actualizar = () => {
    const hasta = Number(leerSesion(CLAVE_REENVIO)) || 0;
    const restante = Math.ceil((hasta - Date.now()) / 1000);
    if (restante > 0) {
      boton.disabled = true;
      boton.innerHTML = `${textoBase} (${restante} s)`;
    } else {
      boton.disabled = false;
      boton.innerHTML = textoBase;
      clearInterval(intervaloReenvio);
    }
  };
  actualizar();
  intervaloReenvio = setInterval(actualizar, 1000);
}

// ==========================================
// PASO 1: Solicitar código
// ==========================================
function initSolicitar(form) {
  const inputCorreo = document.getElementById('correoRecuperar');
  const boton = form.querySelector('button[type="submit"]');

  const previo = leerSesion(CLAVE_CORREO);
  if (previo) inputCorreo.value = previo;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const correo = inputCorreo.value.trim();
    if (!correo) {
      Swal.fire({ icon: 'warning', title: 'Campo vacío', text: 'Ingresa tu correo electrónico.' });
      return;
    }

    const { ok, data } = await conBotonOcupado(boton, 'Enviando...', () =>
      postRecuperacion('/recuperar/solicitar', { correo }));

    if (!ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.mensaje });
      return;
    }

    try { sessionStorage.removeItem(CLAVE_TOKEN); } catch (e) { /* sin almacenamiento */ }
    guardarSesion(CLAVE_CORREO, correo);
    marcarReenvio();

    await Swal.fire({
      icon: 'info',
      title: 'Revisa tu correo',
      text: data.mensaje || 'Si el correo está registrado, recibirás un código.',
      confirmButtonText: 'Continuar'
    });
    document.location = PAGINA_VERIFICAR;
  });
}

// ==========================================
// PASO 2: Verificar código
// ==========================================
function initVerificar(form) {
  const correo = leerSesion(CLAVE_CORREO);
  if (!correo) {
    document.location = PAGINA_SOLICITAR;
    return;
  }

  document.getElementById('correoDestino').textContent = correo;

  const inputCodigo = document.getElementById('codigoVerificacion');
  const boton = form.querySelector('button[type="submit"]');
  const botonReenviar = document.getElementById('btnReenviar');
  const enlaceOtroCorreo = document.getElementById('usarOtroCorreo');

  // Solo dígitos, máximo 6; se mantiene como string para conservar ceros a la izquierda
  inputCodigo.addEventListener('input', () => {
    inputCodigo.value = inputCodigo.value.replace(/\D/g, '').slice(0, 6);
  });

  iniciarCuentaRegresiva(botonReenviar);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const codigo = inputCodigo.value.trim();
    if (!/^\d{6}$/.test(codigo)) {
      Swal.fire({ icon: 'warning', title: 'Código incompleto', text: 'El código debe tener 6 dígitos.' });
      return;
    }

    const { ok, data } = await conBotonOcupado(boton, 'Verificando...', () =>
      postRecuperacion('/recuperar/verificar', { correo, codigo }));

    if (ok && data.token) {
      guardarSesion(CLAVE_TOKEN, data.token);
      document.location = PAGINA_CAMBIAR;
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'No se pudo verificar',
      html: `${escaparHtml(data.mensaje || 'Código inválido o expirado')}<br><br>
             <small>Si fallaste varias veces o el código venció, pide uno nuevo.</small>`
    });
    inputCodigo.select();
  });

  botonReenviar.addEventListener('click', async () => {
    const { ok, data } = await conBotonOcupado(botonReenviar, 'Enviando...', () =>
      postRecuperacion('/recuperar/solicitar', { correo }));

    if (!ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.mensaje });
      return;
    }
    marcarReenvio();
    iniciarCuentaRegresiva(botonReenviar);
    inputCodigo.value = '';
    Swal.fire({
      icon: 'info',
      title: 'Código reenviado',
      text: (data.mensaje || 'Si el correo está registrado, recibirás un código.') +
            ' El código anterior ya no es válido.'
    });
  });

  enlaceOtroCorreo.addEventListener('click', (event) => {
    event.preventDefault();
    limpiarRecuperacion();
    document.location = PAGINA_SOLICITAR;
  });
}

// ==========================================
// PASO 3: Cambiar contraseña
// ==========================================
function initCambiar(form) {
  const token = leerSesion(CLAVE_TOKEN);
  if (!token) {
    document.location = PAGINA_SOLICITAR;
    return;
  }

  const inputNueva = document.getElementById('nuevaContrasena');
  const inputConfirmar = document.getElementById('confirmarContrasena');
  const boton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nuevaContrasena = inputNueva.value;
    const confirmar = inputConfirmar.value;

    if (!contrasenaValida(nuevaContrasena)) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña débil',
        text: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
      });
      return;
    }
    if (nuevaContrasena !== confirmar) {
      Swal.fire({ icon: 'warning', title: 'No coinciden', text: 'Las contraseñas no coinciden.' });
      return;
    }

    const { ok, data } = await conBotonOcupado(boton, 'Guardando...', () =>
      postRecuperacion('/recuperar/cambiar', { token, nuevaContrasena }));

    if (ok) {
      limpiarRecuperacion();
      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
        confirmButtonText: 'Ir a iniciar sesión'
      });
      document.location = PAGINA_LOGIN;
      return;
    }

    if (data.mensaje === 'Enlace inválido o expirado') {
      limpiarRecuperacion();
      await Swal.fire({
        icon: 'error',
        title: 'Enlace inválido o expirado',
        text: 'El tiempo para cambiar la contraseña terminó o el enlace ya se usó. Solicita un código nuevo.',
        confirmButtonText: 'Volver a empezar',
        allowOutsideClick: false
      });
      document.location = PAGINA_SOLICITAR;
      return;
    }

    Swal.fire({ icon: 'error', title: 'No se pudo cambiar', text: data.mensaje });
  });
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// --- Arranque según la página ---
document.addEventListener('DOMContentLoaded', () => {
  const formSolicitar = document.getElementById('formSolicitar');
  const formVerificar = document.getElementById('formVerificar');
  const formCambiar = document.getElementById('formCambiar');

  if (formSolicitar) initSolicitar(formSolicitar);
  if (formVerificar) initVerificar(formVerificar);
  if (formCambiar) initCambiar(formCambiar);
});
