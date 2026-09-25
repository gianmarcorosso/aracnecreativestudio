// account.js — login / register, then profile + order history
const app = document.getElementById('app');
const esc = Shop.escapeHtml;
const next = new URLSearchParams(location.search).get('next');
// Only follow same-site paths after login
const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

function renderAuth(mode = 'login') {
    const isLogin = mode === 'login';
    app.innerHTML = `
        <div class="shop-auth">
            <h1 class="shop-title">Account</h1>
            ${redirectTo ? '<p class="shop-muted">Log in or create an account to continue.</p>' : ''}
            <div class="shop-tabs">
                <button class="shop-tab ${isLogin ? 'active' : ''}" data-mode="login">Log in</button>
                <button class="shop-tab ${isLogin ? '' : 'active'}" data-mode="register">Register</button>
            </div>
            <form class="shop-form" id="authForm" novalidate>
                ${isLogin ? '' : '<div class="shop-field"><label for="name">Name</label><input id="name" name="name" autocomplete="name" required></div>'}
                <div class="shop-field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>
                <div class="shop-field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="6"></div>
                <p class="shop-error" id="authError"></p>
                <button type="submit" class="shop-btn">${isLogin ? 'Log in' : 'Create account'}</button>
            </form>
        </div>`;

    app.querySelectorAll('.shop-tab').forEach(tab =>
        tab.addEventListener('click', () => renderAuth(tab.dataset.mode)));

    const form = document.getElementById('authForm');
    const errorEl = document.getElementById('authError');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        errorEl.textContent = '';

        if (!isLogin && !data.name.trim()) return void (errorEl.textContent = 'Please enter your name.');
        if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) return void (errorEl.textContent = 'Please enter a valid email.');
        if (data.password.length < 6) return void (errorEl.textContent = 'Password must be at least 6 characters.');

        try {
            if (isLogin) await Shop.login(data.email, data.password);
            else await Shop.register(data.name, data.email, data.password);
            if (redirectTo) location.href = redirectTo;
            else render();
        } catch (err) {
            errorEl.textContent = err.message;
        }
    });
}

function itemCount(order) {
    const n = order.items.reduce((sum, i) => sum + i.qty, 0);
    return n + (n === 1 ? ' item' : ' items');
}

function renderProfile(user) {
    const orders = Shop.getOrders();
    app.innerHTML = `
        <h1 class="shop-title">Hello, ${esc(user.name)}</h1>
        <p class="shop-muted">${esc(user.email)}</p>
        <button class="shop-link" id="logoutBtn">Log out</button>

        <h2 class="shop-subtitle">Orders</h2>
        ${orders.length ? `
            <ul class="shop-orders">
                ${orders.map(o => `
                    <li>
                        <a class="shop-order-row" href="/order?id=${encodeURIComponent(o.id)}">
                            <span>
                                <span class="shop-order-id">${esc(o.id)}</span>
                                <span class="shop-order-date">${Shop.formatDate(o.createdAt)} · ${itemCount(o)}</span>
                            </span>
                            <span class="shop-badge">${esc(o.status)}</span>
                            <span class="shop-order-total">${Shop.formatPrice(o.total)}</span>
                        </a>
                    </li>`).join('')}
            </ul>` : `
            <p class="shop-muted">No orders yet.</p>
            <a href="/clothing" class="shop-btn shop-btn-ghost" style="max-width:280px">Shop clothing</a>`}`;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        Shop.logout();
        render();
    });
}

function render() {
    const user = Shop.currentUser();
    if (user) renderProfile(user);
    else renderAuth();
}

render();
