import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Scene & Camera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

// Narrow/portrait screens: labels sit closer to the sphere so they fit the width
const isCompact = window.innerWidth < 700 || window.innerWidth < window.innerHeight;
const LABEL_RADIUS = isCompact ? [2.4, 3.0] : null; // null = keep the line's own random length
// Radius (world units) that must stay on screen: labelled dots + label text
const FIT_RADIUS = isCompact ? 4.1 : 7;

// --- Lights ---
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 1));

// --- Controls: attach only to canvas to avoid intercepting HTML clicks ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Central Sphere ---
const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
const sphereMat = new THREE.MeshStandardMaterial({ metalness: 0.5, roughness: 0.5 });
const centralSphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(centralSphere);

// --- Theme state ---
const savedTheme = localStorage.getItem('theme');
let isDark = savedTheme !== null ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

const COLORS = {
    bgLight:   0xffffff, bgDark:   0x000000,
    lineLight: 0xdddddd, lineDark: 0x444444,
    dashLight: 0x000000, dashDark: 0xffffff,
};

// Separate arrays — no overlap
const plainLineMats  = []; // only plain (non-label) line materials
const dashedLineMats = []; // dashed line materials + dot materials
const dotMats        = []; // dot MeshPhong materials
const labelSprites   = []; // { sprite, text }

// --- Nav Header ---
function createNavHeader() {
    const navHeader = document.createElement('header');
    navHeader.innerHTML = `
        <nav>
            <div class="left-section">
                <button id="colorToggleBtn" aria-label="Invert colors">
                    <img id="siteLogo" src="/logo-spider.png" alt="Aracne Logo">
                </button>
                <h1>ARACNE CREATIVE STUDIO</h1>
            </div>
            <div class="right-section">
                <button id="menuBtn">+</button>
                <button id="menu-close">+</button>
            </div>
        </nav>
    `;
    document.body.insertBefore(navHeader, renderer.domElement);

    const overlay = document.createElement('div');
    overlay.id = 'menu-overlay';
    overlay.innerHTML = `
        <img id="spider" src="/spider-flip.gif" alt="">
        <nav>
            <a href="/clothing">Clothing</a>
            <a href="/films">Films</a>
            <a href="/design">Design</a>
            <a href="/contact">Contact</a>
            <a href="/about">About</a>
        </nav>
    `;
    document.body.appendChild(overlay);

    document.getElementById('colorToggleBtn').addEventListener('click', toggleColors);
    document.getElementById('menuBtn').addEventListener('click', openMenu);
    document.getElementById('menu-close').addEventListener('click', closeMenu);
}

function applyTheme() {
    scene.background = new THREE.Color(isDark ? COLORS.bgDark : COLORS.bgLight);
    sphereMat.color.setHex(isDark ? 0xffffff : 0x808080);

    plainLineMats.forEach(m => m.color.setHex(isDark ? COLORS.lineDark : COLORS.lineLight));
    dashedLineMats.forEach(m => m.color.setHex(isDark ? COLORS.dashDark : COLORS.dashLight));
    dotMats.forEach(m => m.color.setHex(isDark ? COLORS.dashDark : COLORS.dashLight));

    labelSprites.forEach(({ sprite, text }) =>
        updateSpriteColor(sprite, text, isDark ? '#ffffff' : '#000000')
    );

    document.body.style.color = isDark ? '#ffffff' : '#000000';
    const logo = document.getElementById('siteLogo');
    if (logo) logo.style.filter = isDark ? 'invert(1)' : 'none';
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.toggle('dark', isDark);
}

function toggleColors() {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
}

function openMenu() {
    document.getElementById('menu-overlay').classList.add('open');
    document.querySelector('header').classList.add('menu-open-active');
    // Restart spider animation from top each time menu opens
    const spider = document.getElementById('spider');
    if (spider) {
        spider.style.animation = 'none';
        spider.offsetHeight;
        spider.style.animation = '';
    }
}

function closeMenu() {
    document.getElementById('menu-overlay').classList.remove('open');
    document.querySelector('header').classList.remove('menu-open-active');
}

createNavHeader();

// --- Lines ---
function createRandomLines() {
    const numLines = 40;
    const lines = [];
    for (let i = 0; i < numLines; i++) {
        const phi   = Math.acos(-1 + (2 * i) / numLines);
        const theta = Math.sqrt(numLines * Math.PI) * phi;
        const length = Math.random() * 3 + 2;
        const dir = new THREE.Vector3(
            Math.cos(theta) * Math.sin(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(phi)
        ).normalize();
        const end = dir.clone().multiplyScalar(length);
        const geo = new THREE.BufferGeometry().setAttribute(
            'position', new THREE.Float32BufferAttribute([0, 0, 0, end.x, end.y, end.z], 3)
        );
        const mat = new THREE.LineBasicMaterial({ color: COLORS.lineLight });
        plainLineMats.push(mat);
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        lines.push({ line, mat, hasLabel: false, originalLength: length, direction: dir });
    }
    return lines;
}

const lines = createRandomLines();

// --- Sprites ---
const SPRITE_W = 320, SPRITE_H = 48;

function drawSpriteCanvas(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_W;
    canvas.height = SPRITE_H;
    const ctx = canvas.getContext('2d');
    ctx.font = '300 18px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.letterSpacing = '0.18em';
    ctx.fillText(text, 4, 32);
    return canvas;
}

function createLabelSprite(text, color = '#000000') {
    const mat = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(drawSpriteCanvas(text, color)),
        transparent: true,
        depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.8, 0.7, 1);
    return sprite;
}

