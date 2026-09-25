// checkout.js — shipping details + order review. No payment step yet.
const app = document.getElementById('app');
const esc = Shop.escapeHtml;
const user = Shop.currentUser();
const lines = Shop.cartLines();

if (!user) {
    location.replace('/account?next=' + encodeURIComponent('/checkout'));
} else if (!lines.length) {
    location.replace('/cart');
} else {
    render();
}

function render() {
    const total = Shop.cartTotal();

    app.innerHTML = `
        <h1 class="shop-title">Checkout</h1>
        <div class="shop-two-col">
            <form class="shop-form" id="checkoutForm" novalidate>
                <h2 class="shop-subtitle" style="margin-top:0">Shipping</h2>
                <div class="shop-field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required value="${esc(user.name)}"></div>
                <div class="shop-field"><label for="address">Address</label><input id="address" name="address" autocomplete="street-address" required></div>
                <div class="shop-form-row">
                    <div class="shop-field"><label for="city">City</label><input id="city" name="city" autocomplete="address-level2" required></div>
                    <div class="shop-field"><label for="zip">Postal code</label><input id="zip" name="zip" autocomplete="postal-code" inputmode="numeric" required></div>
                </div>
                <div class="shop-form-row">
                    <div class="shop-field"><label for="country">Country</label><input id="country" name="country" autocomplete="country-name" required value="Italia"></div>
                    <div class="shop-field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div>
                </div>
                <div class="shop-field"><label for="notes">Notes (optional)</label><textarea id="notes" name="notes" rows="2"></textarea></div>
                <p class="shop-note">Payment is not collected online yet. After you place the order we will contact you at ${esc(user.email)} to arrange payment and delivery.</p>
                <p class="shop-error" id="formError"></p>
                <button type="submit" class="shop-btn">Place order · ${Shop.formatPrice(total)}</button>
            </form>

            <div>
                <h2 class="shop-subtitle" style="margin-top:0">Summary</h2>
                <ul class="shop-lines">
                    ${lines.map(l => `
                        <li class="shop-line">
                            <img class="shop-line-img" src="${esc(l.image)}" alt="${esc(l.name)}">
                            <div>
                                <p class="shop-line-name">${esc(l.name)}</p>
                                <p class="shop-line-meta">${l.size ? 'Size ' + esc(l.size) : 'One size'} · Qty ${l.qty}</p>
                            </div>
                            <div class="shop-line-price">${Shop.formatPrice(l.total)}</div>
                        </li>`).join('')}
                </ul>
                <div class="shop-summary" style="max-width:none">
                    <div class="shop-summary-row"><span>Subtotal</span><span>${Shop.formatPrice(total)}</span></div>
                    <div class="shop-summary-row"><span>Shipping</span><span>Free</span></div>
                    <div class="shop-summary-row shop-summary-total"><span>Total</span><span>${Shop.formatPrice(total)}</span></div>
                    <a href="/cart" class="shop-link">Edit bag</a>
                </div>
            </div>
        </div>`;

    const form = document.getElementById('checkoutForm');
    form.addEventListener('input', () => { document.getElementById('formError').textContent = ''; });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        for (const key of Object.keys(data)) data[key] = data[key].trim();

        const missing = ['name', 'address', 'city', 'zip', 'country', 'phone'].filter(k => !data[k]);
        if (missing.length) {
            document.getElementById('formError').textContent = 'Please fill in all required fields.';
            form.querySelector('#' + missing[0]).focus();
            return;
        }

        try {
            const order = Shop.placeOrder(data);
            location.href = '/order?id=' + encodeURIComponent(order.id) + '&new=1';
        } catch (err) {
            document.getElementById('formError').textContent = err.message;
        }
    });
}
