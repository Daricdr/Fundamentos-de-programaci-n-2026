document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-producto');
    const tablaBody = document.getElementById('tabla-inventario');
    const alertaAgotados = document.getElementById('alerta-agotados');
    const buscador = document.getElementById('buscador');
    const btnLimpiar = document.getElementById('btn-limpiar');

    // Cargar inventario desde localStorage o iniciar con datos de ejemplo
    let inventario = JSON.parse(localStorage.getItem('inventario_ferreteria')) || [
        {
            id: 'FER-001',
            nombre: 'Taladro Percutor 1/2"',
            cantidad: 5,
            precio: 180000,
            ivaPorcentaje: 19,
            fechaCompra: '2026-11-01',
            fechaVenta: '2026-11-15'
        },
        {
            id: 'FER-002',
            nombre: 'Caja Tornillos Drywall x100',
            cantidad: 0,
            precio: 12000,
            ivaPorcentaje: 19,
            fechaCompra: '2026-10-20',
            fechaVenta: '2026-11-17'
        }
    ];

    function guardarDatos() {
        localStorage.setItem('inventario_ferreteria', JSON.stringify(inventario));
    }

    function formatearMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    }

    function verificarAgotados() {
        const agotados = inventario.filter(item => Number(item.cantidad) <= 0);
        if (agotados.length > 0) {
            const nombres = agotados.map(p => `${p.nombre} (${p.id})`).join(', ');
            alertaAgotados.textContent = `⚠️ ALERTA DE INVENTARIO: Los siguientes productos están agotados: ${nombres}`;
            alertaAgotados.classList.remove('oculto');
        } else {
            alertaAgotados.classList.add('oculto');
        }
    }

    function renderizarTabla(filtro = '') {
        tablaBody.innerHTML = '';
        const textoFiltro = filtro.toLowerCase();

        const filtrados = inventario.filter(p =>
            p.id.toLowerCase().includes(textoFiltro) ||
            p.nombre.toLowerCase().includes(textoFiltro)
        );

        filtrados.forEach((producto) => {
            const precioBase = Number(producto.precio);
            const porcentaje = Number(producto.ivaPorcentaje);
            const valorIva = precioBase * (porcentaje / 100);
            const precioFinal = precioBase + valorIva;
            const estaAgotado = Number(producto.cantidad) <= 0;

            const fila = document.createElement('tr');
            if (estaAgotado) fila.classList.add('fila-agotada');

            fila.innerHTML = `
                <td><strong>${producto.id}</strong></td>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${formatearMoneda(precioBase)}</td>
                <td>${formatearMoneda(valorIva)} (${porcentaje}%)</td>
                <td><strong>${formatearMoneda(precioFinal)}</strong></td>
                <td>${producto.fechaCompra}</td>
                <td>${producto.fechaVenta || 'Sin ventas'}</td>
                <td>
                    ${estaAgotado 
                        ? '<span class="badge-agotado">AGOTADO</span>' 
                        : '<span class="badge-disponible">En Stock</span>'}
                </td>
                <td>
                    <button class="btn-vender" onclick="registrarVenta('${producto.id}')" ${estaAgotado ? 'disabled' : ''}>
                        Vender 1
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto('${producto.id}')">
                        Eliminar
                    </button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });

        verificarAgotados();
    }

    // Registrar o actualizar producto
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nuevoProducto = {
            id: document.getElementById('id').value.trim().toUpperCase(),
            nombre: document.getElementById('nombre').value.trim(),
            cantidad: parseInt(document.getElementById('cantidad').value, 10),
            precio: parseFloat(document.getElementById('precio').value),
            ivaPorcentaje: parseFloat(document.getElementById('iva-porcentaje').value),
            fechaCompra: document.getElementById('fecha-compra').value,
            fechaVenta: document.getElementById('fecha-venta').value
        };

        const indiceExistente = inventario.findIndex(p => p.id === nuevoProducto.id);
        if (indiceExistente !== -1) {
            inventario[indiceExistente] = nuevoProducto;
        } else {
            inventario.push(nuevoProducto);
        }

        guardarDatos();
        renderizarTabla(buscador.value);
        form.reset();
        document.getElementById('iva-porcentaje').value = 19;
    });

    // Función global para descontar 1 unidad y actualizar fecha de venta
    window.registrarVenta = (id) => {
        const producto = inventario.find(p => p.id === id);
        if (producto && producto.cantidad > 0) {
            producto.cantidad -= 1;
            producto.fechaVenta = new Date().toISOString().split('T')[0];
            guardarDatos();
            renderizarTabla(buscador.value);
            if (producto.cantidad === 0) {
                alert(`¡Atención! El producto "${producto.nombre}" se ha agotado.`);
            }
        }
    };

    // Función global para eliminar fila
    window.eliminarProducto = (id) => {
        if (confirm(`¿Seguro que deseas eliminar el producto ${id}?`)) {
            inventario = inventario.filter(p => p.id !== id);
            guardarDatos();
            renderizarTabla(buscador.value);
        }
    };

    buscador.addEventListener('input', (e) => renderizarTabla(e.target.value));
    btnLimpiar.addEventListener('click', () => {
        form.reset();
        document.getElementById('iva-porcentaje').value = 19;
    });

    renderizarTabla();
});