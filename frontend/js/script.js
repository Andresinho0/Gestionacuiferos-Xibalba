// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
// Declaramos la URL base de tu API una sola vez.
const API_BASE_URL = 'https://xibalbadata-java-production.up.railway.app/api';

// ==========================================
// INICIO DE SESIÓN
// ==========================================

// Función para procesar el login
function iniciarSesion() {
  const correo = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('password').value.trim();

  if (!correo || !contrasena) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos vacíos',
      text: 'Por favor ingresa tu correo y contraseña.'
    });
    return;
  }

  const credenciales = { correo, contrasena };

  fetch(`${API_BASE_URL}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credenciales)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }
    return response.json();
  })
  .then(usuario => {
    // Guardar datos y rol en el almacenamiento del navegador
    localStorage.setItem("usuario_id", usuario.id_us);
    localStorage.setItem("usuario_nombre", usuario.nombre);
    localStorage.setItem("usuario_matricula", usuario.matricula || 'N/A');
    localStorage.setItem("usuario_telefono", usuario.telefono);
    localStorage.setItem("usuario_correo", usuario.correo);
    localStorage.setItem("usuario_rol", usuario.rol); // "administrador" u "operador"

    Swal.fire({
      icon: 'success',
      title: `Nombre: ${usuario.nombre}`,
      text: `Rol activo: ${usuario.rol}`,
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      document.location = 'Menu_MAIN.html';
    });
  })
  .catch(error => {
    console.error("Error al autenticar:", error);
    Swal.fire({
      icon: 'error',
      title: 'Acceso denegado',
      text: 'Correo o contraseña incorrectos.'
    });
  });
}

// Guardián de seguridad para proteger vistas según rol
function verificarSesion(rolRequerido = null) {
  const rolActual = localStorage.getItem("usuario_rol");

  // 1. Si no hay sesión iniciada, expulsar directo al login
  if (!rolActual) {
    document.location = 'inicio_sesion.html';
    return false;
  }

  // 2. Si requiere un rol específico y el usuario no lo cumple
  if (rolRequerido && rolActual !== rolRequerido) {
    // Ocultar inmediatamente el contenido sensible de la página
    const panel = document.querySelector('.panel');
    if (panel) {
      panel.style.display = 'none';
    }

    Swal.fire({
      icon: 'error',
      title: 'Acceso Restringido',
      text: 'No cuentas con permisos de administrador para visualizar o gestionar este módulo.',
      width: '520px', // Aumenta el tamaño del cuadro
      backdrop: 'rgba(0, 41, 72, 0.95)', // Fondo oscuro/azul institucional que cubre todo
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: '<i class="fa-solid fa-arrow-left"></i> Volver al Menú',
      confirmButtonColor: '#004982'
    }).then(() => {
      document.location = 'Menu_MAIN.html';
    });

    return false;
  }

  return true;
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  document.location = 'inicio_sesion.html';
}



// ==========================================
// CARRUSEL DE IMÁGENES
// ==========================================
let currentSlide = 0;

function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-images img');
    const totalSlides = slides.length;

    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }

    const offset = -currentSlide * 100;
    const carouselContainer = document.querySelector('.carousel-images');
    
    // Evitamos errores si estamos en una página sin carrusel
    if (carouselContainer) {
      carouselContainer.style.transform = `translateX(${offset}%)`;
    }
}

function moveSlide(step) {
    showSlide(currentSlide + step);
}

showSlide(currentSlide);
// Cambio de imagen automático cada 5 segundos
setInterval(() => moveSlide(1), 5000);


// ==========================================
// ALERTAS UNIFICADAS (Reutilización de código)
// ==========================================
// Función maestra para SweetAlert
function mostrarAlerta(titulo, icono = 'info', temporizador = null) {
    const config = { title: titulo, icon: icono };
    if (temporizador) config.timer = temporizador;
    Swal.fire(config);
}

// Mantenemos los nombres originales para no romper tu HTML, enlazados a la nueva función
const saludos = () => mostrarAlerta('Datos enviados y en espera, la confirmación puede tardar entre uno y tres días hábiles');
const confirmacion = () => mostrarAlerta('Datos enviados para almacenamiento', 'success', 2500);
const confirmacion2 = () => mostrarAlerta('Datos enviados y en espera, la confirmación puede tardar entre uno y tres días hábiles', 'success', 2500);
const confirmacion3 = () => mostrarAlerta('Alerta Resuelta', 'success', 2500);
const modificaciondatos = () => mostrarAlerta('Datos modificados con exito', 'success', 2500);
const notfoperadorr = () => {
    mostrarAlerta('Se envio una notificación al operador', 'success', 3000);
    setTimeout(() => { document.location = "tabla_mantenimiento.html"; }, 3500);
};


// ==========================================
// NAVEGACIÓN
// ==========================================
const iraMenu_Main = () => document.location = 'Menu_MAIN.html';
const inisesionprueba = () => document.location = 'inicio-sesion-prueba.html';
const menumain = () => document.location = 'Menu_MAIN.html';
const listadopozos = () => document.location = 'Listado_pozos.html';
const listadopozo = () => document.location = 'Listado_pozos.html';
const listadoOperadores = () => document.location = 'Listado_operadores.html';
const gestiondeOperacion = () => document.location = 'Gestion_de_Operacion.html';
const gestiondemtto = () => document.location = 'tabla_mantenimiento.html';
const selectacuyop = () => document.location = 'nvo-usuario-prueba.html';
const gestiondeAlerta = () => document.location = "Gestion_de_alerta.html";


// ==========================================
// PETICIONES A LA API: USUARIOS Y OPERADORES
// ==========================================

function cargaoperaciones() {
    // Apunta al endpoint de operación
    fetch(`${API_BASE_URL}/operacion`)
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener operaciones");
            return response.json();
        })
        .then(data => {
            const grid = document.querySelector('.cards-grid');
            if (!grid) return;

            grid.innerHTML = ''; // Limpiamos las tarjetas estáticas de ejemplo

            if (!data || data.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px;">No hay registros de operación disponibles.</div>';
                return;
            }

            data.forEach(op => {
                // Adaptamos las variables según lo que devuelve tu backend
                const id = op.id_op || op.id || 'N/A'; 
                const pozo = op.op_cpozo || 'Sin Pozo';
                const operador = op.op_operador || 'No asignado';
                
                // Formateamos la fecha si existe
                let fechaFormateada = 'Sin fecha';
                if (op.op_fecha_captura) {
                    const fechaObj = new Date(op.op_fecha_captura);
                    fechaFormateada = fechaObj.toLocaleString('es-MX', { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                    });
                }

                // Creamos la tarjeta
                const card = document.createElement('div');
                card.className = 'registro-card';
                card.innerHTML = `
                    <div class="registro-header">
                        <h3><i class="fa-solid fa-hashtag"></i> ID: ${id} - ${pozo}</h3>
                        <span class="badge-actividad">Captura en campo</span>
                    </div>
                    
                    <div class="registro-body">
                        <div class="detail-group">
                            <span class="detail-label"><i class="fa-solid fa-user-gear"></i> Operador</span>
                            <span class="detail-value">${operador}</span>
                        </div>

                        <div class="detail-group">
                            <span class="detail-label"><i class="fa-solid fa-clock"></i> Fecha y hora de registro</span>
                            <span class="detail-value" style="font-size: 0.95rem;">${fechaFormateada}</span>
                        </div>
                    </div>

                    <div class="registro-footer">
                        <a href="Registro_operacion.html?id=${id}" class="btn-ver">
                            <i class="fa-solid fa-eye"></i> Ver Registro
                        </a>
                        
                        <div class="acciones">
                            <a href="Editar_Operacion.html?id=${id}" title="Editar" class="icon-edit">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </a>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error al cargar operaciones:', error);
            const grid = document.querySelector('.cards-grid');
            if (grid) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #dc3545; padding: 40px;">Error al cargar las operaciones desde el servidor.</div>';
            }
        });
}

