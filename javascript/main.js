let carrito = [];

// ────────────────────────────────────────────────────────────────────────────────
// Referencias del DOM
// ────────────────────────────────────────────────────────────────────────────────
const btnCarrito  = document.getElementById('btn-carrito');
const cartModal   = document.getElementById('cart-modal');
const cartOverlay = document.getElementById('cart-overlay');
const btnCerrar   = document.getElementById('btn-cerrar-carrito');
const cartItemsEl = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const btnCheckout = document.getElementById('btn-checkout');

// Contenedores donde se van a inyectar las cards
const contenedorCamisetas = document.querySelector('#productos .camisetas');
const contenedorConjuntos = document.querySelector('.conjuntos-2025 .conjuntos');

// ────────────────────────────────────────────────────────────────────────────────
// Cargar productos desde JSON y renderizar cards
// ────────────────────────────────────────────────────────────────────────────────
async function cargarProductos() {
    try {
        const res  = await fetch('./data/Productos.json');
        const data = await res.json();

        const camisetas = data.productos.filter(p => p.categoria === 'camisetas');
        const conjuntos = data.productos.filter(p => p.categoria === 'conjuntos');

        camisetas.forEach(p => {
            contenedorCamisetas.insertAdjacentHTML('beforeend', crearCardCamiseta(p));
        });

        conjuntos.forEach(p => {
            contenedorConjuntos.insertAdjacentHTML('beforeend', crearCardConjunto(p));
        });

        // Una vez que las cards están en el DOM, se adjuntan los listeners
        attachBotonesComprar();

    } catch (err) {
        console.error('Error al cargar productos.json:', err);
    }
}

// ─── Templates de cards (mismas clases que el HTML original) ─────────────────
function crearCardCamiseta(p) {
    return `
        <div class="card">
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.equipo}</h3>
            <p>${p.descripcion}</p>
            <span class="precio">$${p.precio.toLocaleString('es-AR')}</span>
            <button class="btn-comprar"
                    data-nombre="${escapeHtml(p.nombre)}"
                    data-precio="${p.precio}">
                Agregar al carrito
            </button>
        </div>`;
}

function crearCardConjunto(p) {
    return `
        <div class="card-conjuntos">
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.equipo}</h3>
            <p>${p.descripcion}</p>
            <span class="precio">$${p.precio.toLocaleString('es-AR')}</span>
            <button class="btn-comprar"
                    data-nombre="${escapeHtml(p.nombre)}"
                    data-precio="${p.precio}">
                Agregar al carrito
            </button>
        </div>`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────
function formatPrecio(n) {
    return '$' + n.toLocaleString('es-AR');
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ────────────────────────────────────────────────────────────────────────────────
// Open / Close modal
// ────────────────────────────────────────────────────────────────────────────────
function abrirCarrito() {
    renderCarrito();
    cartModal.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    cartModal.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

btnCarrito.addEventListener('click', abrirCarrito);
btnCerrar.addEventListener('click', cerrarCarrito);
cartOverlay.addEventListener('click', cerrarCarrito);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCarrito(); });

// ────────────────────────────────────────────────────────────────────────────────
// Animación fly-to-cart
// ────────────────────────────────────────────────────────────────────────────────
function flyToCart(sourceEl) {
    const cartBtn = document.getElementById('btn-carrito');
    const srcRect = sourceEl.getBoundingClientRect();
    const tgtRect = cartBtn.getBoundingClientRect();

    const dot = document.createElement('div');
    dot.className = 'fly-dot';

    dot.style.left    = (srcRect.left + srcRect.width  / 2 - 7) + 'px';
    dot.style.top     = (srcRect.top  + srcRect.height / 2 - 7) + 'px';
    dot.style.opacity = '1';
    document.body.appendChild(dot);

    dot.getBoundingClientRect();

    requestAnimationFrame(() => {
        dot.style.left    = (tgtRect.left + tgtRect.width  / 2 - 7) + 'px';
        dot.style.top     = (tgtRect.top  + tgtRect.height / 2 - 7) + 'px';
        dot.style.width   = '14px';
        dot.style.height  = '14px';
        dot.style.opacity = '1';
    });

    dot.addEventListener('transitionend', () => {
        dot.remove();
        pulsarContador();
    }, { once: true });
}

function pulsarContador() {
    cartCountEl.style.animation = 'none';
    void cartCountEl.offsetWidth;
    cartCountEl.style.animation = 'popIn 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
}

// ────────────────────────────────────────────────────────────────────────────────
// Lógica del carrito
// ────────────────────────────────────────────────────────────────────────────────
function agregarAlCarrito(nombre, precio, btn) {
    const existente = carrito.find(i => i.nombre === nombre);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ nombre, precio: Number(precio), cantidad: 1 });
    }
    actualizarContador();
    flyToCart(btn);
}

