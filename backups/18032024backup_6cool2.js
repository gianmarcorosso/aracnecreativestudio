import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.5,
    roughness: 0.5,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Intensità aumentata della luce ambientale
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);

function createRandomLines() {
    const numLines = 40;
    const lines = [];
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines);
        const theta = Math.sqrt(numLines * Math.PI) * phi;
        const lengthMultiplier = Math.random() * 3 + 2;
        const x = Math.cos(theta) * Math.sin(phi) * lengthMultiplier;
        const y = Math.sin(theta) * Math.sin(phi) * lengthMultiplier;
        const z = Math.cos(phi) * lengthMultiplier;
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xdddddd }); // Colore più chiaro per le linee senza figlio
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lines.push({ line, hasLabel: false });
    }
    return lines;
}

const lines = createRandomLines();

function createClickableLabels() {
    const labels = ['CLOTHING', 'FILMS', 'DESIGN', 'CONTACT US', 'ABOUT US'];
    const usedIndices = new Set();
    labels.forEach((label) => {
        let lineIndex;
        do {
            lineIndex = Math.floor(Math.random() * lines.length);
        } while (usedIndices.has(lineIndex));
        usedIndices.add(lineIndex);

        const line = lines[lineIndex].line;
        const points = line.geometry.attributes.position.array;
        const labelPosition = new THREE.Vector3(points[3], points[4], points[5]).multiplyScalar(1.05);

        const radius = 0.1;
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(labelPosition);
        scene.add(sphere);

        const labelSprite = createLabelSprite(label);
        labelSprite.position.copy(labelPosition).add(new THREE.Vector3(0.2, 0.2, 0));
        scene.add(labelSprite);

        sphere.userData.url = label.toLowerCase();
        sphere.userData.label = labelSprite;

        sphere.onClick = () => {
            window.location.href = `http://localhost/${sphere.userData.url}`;
        };

        labelSprite.onClick = () => {
            window.location.href = `http://localhost/${sphere.userData.url}`;
        };

        lines[lineIndex].hasLabel = true;
        const dashedMaterial = new THREE.LineDashedMaterial({
            color: 0x000000,
            dashSize: 0.2,
            gapSize: 0.1,
        });
        line.material = dashedMaterial;
        line.computeLineDistances();
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
    animateLines(); // Aggiorna il movimento delle linee
    renderer.render(scene, camera);
}

animate();

function animateLines() {
    lines.forEach((lineData) => {
        const line = lineData.line;
        const points = line.geometry.attributes.position.array;
        const scaleFactor = Math.sin(Date.now() * 0.001) * 0.05 + 1; // Oscillazione di scala
        points[3] *= scaleFactor; // Aggiorna la lunghezza della linea
        points[4] *= scaleFactor;
        points[5] *= scaleFactor;
        line.geometry.attributes.position.needsUpdate = true; // Aggiorna la geometria della linea
    });
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

window.addEventListener('click', (event) => {
    event.preventDefault();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.onClick) {
            object.onClick();
        }
        if (object.userData && object.userData.label && object.userData.label.onClick) {
            object.userData.label.onClick();
        }
    }
});
