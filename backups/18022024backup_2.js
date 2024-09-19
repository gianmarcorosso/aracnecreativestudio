import * as THREE from 'three';
import { OrbitControls } from './three.js-dev/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const pointLight1 = new THREE.PointLight(0xff0000, 1);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00ff00, 1);
pointLight2.position.set(-5, -5, -5);
scene.add(pointLight2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);

// Modifica qui per generare linee di lunghezza variabile
function createRandomLines() {
    const numLines = 40;
    const lines = [];
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines);
        const theta = Math.sqrt(numLines * Math.PI) * phi;
        // Aumenta la lunghezza delle linee
        const lengthMultiplier = Math.random() * 3 + 2; // Lunghezza variabile tra 2 e 5
        const x = Math.cos(theta) * Math.sin(phi) * lengthMultiplier;
        const y = Math.sin(theta) * Math.sin(phi) * lengthMultiplier;
        const z = Math.cos(phi) * lengthMultiplier;
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lines.push({ line, hasLabel: false }); // Aggiunge proprietà per tracciare se ha una label
    }
    return lines;
}

const lines = createRandomLines();

// Modifica per allontanare le label e rendere le linee tratteggiate se hanno una label
function createClickableLabels() {
    const labels = ['CLOTHING', 'FILMS', 'DESIGN', 'CONTACT US', 'ABOUT US'];
    labels.forEach((label, index) => {
        const lineIndex = index % lines.length; // Assicura che ogni linea venga utilizzata
        const line = lines[lineIndex].line;
        const points = line.geometry.attributes.position.array;
        const labelPosition = new THREE.Vector3(points[3], points[4], points[5]).multiplyScalar(1.1); // Leggermente più lontano

        const radius = 0.1; // Aumenta il raggio se necessario
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(labelPosition);
        scene.add(sphere);

        const labelSprite = createLabelSprite(label);
        labelSprite.position.copy(labelPosition).add(new THREE.Vector3(0.2, 0.2, 0)); // Adegua per posizionamento ottimale
        scene.add(labelSprite);

        sphere.userData.url = label.toLowerCase();
        sphere.userData.label = labelSprite;

        // Aggiorna la linea a tratteggiata
        lines[lineIndex].hasLabel = true;
        const dashedMaterial = new THREE.LineDashedMaterial({
            color: 0x000000,
            dashSize: 0.2,
            gapSize: 0.1,
        });
        line.material = dashedMaterial;
        line.computeLineDistances(); // Necessario per il materiale tratteggiato
    });
}

function createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 20px Arial';
    context.fillStyle = '#000000';
    context.fillText(text, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    return sprite;
}

createClickableLabels();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

window.addEventListener('click', (event) => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.url) {
            window.location.href = `http://example.com/${object.userData.url}`;
        }
    }
});