function updateSpriteColor(sprite, text, color) {
    sprite.material.map.dispose();
    sprite.material.map = new THREE.CanvasTexture(drawSpriteCanvas(text, color));
    sprite.material.needsUpdate = true;
}

// --- Clickable Labels ---
const clickableObjects = [];

function createClickableLabels() {
    const labels = [
        { text: 'CLOTHING', slug: 'clothing' },
        { text: 'FILMS',    slug: 'films' },
        { text: 'DESIGN',   slug: 'design' },
        { text: 'CONTACT',  slug: 'contact' },
        { text: 'ABOUT',    slug: 'about' },
    ];

    const usedIndices = new Set();
    labels.forEach(({ text, slug }) => {
        let idx;
        do { idx = Math.floor(Math.random() * lines.length); }
        while (usedIndices.has(idx));
        usedIndices.add(idx);

        const lineData = lines[idx];

        // Remove this line's material from plainLineMats BEFORE replacing it
        const matIdx = plainLineMats.indexOf(lineData.mat);
        if (matIdx !== -1) plainLineMats.splice(matIdx, 1);

        const pts = lineData.line.geometry.attributes.position.array;
        if (LABEL_RADIUS) {
            const [min, max] = LABEL_RADIUS;
            const end = lineData.direction.clone().multiplyScalar(min + Math.random() * (max - min));
            pts[3] = end.x; pts[4] = end.y; pts[5] = end.z;
            lineData.line.geometry.attributes.position.needsUpdate = true;
        }
        const labelPos = new THREE.Vector3(pts[3], pts[4], pts[5]).multiplyScalar(1.05);

        // Dot
        const dotMat = new THREE.MeshPhongMaterial({ color: COLORS.dashLight });
        dotMats.push(dotMat);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), dotMat);
        dot.position.copy(labelPos);
        scene.add(dot);

        // Sprite
        const sprite = createLabelSprite(text);
        sprite.position.copy(labelPos).add(new THREE.Vector3(0.3, 0.25, 0));
        scene.add(sprite);
        labelSprites.push({ sprite, text });

        clickableObjects.push({ object: dot,    url: slug });
        clickableObjects.push({ object: sprite, url: slug });

        // Dashed line
        const dashedMat = new THREE.LineDashedMaterial({
            color: COLORS.dashLight,
            dashSize: 0.2,
            gapSize: 0.1,
        });
        dashedLineMats.push(dashedMat);
        lineData.line.material = dashedMat;
        lineData.mat = dashedMat;
        lineData.line.computeLineDistances();
        lineData.hasLabel = true;
    });
}

createClickableLabels();
applyTheme();

// --- Fit camera so FIT_RADIUS is visible in both directions ---
function fitCamera() {
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    const distance = Math.max(10, FIT_RADIUS / Math.tan(Math.min(halfV, halfH)));
    camera.position.setLength(distance);
    controls.minDistance = distance * 0.75;
    controls.maxDistance = distance * 1.25;
}

fitCamera();

// --- Animation ---
function animateLines() {
    const t = Date.now() * 0.001;
    lines.forEach((lineData) => {
        if (lineData.hasLabel) return;
        const oscillation = Math.sin(t + lineData.originalLength) * 0.35;
        const currentLength = lineData.originalLength * (1 + oscillation);
        const end = lineData.direction.clone().multiplyScalar(currentLength);
        const pts = lineData.line.geometry.attributes.position.array;
        pts[3] = end.x; pts[4] = end.y; pts[5] = end.z;
        lineData.line.geometry.attributes.position.needsUpdate = true;
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    animateLines();
    centralSphere.rotation.y += 0.005;
    renderer.render(scene, camera);
}

animate();

// --- Raycaster: only on canvas, distinguish drag from click ---
const raycaster = new THREE.Raycaster();
raycaster.params.Sprite = { threshold: 0.1 };
const pointer = new THREE.Vector2();
let mouseDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('click', (e) => {
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return; // was a drag, ignore

    pointer.x =  (e.clientX / renderer.domElement.clientWidth)  * 2 - 1;
    pointer.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = clickableObjects.map(c => c.object);
    const intersects = raycaster.intersectObjects(targets, false);
    if (intersects.length > 0) {
        const entry = clickableObjects.find(c => c.object === intersects[0].object);
        if (entry) window.location.href = `/${entry.url}`;
    }
});

// Touch
let touchStart = { x: 0, y: 0 };
renderer.domElement.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

renderer.domElement.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.sqrt(dx * dx + dy * dy) >= 10) return;

    pointer.x =  (e.changedTouches[0].clientX / renderer.domElement.clientWidth)  * 2 - 1;
    pointer.y = -(e.changedTouches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = clickableObjects.map(c => c.object);
    const intersects = raycaster.intersectObjects(targets, false);
    if (intersects.length > 0) {
        const entry = clickableObjects.find(c => c.object === intersects[0].object);
        if (entry) window.location.href = `/${entry.url}`;
    }
}, { passive: true });

// --- Resize ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    fitCamera();
});
