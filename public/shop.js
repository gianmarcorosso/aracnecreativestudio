// shop.js — catalog, cart, customer accounts and orders.
// Demo only: everything lives in this browser's localStorage, there is no backend.
(function () {
    const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

    const products = [
        { id: 'hooded-bomber',       name: 'Hooded Bomber',       price: 320, images: ['/bomber.png'],       sizes: APPAREL_SIZES },
        { id: 'hoodie-jacket',       name: 'Hoodie Jacket',       price: 210, images: ['/hoodiejacket.png'], sizes: APPAREL_SIZES },
        { id: 'oversized-tee',       name: 'Oversized Tee',       price: 80,  images: ['/tshirt.png'],       sizes: APPAREL_SIZES },
        { id: 'oversized-tee-black', name: 'Oversized Tee Black', price: 80,  images: ['/thisrtblk.png'],    sizes: APPAREL_SIZES },
        { id: 'relaxed-pants',       name: 'Relaxed Pants',       price: 140, images: ['/pants.png'],        sizes: APPAREL_SIZES },
        { id: 'relaxed-pants-ii',    name: 'Relaxed Pants II',    price: 140, images: ['/pants2.png'],       sizes: APPAREL_SIZES },
        { id: 'leather-bag',         name: 'Leather Bag',         price: 480, images: ['/bag.png'],          sizes: [] },
    ];

    const KEYS = {
        cart: 'aracne_cart',
        users: 'aracne_users',
        session: 'aracne_session',
        orders: 'aracne_orders',
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { /* storage unavailable: state lasts only for this page */ }
    }

    function formatPrice(n) {
        return '€ ' + n.toLocaleString('it-IT');
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function formatDate(ts) {
        return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function getProduct(id) {
        return products.find(p => p.id === id);
    }

    // --- Cart ---
    // Line: { id, size, qty }. Same product in a different size is a separate line.

    function getCart() {
        return read(KEYS.cart, []).filter(line => getProduct(line.id));
    }

    function saveCart(cart) {
        write(KEYS.cart, cart);
        renderNav();
    }

    function addToCart(id, size, qty = 1) {
        const cart = getCart();
        const line = cart.find(l => l.id === id && l.size === size);
        if (line) line.qty += qty;
        else cart.push({ id, size, qty });
        saveCart(cart);
    }

    function setQty(index, qty) {
        const cart = getCart();
        if (!cart[index]) return;
        if (qty <= 0) cart.splice(index, 1);
        else cart[index].qty = qty;
        saveCart(cart);
    }

    function clearCart() {
        saveCart([]);
    }

    function cartCount() {
        return getCart().reduce((n, l) => n + l.qty, 0);
    }

    function cartLines() {
        return getCart().map(l => {
            const p = getProduct(l.id);
            return { ...l, name: p.name, price: p.price, image: p.images[0], total: p.price * l.qty };
        });
    }

    function cartTotal() {
        return cartLines().reduce((n, l) => n + l.total, 0);
    }

    // --- Accounts ---

    async function hashPassword(email, password) {
        const data = new TextEncoder().encode(email + ':' + password);
        const buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    }

    async function register(name, email, password) {
        email = normalizeEmail(email);
        const users = read(KEYS.users, {});
        if (users[email]) throw new Error('An account with this email already exists.');
        users[email] = { name: name.trim(), email, hash: await hashPassword(email, password), createdAt: Date.now() };
        write(KEYS.users, users);
        write(KEYS.session, email);
        return users[email];
    }

    async function login(email, password) {
        email = normalizeEmail(email);
        const user = read(KEYS.users, {})[email];
        if (!user || user.hash !== await hashPassword(email, password)) {
            throw new Error('Wrong email or password.');
        }
        write(KEYS.session, email);
        return user;
    }

    function logout() {
        try { localStorage.removeItem(KEYS.session); } catch (e) { /* ignore */ }
        renderNav();
    }

    function currentUser() {
        const email = read(KEYS.session, null);
        if (!email) return null;
        const user = read(KEYS.users, {})[email];
        return user ? { name: user.name, email: user.email } : null;
    }

    // --- Orders ---

    function placeOrder(shipping) {
        const user = currentUser();
        if (!user) throw new Error('Not logged in.');
        const lines = cartLines();
        if (!lines.length) throw new Error('Your bag is empty.');

        const order = {
            id: 'AR-' + Date.now().toString(36).toUpperCase(),
            email: user.email,
            createdAt: Date.now(),
            status: 'Received',
            items: lines.map(({ id, name, size, qty, price, image }) => ({ id, name, size, qty, price, image })),
            total: lines.reduce((n, l) => n + l.total, 0),
            shipping,
        };
        const orders = read(KEYS.orders, []);
        orders.push(order);
        write(KEYS.orders, orders);
        clearCart();
        return order;
    }

    function getOrders() {
        const user = currentUser();
        if (!user) return [];
        return read(KEYS.orders, [])
            .filter(o => o.email === user.email)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    function getOrder(id) {
        return getOrders().find(o => o.id === id) || null;
    }

    // --- Header icons (account + bag with count) ---

    const ICON_USER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    const ICON_BAG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>';

    function renderNav() {
        const nav = document.querySelector('.nav-right');
        if (!nav) return;
        const count = cartCount();
        nav.classList.add('shop-nav');
        nav.innerHTML =
            `<a href="/account" class="shop-nav-link" aria-label="Account">${ICON_USER}</a>` +
            `<a href="/cart" class="shop-nav-link" aria-label="Bag">${ICON_BAG}` +
            (count ? `<span class="shop-nav-count">${count}</span>` : '') +
            `</a>`;
    }

    // Keep header in sync when another tab changes the cart
    window.addEventListener('storage', e => {
        if (e.key === KEYS.cart || e.key === KEYS.session) renderNav();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }

    window.Shop = {
        products, getProduct, formatPrice, formatDate, escapeHtml,
        getCart, addToCart, setQty, clearCart, cartCount, cartLines, cartTotal,
        register, login, logout, currentUser,
        placeOrder, getOrders, getOrder,
    };
})();