function actualizarContador() {
    const total = carrito.reduce((s, i) => s + i.cantidad, 0);
    if (total > 0) {
        cartCountEl.textContent   = total;
        cartCountEl.style.display = 'flex';
    } else {
        cartCountEl.style.display = 'none';
    }
}

function cambiarCantidad(nombre, delta) {
    const item = carrito.find(i => i.nombre === nombre);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) carrito = carrito.filter(i => i.nombre !== nombre);
    actualizarContador();
    renderCarrito();
}

function eliminarItem(nombre) {
    carrito = carrito.filter(i => i.nombre !== nombre);
    actualizarContador();
    renderCarrito();
}

// ────────────────────────────────────────────────────────────────────────────────
// Render modal
// ────────────────────────────────────────────────────────────────────────────────
function renderCarrito() {
    if (carrito.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="cart-empty">
                <svg class="cart-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path class="line-cart" d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z"
                                stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                </svg>
                <p>Tu carrito está vacío</p>
                <p style="font-size:13px;margin-top:4px;opacity:0.7;">¡Agregá productos para comenzar!</p>
            </div>`;
        cartTotalEl.textContent = '$0';
        return;
    }

    let html = '';
    carrito.forEach(item => {
        const subtotal  = item.precio * item.cantidad;
        const nombreEsc = escapeHtml(item.nombre);
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name" title="${nombreEsc}">${nombreEsc}</div>
                    <div class="cart-item-price">${formatPrecio(subtotal)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-action="minus" data-nombre="${nombreEsc}">−</button>
                    <span class="qty-number">${item.cantidad}</span>
                    <button class="qty-btn" data-action="plus"  data-nombre="${nombreEsc}">+</button>
                </div>
                <button class="cart-item-remove" data-action="remove" data-nombre="${nombreEsc}" aria-label="Eliminar">✕</button>
            </div>`;
    });
    cartItemsEl.innerHTML = html;

    const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    cartTotalEl.textContent = formatPrecio(total);
}

// Delegación de eventos para los botones dentro del modal
cartItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const nombre = btn.dataset.nombre;
    const action = btn.dataset.action;
    if (action === 'plus')   cambiarCantidad(nombre,  1);
    if (action === 'minus')  cambiarCantidad(nombre, -1);
    if (action === 'remove') eliminarItem(nombre);
});

// ────────────────────────────────────────────────────────────────────────────────
// WhatsApp checkout
// ────────────────────────────────────────────────────────────────────────────────
btnCheckout.addEventListener('click', () => {
    if (carrito.length === 0) return;

    const total  = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const lineas = carrito
        .map(i => `• ${i.nombre} x${i.cantidad} — ${formatPrecio(i.precio * i.cantidad)}`)
        .join('\n');

    const mensaje =
        `¡Buenos días! Quisiera proceder a la compra de estos productos de la web:\n\n` +
        `${lineas}\n\n` +
        `*Total: ${formatPrecio(total)}*`;

    window.open(`https://wa.me/5491157334501?text=${encodeURIComponent(mensaje)}`, '_blank');
});

// ────────────────────────────────────────────────────────────────────────────────
// Attach listeners a los botones .btn-comprar (se llama después del render)
// ────────────────────────────────────────────────────────────────────────────────
function attachBotonesComprar() {
    document.querySelectorAll('.btn-comprar').forEach(btn => {
        btn.addEventListener('click', () => {
            agregarAlCarrito(btn.dataset.nombre, btn.dataset.precio, btn);
        });
    });
}

// ────────────────────────────────────────────────────────────────────────────────
// Init — primero carga los productos, después todo lo demás ya está listo
// ────────────────────────────────────────────────────────────────────────────────
cargarProductos();