function cargaoperadores() {
  fetch(`${API_BASE_URL}/operadores`)
      .then(response => response.json())
      .then(data => {
          const tablaOperadores = document.getElementById("tabla-operadores");
          if (!tablaOperadores) return; 
          
          tablaOperadores.innerHTML = ''; 

          data.forEach(operador => {
              const fila = document.createElement("tr");
              fila.innerHTML = `
                  <td>${operador.o_matricula || 'N/A'}</td>
                  <td>${operador.o_nombre}</td>
                  <td>${operador.o_correo}</td>
                  <td>${operador.o_telefono}</td>
                  <td>
                      <a href="Modificar_operador.html?id=${operador.id}" class="edit-operador">
                       <i class="fa-solid fa-user-pen" style="color: blue;"></i>
                      </a>
                      <a href="#" onclick="borraoperador(${operador.id_o})">
                          <i class="fa-solid fa-trash" style="color: blue;"></i>
                      </a>
                  </td>
              `;
              tablaOperadores.appendChild(fila);
          });
      })
      .catch(error => console.error('Error al cargar datos:', error));
}

function borraoperador(idOperador) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Esta acción no se podrá revertir!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "No, cancelar",
    }).then((result) => {
        if (result.value || result.isConfirmed) {
            fetch(`${API_BASE_URL}/operadores/${idOperador}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("No se pudo eliminar el registro en el servidor.");
                }
                // Si el backend devuelve texto o viene vacío:
                return response.text();
            })
            .then(() => {
                Swal.fire("¡Borrado!", "El operador ha sido eliminado correctamente.", "success");
                //Se vuelve a consultar la lista DESPUÉS de que se borró
                cargaoperadores();
            })
            .catch(error => {
                console.error("Error al eliminar:", error);
                Swal.fire("Error", "Ocurrió un problema al intentar eliminar el operador.", "error");
            });
        }
    });
}

function cargardatos() {
  const urlParams = new URLSearchParams(window.location.search);
  const id_operador = urlParams.get("id");
  
  if (!id_operador) return;

  fetch(`${API_BASE_URL}/operadores/${id_operador}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  })
  .then(response => response.json())
  .then(data => {
      document.getElementById("nombre").value = data.o_nombre;
      document.getElementById("email").value = data.o_correo;
      document.getElementById("tel").value = data.o_telefono;
  })
  .catch(error => console.error('Error al cargar operador:', error));
}

function modificacionoperador() {
  const urlParams = new URLSearchParams(window.location.search);
  const id_operador = urlParams.get("id");
  
  const actualizaOperador = {
      o_nombre: document.getElementById('nombre').value,
      o_matricula: document.getElementById('matricula').value,
      o_correo: document.getElementById('email').value,
      o_contrasena: document.getElementById('pwd').value,
      o_telefono: document.getElementById('tel').value
  };

  fetch(`${API_BASE_URL}/operadores/${id_operador}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actualizaOperador)
  })
  .then(response => response.json())
  .then(() => {
      mostrarAlerta('Datos de operador modificados con éxito', 'success', 2500);
      setTimeout(() => { document.location = "Listado_operadores.html"; }, 2500);
  })
  .catch(error => console.error('Error al modificar:', error));
}

function crearcuenta() {
  // 1. Capturar elementos por su ID exacto
  const matriculaInput = document.getElementById('matricula');
  const nombreInput = document.getElementById('nombre');
  const correoInput = document.getElementById('correo');
  const contrasenaInput = document.getElementById('contrasena');
  const telefonoInput = document.getElementById('telefono');
  const tipoUsuarioInput = document.getElementById('tipoUsuario');

  const matricula = matriculaInput ? matriculaInput.value.trim() : '';
  const nombre = nombreInput ? nombreInput.value.trim() : '';
  const correo = correoInput ? correoInput.value.trim() : '';
  const contrasena = contrasenaInput ? contrasenaInput.value.trim() : '';
  const telefono = telefonoInput ? telefonoInput.value.trim() : '';
  const tipoUsuario = tipoUsuarioInput ? tipoUsuarioInput.value : 'administrador';

  // 2. Validación estricta en el front
  if (!matricula || !nombre || !correo || !contrasena || !telefono) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor, llena todos los campos obligatorios antes de continuar.'
    });
    return;
  }

  // 3. Crear el JSON asegurando que us_contrasena lleve el valor capturado
  const nuevoUsuario = {
    us_matricula: matricula,
    us_nombre: nombre,
    us_correo: correo,
    us_contrasena: contrasena, // Aquí viaja la contraseña en texto plano para que el backend la encripte
    contrasena: contrasena, // Mantener la propiedad original si el backend la espera
    us_telefono: parseInt(telefono, 10),
    us_tipo: tipoUsuario
  };

  console.log("Enviando usuario al backend:", nuevoUsuario);

  // 4. Petición POST al endpoint
  fetch(`${API_BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoUsuario)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    Swal.fire({
      icon: 'success',
      title: '¡Cuenta creada con éxito!',
      text: `El usuario ${nombre} ha sido registrado exitosamente.`,
      confirmButtonColor: '#004982'
    }).then(() => {
      document.location = 'Menu_MAIN.html';
    });
  })
  .catch(error => {
    console.error('Error al registrar usuario:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error al registrar',
      text: 'No se pudo crear el usuario. Revisa la consola y los logs de Spring Boot.'
    });
  });
}


