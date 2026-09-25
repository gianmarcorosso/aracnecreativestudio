// order.js — order summary (also shown as confirmation right after checkout)
const app = document.getElementById('app');
const esc = Shop.escapeHtml;
const params = new URLSearchParams(location.search);
const user = Shop.currentUser();

if (!user) {
    location.replace('/account?next=' + encodeURIComponent(location.pathname + location.search));
} else {
    render(Shop.getOrder(params.get('id')));
}

function render(order) {
    if (!order) {
        app.innerHTML = `
            <h1 class="shop-title">Order not found</h1>
            <a href="/account" class="shop-link">Back to account</a>`;
        return;
    }

    const s = order.shipping;
    app.innerHTML = `
        ${params.get('new') ? `
            <h1 class="shop-title">Thank you</h1>
            <p class="shop-muted">Your order has been received. We will contact you at ${esc(order.email)} to arrange payment and delivery.</p>` : `
            <h1 class="shop-title">Order</h1>`}

        <div class="shop-summary-row" style="padding:0 0 24px">
            <span><span class="shop-order-id">${esc(order.id)}</span> · ${Shop.formatDate(order.createdAt)}</span>
            <span class="shop-badge">${esc(order.status)}</span>
        </div>

        <ul class="shop-lines">
            ${order.items.map(i => `
                <li class="shop-line">
                    <img class="shop-line-img" src="${esc(i.image)}" alt="${esc(i.name)}">
                    <div>
                        <p class="shop-line-name">${esc(i.name)}</p>
                        <p class="shop-line-meta">${i.size ? 'Size ' + esc(i.size) : 'One size'} · Qty ${i.qty} · ${Shop.formatPrice(i.price)}</p>
                    </div>
                    <div class="shop-line-price">${Shop.formatPrice(i.price * i.qty)}</div>
                </li>`).join('')}
        </ul>

        <div class="shop-two-col" style="margin-top:32px">
            <div>
                <h2 class="shop-subtitle" style="margin-top:0">Shipping to</h2>
                <address class="shop-address">
                    ${esc(s.name)}<br>
                    ${esc(s.address)}<br>
                    ${esc(s.zip)} ${esc(s.city)}<br>
                    ${esc(s.country)}<br>
                    ${esc(s.phone)}
                    ${s.notes ? '<br><br>' + esc(s.notes) : ''}
                </address>
            </div>
            <div>
                <div class="shop-summary" style="margin-top:0;max-width:none">
                    <div class="shop-summary-row"><span>Subtotal</span><span>${Shop.formatPrice(order.total)}</span></div>
                    <div class="shop-summary-row"><span>Shipping</span><span>Free</span></div>
                    <div class="shop-summary-row shop-summary-total"><span>Total</span><span>${Shop.formatPrice(order.total)}</span></div>
                    <div class="shop-summary-row"><span>Payment</span><span>To be arranged</span></div>
                </div>
            </div>
        </div>

        <p style="margin-top:40px"><a href="/account" class="shop-link">All orders</a> &nbsp; <a href="/clothing" class="shop-link">Continue shopping</a></p>`;
}
