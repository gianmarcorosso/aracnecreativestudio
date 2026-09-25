const products = [
    {
        id: 'hooded-bomber',
        name: 'Hooded Bomber',
        price: '€ 320',
        images: ['/bomber.png'],
    },
    {
        id: 'hoodie-jacket',
        name: 'Hoodie Jacket',
        price: '€ 210',
        images: ['/hoodiejacket.png'],
    },
    {
        id: 'oversized-tee',
        name: 'Oversized Tee',
        price: '€ 80',
        images: ['/tshirt.png'],
    },
    {
        id: 'oversized-tee-black',
        name: 'Oversized Tee Black',
        price: '€ 80',
        images: ['/thisrtblk.png'],
    },
    {
        id: 'relaxed-pants',
        name: 'Relaxed Pants',
        price: '€ 140',
        images: ['/pants.png'],
    },
    {
        id: 'relaxed-pants-ii',
        name: 'Relaxed Pants II',
        price: '€ 140',
        images: ['/pants2.png'],
    },
    {
        id: 'leather-bag',
        name: 'Leather Bag',
        price: '€ 480',
        images: ['/bag.png'],
    },
];

// Read product id from URL param
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const product = products.find(p => p.id === productId) || products[0];

// Populate
document.title = `${product.name} — ARACNE CREATIVE STUDIO`;
document.getElementById('productName').textContent = product.name;
document.getElementById('productPrice').textContent = product.price;

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
