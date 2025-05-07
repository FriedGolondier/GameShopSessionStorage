document.addEventListener('DOMContentLoaded', function () {
    const formAgregarProducto = document.getElementById('formAgregarProducto');
    const mensajeExito = crearMensajeExito();
    const listaProductos = document.getElementById('tbodyProductos');
    const divListaProductos = document.getElementById('divListaProductos');
    const rangoCantidad = document.getElementById('rngCantidad');
    const outputCantidad = rangoCantidad.nextElementSibling;

    document.querySelectorAll('input[name="extraSwitch"]').forEach(switchInput => {
        switchInput.addEventListener('change', function () {
            if (this.checked) {
                document.querySelectorAll('input[name="extraSwitch"]').forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });

    let productos = cargarProductos();

    productos.forEach(producto => agregarProductoATabla(producto));
    actualizarVisibilidadTabla();

    outputCantidad.textContent = rangoCantidad.value;
    rangoCantidad.addEventListener('input', () => {
        outputCantidad.textContent = rangoCantidad.value;
    });

    formAgregarProducto.addEventListener('submit', function (e) {
        e.preventDefault();

        const idArticulo = document.getElementById('txtIDArticulo').value.trim();
        const nombre = document.getElementById('txtNombre').value.trim();
        const cantidad = document.getElementById('rngCantidad').value;
        const precio = document.getElementById('txtPrecio').value.trim();
        const descripcion = document.getElementById('txtDescripcion').value.trim();
        const categoria = document.getElementById('cboCategoria').value;
        const tipoVenta = document.querySelector('input[name="rdbTipoVenta"]:checked')?.value;
        const fechaEmision = document.getElementById('Emision').value;

        // Asignar el valor de extra, por defecto "Ninguno" si no se selecciona ningún switch
        const extraSwitch = document.querySelector('input[name="extraSwitch"]:checked');
        const extra = extraSwitch ? extraSwitch.value : 'Ninguno';

        let errores = [];

        if (!idArticulo || !nombre || !cantidad || !precio || !descripcion || !categoria || !fechaEmision) {
            errores.push('Todos los campos son obligatorios.');
        }

        const idDuplicado = productos.some(p => p.id === idArticulo);
        if (idDuplicado) {
            errores.push('Ya tienes un producto registrado con ese ID.');
        }

        if (!/^\d{5}$/.test(idArticulo)) {
            errores.push('El ID debe contener exactamente 5 dígitos numéricos.');
        }

        if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(nombre)) {
            errores.push('El nombre solo debe contener letras y espacios.');
        }

        if (parseFloat(precio) < 0) {
            errores.push('El precio no puede ser negativo.');
        }

        if (parseInt(cantidad) < 0) {
            errores.push('La cantidad no puede ser negativa.');
        }

        if (errores.length > 0) {
            mostrarErrores(errores);
            return;
        }

        const nuevoProducto = {
            id: idArticulo,
            nombre,
            cantidad,
            precio: parseFloat(precio).toFixed(2),
            descripcion,
            categoria,
            tipoVenta,
            fechaEmision,
            extra
        };

        productos.push(nuevoProducto);
        guardarProductos(productos);
        agregarProductoATabla(nuevoProducto);
        actualizarVisibilidadTabla();
        formAgregarProducto.reset();
        outputCantidad.textContent = "50";
        mostrarMensajeExito('Producto registrado correctamente.');
    });

    function agregarProductoATabla(producto) {
        const tr = document.createElement('tr');

        // Agregar la información de los productos con el nuevo orden
        tr.innerHTML = `
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>${producto.cantidad}</td>
            <td>${producto.descripcion}</td>
            <td>$${producto.precio}</td>
            <td>${producto.categoria}</td>
            <td>${producto.tipoVenta}</td>
            <td>${producto.fechaEmision}</td>  
            <td>${producto.extra}</td>  
            <td>
                <button class="btn btn-primary btn-sm btn-editar">Editar</button>
                <button class="btn btn-danger btn-sm btn-eliminar">Eliminar</button>
            </td>  
        `;

        tr.querySelector('.btn-editar').addEventListener('click', () => iniciarEdicion(tr, producto));
        tr.querySelector('.btn-eliminar').addEventListener('click', () => eliminarProducto(producto.id));

        listaProductos.appendChild(tr);
    }


    function iniciarEdicion(tr, productoOriginal) {
        const celdas = tr.querySelectorAll('td');

        const categoriasDisponibles = Array.from(document.getElementById('cboCategoria').options).map(opt => opt.value);

        celdas[1].innerHTML = `<input type="text" value="${productoOriginal.nombre}" class="form-control form-control-sm">`;
        celdas[2].innerHTML = `<input type="number" value="${productoOriginal.cantidad}" class="form-control form-control-sm">`;
        celdas[3].innerHTML = `<input type="text" value="${productoOriginal.descripcion}" class="form-control form-control-sm">`;
        celdas[4].innerHTML = `<input type="number" step="0.01" value="${productoOriginal.precio}" class="form-control form-control-sm">`;

        celdas[5].innerHTML = `
            <select class="form-control form-control-sm">
                ${categoriasDisponibles.map(cat => `
                    <option value="${cat}" ${cat === productoOriginal.categoria ? 'selected' : ''}>${cat}</option>
                `).join('')}
            </select>
        `;

        celdas[6].innerHTML = `
            <select class="form-control form-control-sm">
                <option value="menudeo" ${productoOriginal.tipoVenta === 'menudeo' ? 'selected' : ''}>menudeo</option>
                <option value="mayoreo" ${productoOriginal.tipoVenta === 'mayoreo' ? 'selected' : ''}>mayoreo</option>
            </select>
        `;


        // Fecha de emisión (editable)
        celdas[7].innerHTML = `<input type="date" value="${productoOriginal.fechaEmision}" class="form-control form-control-sm">`;

        // Extras (solo lectura, no editable)
        celdas[8].textContent = productoOriginal.extra;
        // Botones de acción
        celdas[9].innerHTML = `
            <button class="btn btn-success btn-sm btn-guardar">Guardar</button>
            <button class="btn btn-secondary btn-sm btn-cancelar">Cancelar</button>
        `;

        // Eventos
        celdas[9].querySelector('.btn-guardar').addEventListener('click', () => {
            const nombre = celdas[1].querySelector('input').value.trim();
            const cantidad = parseInt(celdas[2].querySelector('input').value);
            const descripcion = celdas[3].querySelector('input').value.trim();
            const precio = parseFloat(celdas[4].querySelector('input').value);
            const categoria = celdas[5].querySelector('select').value;
            const tipoVenta = celdas[6].querySelector('select').value;
            const fechaEmision = celdas[7].querySelector('input').value;
            const extra = productoOriginal.extra; // No se modifica

            let errores = [];

            if (!nombre || !descripcion || !categoria || !tipoVenta || !fechaEmision) {
                errores.push('Todos los campos deben estar completos.');
            }

            if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(nombre)) {
                errores.push('El nombre solo debe contener letras y espacios.');
            }

            if (isNaN(cantidad) || cantidad < 0) {
                errores.push('La cantidad debe ser un número no negativo.');
            }

            if (isNaN(precio) || precio < 0) {
                errores.push('El precio debe ser un número no negativo.');
            }

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            productoOriginal.nombre = nombre;
            productoOriginal.cantidad = cantidad;
            productoOriginal.descripcion = descripcion;
            productoOriginal.precio = precio.toFixed(2);
            productoOriginal.categoria = categoria;
            productoOriginal.tipoVenta = tipoVenta;
            productoOriginal.fechaEmision = fechaEmision;
            productoOriginal.extra = extra;

            guardarProductos(productos);
            recargarTabla();
            mostrarMensajeExito('Producto actualizado correctamente.');
        });

        celdas[9].querySelector('.btn-cancelar').addEventListener('click', () => recargarTabla());
    }


    function eliminarProducto(id) {
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
    
        mostrarAdvertencia(`¿Estás seguro de que deseas eliminar el producto con ID: ${producto.id}?`, () => {
            productos = productos.filter(p => p.id !== id);
            guardarProductos(productos);
            recargarTabla();
            mostrarMensajeExito('Producto eliminado correctamente.');
        });
    }

    function mostrarAdvertencia(mensaje, callbackConfirmacion) {
        const confirmacion = document.createElement('div');
        confirmacion.className = 'alerta alerta-confirmacion bg-light text-dark border border-warning';
        confirmacion.innerHTML = `
            <p class="m-0 mb-2 fw-bold">${mensaje}</p>
            <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-danger">Eliminar</button>
                <button class="btn btn-sm btn-secondary">Cancelar</button>
            </div>
        `;
    
        document.body.appendChild(confirmacion);
        confirmacion.style.opacity = '1';
    
        const btnEliminar = confirmacion.querySelector('.btn-danger');
        const btnCancelar = confirmacion.querySelector('.btn-secondary');
    
        btnEliminar.addEventListener('click', () => {
            callbackConfirmacion();
            confirmacion.remove();
        });
    
        btnCancelar.addEventListener('click', () => {
            confirmacion.remove();
        });
    
        setTimeout(() => {
            if (document.body.contains(confirmacion)) confirmacion.remove();
        }, 10000);
    }
    

    function guardarProductos(productos) {
        sessionStorage.setItem('productos', JSON.stringify(productos));
    }
    
    

    function recargarTabla() {
        listaProductos.innerHTML = '';
        productos.forEach(p => agregarProductoATabla(p));
        actualizarVisibilidadTabla();
    }

    function actualizarVisibilidadTabla() {
        divListaProductos.style.display = productos.length > 0 ? 'block' : 'none';
    }

    function mostrarErrores(errores) {
        mensajeExito.innerHTML = errores.map(e => `<p class="text-danger m-0">${e}</p>`).join('');
        mensajeExito.style.display = 'block';
        setTimeout(() => mensajeExito.style.display = 'none', 5000);
    }

    function mostrarMensajeExito(msg) {
        mensajeExito.innerHTML = `<p class="text-success m-0">${msg}</p>`;
        mensajeExito.style.display = 'block';
        setTimeout(() => mensajeExito.style.display = 'none', 3000);
    }

    function crearMensajeExito() {
        let contenedor = document.createElement('div');
        contenedor.id = 'mensajeExito';
        contenedor.className = 'mt-2 text-center';
        contenedor.style.display = 'none';
        formAgregarProducto.insertAdjacentElement('afterend', contenedor);
        return contenedor;
    }

    function cargarProductos() {
        return JSON.parse(sessionStorage.getItem('productos')) || [];
    }

    function guardarProductos(productos) {
        sessionStorage.setItem('productos', JSON.stringify(productos));
    }

    document.getElementById('btnEliminarBD').addEventListener('click', () => {
        // Validar si hay productos en la base de datos
        if (productos.length === 0) {
            mostrarMensajeAdvertencia('No tienes productos en la base de datos.');
            return;
        }
        
        // Mostrar el mensaje de advertencia en lugar del confirm
        mostrarAdvertencia("¿Estás seguro de que deseas eliminar toda la base de datos?", () => {
            productos = [];
            sessionStorage.removeItem('productos');
            recargarTabla();
            mostrarMensajeExito('Base de datos eliminada correctamente.');
        });
    });
    
    // Función para mostrar un mensaje de advertencia
    function mostrarAdvertencia(mensaje, accionConfirmada) {
        const mensajeAdvertencia = document.createElement('div');
        mensajeAdvertencia.id = 'mensajeAdvertencia';
        mensajeAdvertencia.innerHTML = `
            <p>${mensaje}</p>
            <button id="btnConfirmar" class="btn btn-warning">Sí, eliminar</button>
            <button id="btnCancelar" class="btn btn-secondary">Cancelar</button>
        `;
    
        // Mostrar el mensaje de advertencia
        document.body.appendChild(mensajeAdvertencia);
    
        // Agregar eventos de los botones
        document.getElementById('btnConfirmar').addEventListener('click', () => {
            accionConfirmada(); // Ejecutar acción de confirmación
            mensajeAdvertencia.remove(); // Eliminar el mensaje
        });
    
        document.getElementById('btnCancelar').addEventListener('click', () => {
            mensajeAdvertencia.remove(); // Eliminar el mensaje
        });
    }
    
    // Función para mostrar un mensaje de advertencia cuando no hay productos
    function mostrarMensajeAdvertencia(mensaje) {
        const mensajeAdvertencia = document.createElement('div');
        mensajeAdvertencia.className = 'mensaje-error'; // Clase para aplicar el estilo de error
        mensajeAdvertencia.innerHTML = `
            <p>${mensaje}</p>
        `;
        document.body.appendChild(mensajeAdvertencia);
        
        // Eliminar el mensaje después de 5 segundos
        setTimeout(() => mensajeAdvertencia.remove(), 5000);
    }
    

    document.getElementById('btnBuscar').addEventListener('click', () => {
        const criterio = document.getElementById('txtBuscar').value.trim().toLowerCase();
    
        // Verifica si el campo de búsqueda está vacío
        if (!criterio) {
            mostrarErrores(['Registra un ID o nombre para buscar']);
            return;
        }
    
        if (productos.length === 0) {
            mostrarErrores(['La base de datos está vacía.']);
            return;
        }
    
        const encontrados = productos.filter(p =>
            p.id.toLowerCase().includes(criterio) ||
            p.nombre.toLowerCase().includes(criterio)
        );
    
        if (encontrados.length === 0) {
            mostrarErrores(['No se encontraron productos con ese criterio.']);
            return;
        }
    
        listaProductos.innerHTML = '';
        encontrados.forEach(p => agregarProductoATabla(p));
        mostrarMensajeExito(`${encontrados.length} producto(s) encontrado(s).`);
    });
    
    document.getElementById('btnMostrarTodos').addEventListener('click', () => {
        if (productos.length === 0) {
            mostrarErrores(['No hay productos para mostrar.']);
            return;
        }
    
        recargarTabla();
        mostrarMensajeExito('Lista completa restaurada.');
    });
    
});
