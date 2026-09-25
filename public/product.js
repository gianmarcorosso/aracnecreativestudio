// Read product id from URL param
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const product = Shop.getProduct(productId) || Shop.products[0];

// Populate
document.title = `${product.name} — ARACNE CREATIVE STUDIO`;
document.getElementById('productName').textContent = product.name;
document.getElementById('productPrice').textContent = Shop.formatPrice(product.price);

// Build slides
const slider = document.getElementById('slider');
const dotsEl = document.getElementById('dots');
let current = 0;

product.images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    const img = document.createElement('img');
    img.src = src;
    img.alt = product.name;
    slide.appendChild(img);
    slider.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(dot);
});

const slides = slider.querySelectorAll('.slide');
const dots = dotsEl.querySelectorAll('.dot');

function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
}

document.getElementById('prevBtn').addEventListener('click', () => goTo(current - 1));
document.getElementById('nextBtn').addEventListener('click', () => goTo(current + 1));

// Hide arrows if single image
if (slides.length <= 1) {
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
}

// Keyboard navigation
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
});

// Size picker + add to bag
const sizePicker = document.getElementById('sizePicker');
const addStatus = document.getElementById('addStatus');
let selectedSize = null;

if (product.sizes.length) {
    product.sizes.forEach(size => {
        const btn = document.createElement('button');
        btn.className = 'size-btn';
        btn.textContent = size;
        btn.addEventListener('click', () => {
            selectedSize = size;
            sizePicker.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('active', b === btn));
            addStatus.textContent = '';
        });
        sizePicker.appendChild(btn);
    });
} else {
    sizePicker.style.display = 'none';
}

document.getElementById('addBtn').addEventListener('click', () => {
    if (product.sizes.length && !selectedSize) {
        addStatus.textContent = 'Select a size';
        return;
    }
    Shop.addToCart(product.id, selectedSize);
    addStatus.innerHTML = 'Added to bag · <a href="/cart">View bag</a>';
});
