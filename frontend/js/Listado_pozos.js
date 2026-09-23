    // Guarda el listado completo tal como llega del servidor.
    // Los filtros trabajan sobre esta copia, sin volver a pedir datos a la API.
    const API_BASE_URL = 'https://xibalbadata-java-production.up.railway.app/api';
    const iraMenu_Main = () => document.location = 'Menu_MAIN.html';
    let pozosData = [];

    function pintarFilas(lista) {
      const tableBody = document.getElementById("pozosTableBody");
      tableBody.innerHTML = '';

      if (!lista || lista.length === 0) {
        // También cambiamos aquí el colspan a 3
        tableBody.innerHTML = '<tr><td colspan="3" class="empty-state">No hay pozos que coincidan con los filtros.</td></tr>';
        return;
      }

      lista.forEach(item => {
        // Obtenemos los valores desde el objeto JSON[cite: 2]
        const clave = item.l_poz_clave || 'N/A';
        const nombre = item.lp_Nombre || 'Sin nombre';
        const idPozo = item.id_lp; // Identificador único para mandar a la vista de detalles[cite: 2]

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${clave}</td>
          <td>${nombre}</td>
          <td>
            <!-- Botón que hereda tu clase .btn y redirige enviando el ID -->
            <button class="btn" onclick="window.location.href='Detalles_pozo.html?id=${idPozo}'">
              <i class="fa-solid fa-list-check"></i> Detalles
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    // Lee un input de rango: si está vacío devuelve null (sin límite),
    // si tiene un valor lo convierte a número.
    function leerLimite(id) {
      const raw = document.getElementById(id).value.trim();
      if (raw === '') return null;
      const num = parseFloat(raw);
      return isNaN(num) ? null : num;
    }

    // Revisa si un valor numérico cae dentro de [min, max].
    // min o max en null significa "sin límite" en ese extremo.
    function dentroDeRango(valor, min, max) {
      const num = parseFloat(valor);
      if (isNaN(num)) return false;
      if (min !== null && num < min) return false;
      if (max !== null && num > max) return false;
      return true;
    }

    function aplicarFiltros() {
      const profMin = leerLimite('filtroProfundidadMin');
      const profMax = leerLimite('filtroProfundidadMax');
      const diamPerfMin = leerLimite('filtroDiamPerfMin');
      const diamPerfMax = leerLimite('filtroDiamPerfMax');
      const ademeMin = leerLimite('filtroAdemeMin');
      const ademeMax = leerLimite('filtroAdemeMax');

      const filtrados = pozosData.filter(item => {
        if ((profMin !== null || profMax !== null) &&
            !dentroDeRango(item.lp_Profundidad_perforación, profMin, profMax)) {
          return false;
        }
        if ((diamPerfMin !== null || diamPerfMax !== null) &&
            !dentroDeRango(item.lp_Diámetro_perforación, diamPerfMin, diamPerfMax)) {
          return false;
        }
        if ((ademeMin !== null || ademeMax !== null) &&
            !dentroDeRango(item.lp_Diámetro_ADEME, ademeMin, ademeMax)) {
          return false;
        }
        return true;
      });

      pintarFilas(filtrados);
    }

    function limpiarFiltros() {
      ['filtroProfundidadMin', 'filtroProfundidadMax',
       'filtroDiamPerfMin', 'filtroDiamPerfMax',
       'filtroAdemeMin', 'filtroAdemeMax'].forEach(id => {
        document.getElementById(id).value = '';
      });
      pintarFilas(pozosData);
    }

    document.addEventListener("DOMContentLoaded", function () {
      fetch(`${API_BASE_URL}/lista_pozos`)
        .then(response => response.json())
        .then(data => {
          pozosData = data || [];
          pintarFilas(pozosData);
        })
        .catch(error => {
          console.error('Error al cargar los datos:', error);
          const tableBody = document.getElementById("pozosTableBody");
          tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No se pudo cargar el listado de pozos.</td></tr>';
        });

      document.getElementById('aplicarFiltrosBtn').addEventListener('click', aplicarFiltros);
      document.getElementById('limpiarFiltrosBtn').addEventListener('click', limpiarFiltros);

      // Permite presionar Enter dentro de cualquier campo de filtro para aplicarlo
      document.querySelectorAll('.filter-range input').forEach(input => {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            aplicarFiltros();
          }
        });
      });
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