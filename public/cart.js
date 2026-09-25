// cart.js — bag page
const app = document.getElementById('app');
const esc = Shop.escapeHtml;

function render() {
    const lines = Shop.cartLines();

    if (!lines.length) {
        app.innerHTML = `
            <h1 class="shop-title">Bag</h1>
            <div class="shop-empty">
                <p class="shop-muted">Your bag is empty.</p>
                <a href="/clothing" class="shop-btn shop-btn-ghost" style="max-width:280px">Shop clothing</a>
            </div>`;
        return;
    }

    app.innerHTML = `
        <h1 class="shop-title">Bag (${Shop.cartCount()})</h1>
        <ul class="shop-lines">
            ${lines.map((l, i) => `
                <li class="shop-line">
                    <a href="/product?id=${esc(l.id)}"><img class="shop-line-img" src="${esc(l.image)}" alt="${esc(l.name)}"></a>
                    <div>
                        <a href="/product?id=${esc(l.id)}" class="shop-line-name">${esc(l.name)}</a>
                        <p class="shop-line-meta">${l.size ? 'Size ' + esc(l.size) : 'One size'} · ${Shop.formatPrice(l.price)}</p>
                        <div class="shop-line-actions">
                            <div class="shop-qty">
                                <button data-i="${i}" data-d="-1" aria-label="Decrease quantity">−</button>
                                <span>${l.qty}</span>
                                <button data-i="${i}" data-d="1" aria-label="Increase quantity">+</button>
                            </div>
                            <button class="shop-link" data-remove="${i}">Remove</button>
                        </div>
                    </div>
                    <div class="shop-line-price">${Shop.formatPrice(l.total)}</div>
                </li>`).join('')}
        </ul>
        <div class="shop-summary">
            <div class="shop-summary-row"><span>Subtotal</span><span>${Shop.formatPrice(Shop.cartTotal())}</span></div>
            <div class="shop-summary-row"><span>Shipping</span><span>Free</span></div>
            <div class="shop-summary-row shop-summary-total"><span>Total</span><span>${Shop.formatPrice(Shop.cartTotal())}</span></div>
            <a href="/checkout" class="shop-btn">Checkout</a>
        </div>`;
}

app.addEventListener('click', e => {
    const qtyBtn = e.target.closest('[data-d]');
    if (qtyBtn) {
        const i = Number(qtyBtn.dataset.i);
        Shop.setQty(i, Shop.getCart()[i].qty + Number(qtyBtn.dataset.d));
        render();
        return;
    }
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
        Shop.setQty(Number(removeBtn.dataset.remove), 0);
        render();
    }
});

window.addEventListener('storage', render);
render();