// ==========================================
// PETICIONES A LA API: POZOS Y MANTENIMIENTO
// ==========================================

function agregarregistromtto() {
  const clavePozo = document.getElementById('dropdown').value;
  if (!clavePozo) {
      mostrarAlerta('Por favor complete los campos requeridos.', 'error');
      return;
  }

  const nvoregMtto = {
      mtto_clave_pozo: clavePozo,
      mtto_motor_tipo: document.getElementById('tipoMotor').value,
      mtto_motor_hp: document.getElementById('hpMotor').value,
      mtto_motor_kw: document.getElementById('kwMotor').value,
      mtto_motor_eficiencia: document.getElementById('eficienciaMotor').value,
      mtto_tablero_tipo: document.getElementById('tipoTablero').value,
      mtto_tablero_capacidad: document.getElementById('capacidadTablero').value,
      mtto_transformador_tipo: document.getElementById('tipoTransformador').value,
      mtto_transformador_capacidad: document.getElementById('capacidadTransformador').value,
      mtto_cable_calibre: document.getElementById('calibreCable').value,
      mtto_cable_longitud: document.getElementById('longitudCable').value,
      mtto_tuberia_diametro: document.getElementById('diamTuberia').value,
      mtto_tuberia_longitud: document.getElementById('longTuberia').value,
      mtto_observaciones: document.getElementById('obsmtto').value,
      mtto_fecha_captura: new Date(),
      mtto_operador: 1
  };

  Swal.fire({
      title: "¿Estas seguro que desea guardar los datos?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, Guardar",
      cancelButtonText: "No, cancelar!"
  }).then((result) => {
      if (result.value) {
        fetch(`${API_BASE_URL}/mantenimiento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nvoregMtto)
        })
        .then(response => response.json())
        .then(() => {
            mostrarAlerta('El registro se guardó correctamente.', 'success');
            // Limpieza de inputs optimizada
            ['hpMotor', 'kwMotor', 'eficienciaMotor', 'capacidadTablero'].forEach(id => document.getElementById(id).value = 0);
            ['capacidadTransformador', 'longitudCable', 'diamTuberia', 'longTuberia'].forEach(id => document.getElementById(id).value = "0");
            document.getElementById('obsmtto').value = "";
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Hubo un problema al guardar el registro.', 'error');
        });
      }
  });
}

function enviarAlerta() {
  const clavePozo = document.getElementById('dropdown').value;
  if (!clavePozo) {
      mostrarAlerta('Por favor complete los campos requeridos.', 'error');
      return;
  }

  const nvaAl = {
      al_clave_de_pozo: clavePozo,
      al_tipo_de_alerta: document.getElementById('alert_tipo').value,
      al_comentarios: document.getElementById('observaciones').value,
      al_fechacap: new Date(),
      al_operador: 1
  };

  Swal.fire({
      title: "Estas seguro?",
      text: "Esta acción no se podra revertir!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, enviar!",
      cancelButtonText: "No, cancelar!"
  }).then((result) => {
      if (result.value) {
        fetch(`${API_BASE_URL}/alertas_pozos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nvaAl)
        })
        .then(response => response.json())
        .then(() => {
            mostrarAlerta('El registro se guardó correctamente.', 'success');
            document.getElementById('observaciones').value = "";
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Hubo un problema al guardar el registro.', 'error');
        });
      }
  });
}

