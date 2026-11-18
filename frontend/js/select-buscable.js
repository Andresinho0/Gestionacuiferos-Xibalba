/**
 * Convierte un <select> en un combobox con búsqueda: el usuario puede escribir
 * para filtrar las opciones o desplegar la lista y elegir con el mouse/teclado.
 *
 * El <select> original se conserva (oculto) como fuente de verdad, así que
 * document.getElementById(id).value sigue funcionando igual que antes.
 * Si las opciones del <select> cambian (p. ej. al terminar un fetch), la lista
 * se actualiza sola.
 *
 * Uso: hacerSelectBuscable('dropdown');
 */
function hacerSelectBuscable(selectOrId, opciones = {}) {
    const select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId;
    if (!select || select.dataset.buscable) return;
    select.dataset.buscable = '1';

    const placeholder = opciones.placeholder || 'Escribe para buscar...';
    const normalizar = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    // Estructura: wrapper > input + lista
    const wrapper = document.createElement('div');
    wrapper.className = 'select-buscable';
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = placeholder;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    const lista = document.createElement('ul');
    lista.className = 'select-buscable-lista';
    lista.setAttribute('role', 'listbox');
    lista.id = `${select.id || 'sb'}-lista`;
    input.setAttribute('aria-controls', lista.id);

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(input);
    wrapper.appendChild(lista);
    wrapper.appendChild(select);
    select.classList.add('select-buscable-oculto');
    select.tabIndex = -1;

    // El label que apuntaba al select ahora enfoca el input
    if (select.id) {
        document.querySelectorAll(`label[for="${select.id}"]`).forEach(l => {
            l.htmlFor = `${select.id}-buscar`;
        });
        input.id = `${select.id}-buscar`;
    }

    let visibles = [];
    let activo = -1;

    const opcionesReales = () => Array.from(select.options).filter(o => o.value !== '');
    const textoSeleccionado = () => {
        const o = select.options[select.selectedIndex];
        return o && o.value !== '' ? o.textContent : '';
    };

    function pintar(filtro) {
        const f = normalizar(filtro);
        visibles = opcionesReales().filter(o => normalizar(o.textContent).includes(f));
        lista.innerHTML = '';
        if (!visibles.length) {
            const li = document.createElement('li');
            li.className = 'select-buscable-vacio';
            li.textContent = opcionesReales().length ? 'Sin coincidencias' : (select.options[0]?.textContent || 'Sin opciones');
            lista.appendChild(li);
        }
        visibles.forEach((o, i) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.textContent = o.textContent;
            if (o.value === select.value) li.classList.add('seleccionado');
            li.addEventListener('mousedown', e => { e.preventDefault(); elegir(i); });
            lista.appendChild(li);
        });
        activo = visibles.length ? 0 : -1;
        resaltar();
    }

    function resaltar() {
        Array.from(lista.children).forEach((li, i) => li.classList.toggle('activo', i === activo));
        const li = lista.children[activo];
        if (li) li.scrollIntoView({ block: 'nearest' });
    }

    function abrir() {
        pintar(input.value === textoSeleccionado() ? '' : input.value);
        wrapper.classList.add('abierto');
        input.setAttribute('aria-expanded', 'true');
    }

    function cerrar() {
        wrapper.classList.remove('abierto');
        input.setAttribute('aria-expanded', 'false');
        // Si lo escrito no corresponde a una opción, se restaura la selección actual
        input.value = textoSeleccionado();
    }

    function elegir(i) {
        const o = visibles[i];
        if (!o) return;
        select.value = o.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        input.value = o.textContent;
        cerrar();
    }

    input.addEventListener('focus', () => { input.select(); abrir(); });
    input.addEventListener('click', () => { if (!wrapper.classList.contains('abierto')) abrir(); });
    input.addEventListener('input', () => {
        if (!wrapper.classList.contains('abierto')) abrir();
        pintar(input.value);
        // Si se borra el texto, se limpia la selección
        if (input.value.trim() === '' && select.value !== '') {
            select.value = '';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    input.addEventListener('blur', cerrar);
    input.addEventListener('keydown', e => {
        const abierto = wrapper.classList.contains('abierto');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!abierto) return abrir();
            activo = Math.min(activo + 1, visibles.length - 1); resaltar();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activo = Math.max(activo - 1, 0); resaltar();
        } else if (e.key === 'Enter') {
            if (abierto) { e.preventDefault(); elegir(activo); }
        } else if (e.key === 'Escape') {
            cerrar();
        }
    });

    // Sincroniza cuando el <select> se llena/cambia desde otro código
    function sincronizar() {
        input.value = textoSeleccionado();
        const hayOpciones = opcionesReales().length > 0;
        input.placeholder = hayOpciones ? placeholder : (select.options[0]?.textContent || placeholder);
        input.disabled = select.disabled;
        if (wrapper.classList.contains('abierto')) pintar(input.value);
    }
    new MutationObserver(sincronizar).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    select.addEventListener('change', () => { if (document.activeElement !== input) input.value = textoSeleccionado(); });
    sincronizar();
}
