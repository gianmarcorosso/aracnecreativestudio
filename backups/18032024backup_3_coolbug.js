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
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const lights = [
    new THREE.PointLight(0xff0000, 1, 0, 2),
    new THREE.PointLight(0x00ff00, 1, 0, 2),
    new THREE.AmbientLight(0xffffff, 0.5)
];
lights[0].position.set(5, 5, 5);
lights[1].position.set(-5, -5, -5);
lights.forEach(light => scene.add(light));

const controls = new OrbitControls(camera, renderer.domElement);

const numLines = 100;
const labels = ['CLOTHING', 'FILMS', 'DESIGN', 'CONTACT US', 'ABOUT US'];
createLinesAndLabels(numLines, labels);

function createLinesAndLabels(numLines, labels) {
    const spacing = 4 * Math.PI / numLines;
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines);
        const theta = spacing * i;

        const end = new THREE.Vector3().setFromSphericalCoords(2, phi, theta);

        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), end]);
        let material;
        if (i < labels.length) {
            material = new THREE.LineDashedMaterial({ color: 0x000000, dashSize: 0.1, gapSize: 0.1 });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 32), new THREE.MeshPhongMaterial({ color: 0x000000 }));
            sphere.position.copy(end);
            scene.add(sphere);

            const labelSprite = createLabelSprite(labels[i]);
            labelSprite.position.copy(end).multiplyScalar(1.1);
            sphere.add(labelSprite);
        } else {
            material = new THREE.LineBasicMaterial({ color: 0x888888 });
        }

        const line = new THREE.Line(geometry, material);
        if (material instanceof THREE.LineDashedMaterial) {
            line.computeLineDistances();
        }
        scene.add(line);
    }
}

function createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256; canvas.height = 64; // Aumento dimensioni per evitare tagli
    ctx.font = '40px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.125, 1); // Aggiustato per dimensioni canvas
    return sprite;
}

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