function agregarregistrooperacion() {
    const dropdown = document.getElementById('dropdown');
    const clavePozo = dropdown.options[dropdown.selectedIndex]?.text;
    
    const dropdownOp = document.getElementById('dropdownOperador');
    const operadorSeleccionado = dropdownOp ? dropdownOp.value : '';

    if (!clavePozo || !dropdown.value) {
        mostrarAlerta('Por favor seleccione una clave de pozo válida.', 'error');
        return;
    }

    if (!operadorSeleccionado) {
        mostrarAlerta('Por favor seleccione un operador asignado.', 'error');
        return;
    }

    const gastoVal = parseFloat(document.getElementById('opGasto')?.value) || 0.0;

    const nvoregOp = {
        idLp: parseInt(dropdown.value),
        op_cpozo: clavePozo,
        op_nestatico: document.getElementById('myRange').value,
        op_ndinamico: document.getElementById('myRange1').value,
        op_gasto: gastoVal,
        op_presion: document.getElementById('myRange3').value,
        op_tiempo_op: document.getElementById('tiempodeoperacion').value,
        op_observaciones: document.getElementById('Observaciones').value,
        op_fecha_captura: new Date().toISOString(),
        op_operador: operadorSeleccionado
    };

    Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Los datos ingresados son correctos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "No, ¡corregir!"
    }).then((result) => {
        if (result.value || result.isConfirmed) {
            fetch(`${API_BASE_URL}/operacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nvoregOp)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta del servidor: " + response.status);
                }
                return response.json();
            })
            .then(() => {
                // Notificación de éxito con redirección automática
                Swal.fire({
                    icon: 'success',
                    title: '¡Registro guardado!',
                    text: 'La operación se guardó correctamente.',
                    confirmButtonColor: '#004982'
                }).then(() => {
                    document.location = 'Gestion_de_Operacion.html';
                });
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarAlerta('Hubo un problema al guardar el registro.', 'error');
            });
        }
    });
}

// ==========================================
// UTILIDADES DE INTERFAZ
// ==========================================
function menu_desp() {
  let listElements = document.querySelectorAll('.list_button--click');

  listElements.forEach(listElement => {
    listElement.addEventListener('click', () => {
         listElement.classList.toggle('arrow');
         
         let height = 0;
         let menu = listElement.nextElementSibling;
         if (menu.clientHeight === 0) {
          height = menu.scrollHeight;
         }
         menu.style.height = `${height}px`;
    });
  });
}


// ==========================================
// LÓGICA DE MODALES (Nosotros y Contacto)
// ==========================================

// 1. Obtener los elementos HTML
const modalNosotros = document.getElementById("myModal");
const modalContacto = document.getElementById("myModal2");
const spanNosotros = document.getElementsByClassName("close")[0];
const spanContacto = document.getElementsByClassName("close")[1];

// 2. Funciones para abrir los modales (Llamadas desde el HTML)
function activar() {
  if(modalNosotros) modalNosotros.style.display = "block";
}

function activar2() {
  if(modalContacto) modalContacto.style.display = "block";
}

// 3. Funciones para cerrar con la "X"
if(spanNosotros) {
  spanNosotros.onclick = function() {
    modalNosotros.style.display = "none";
  }
}

if(spanContacto) {
  spanContacto.onclick = function() {
    modalContacto.style.display = "none";
  }
}

// 4. Cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
  if (event.target == modalNosotros) {
      modalNosotros.style.display = "none";
  }
  if (event.target == modalContacto) {
      modalContacto.style.display = "none";
  }
}



// ==========================================
// LÓGICA DE NOTIFICACIONES (Menu_MAIN)
// ==========================================

function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active'); 
  }
}

// Ocultar el buzón de notificaciones al hacer clic fuera de él
window.addEventListener('click', function (event) {
  const dropdown = document.getElementById('notificationDropdown');
  const icon = document.querySelector('.notification-icon');
  
  if (icon && dropdown) {
    if (!icon.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('active');
    }
  }
});


document.addEventListener("DOMContentLoaded", function() {
  const headerContainer = document.getElementById("header-container");
  
  if (headerContainer) {
    fetch('components/header.html')
      .then(response => {
        if (!response.ok) {
          throw new Error("No se pudo cargar el componente del header");
        }
        return response.text();
      })
      .then(html => {
        headerContainer.innerHTML = html;
      })
      .catch(error => console.error("Error:", error));
  }
});


// ==========================================
// LÓGICA DE PERFIL DE USUARIO
// ==========================================

function toggleUserProfile() {
  const dropdown = document.getElementById('userProfileDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
    
    // Si se abre el menú, inyecta los datos de la sesión actual
    if (dropdown.classList.contains('active')) {
      document.getElementById('display-nombre').textContent = localStorage.getItem('usuario_nombre') || 'N/A';
      document.getElementById('display-matricula').textContent = localStorage.getItem('usuario_matricula') || 'N/A';
      document.getElementById('display-rol').textContent = localStorage.getItem('usuario_rol') || 'N/A';
    }
  }
}

// Reemplaza tu listener actual de 'click' en la ventana por este, 
// para que cierre tanto las notificaciones como el perfil al hacer clic fuera
window.addEventListener('click', function (event) {
  const notifDropdown = document.getElementById('notificationDropdown');
  const userDropdown = document.getElementById('userProfileDropdown');
  
  // Si el clic ocurre fuera de cualquier contenedor de notificaciones/perfil
  if (!event.target.closest('.notification-container')) {
    if (notifDropdown) notifDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
  }
});