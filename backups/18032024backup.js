// Importa THREE e OrbitControls
import * as THREE from 'three';
import { OrbitControls } from './three.js-dev/examples/jsm/controls/OrbitControls.js'; // Modifica l'importazione di OrbitControls

// Setup base della scena, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Sfondo bianco

// Camera con prospettiva e posizionamento
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Aggiungi una sfera centrale alla scena
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64); // Modifica le dimensioni della sfera
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 }); // Materiale Phong per la sfera
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Aggiungi effetti di illuminazione alla sfera
const pointLight1 = new THREE.PointLight(0xff0000, 1);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00ff00, 1);
pointLight2.position.set(-5, -5, -5);
scene.add(pointLight2);

// Array contenente le linee casuali
const lines = createRandomLines();

// Funzione per creare una linea con punti finali casuali
function createRandomLine() {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 }); // Colore nero per le linee
    const points = [];
    const pointA = new THREE.Vector3(0, 0, 0); // Partenza dalla posizione (0, 0, 0)
    points.push(pointA);

    // Genera casualmente le coordinate per il punto B
    const pointB = new THREE.Vector3(
        Math.random() * 10 - 5, // Coordinate X casuali nell'intervallo [-5, 5]
        Math.random() * 10 - 5, // Coordinate Y casuali nell'intervallo [-5, 5]
        Math.random() * 10 - 5  // Coordinate Z casuali nell'intervallo [-5, 5]
    );
    points.push(pointB);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line); // Aggiungi la linea alla scena

    return line;
}

// Funzione per creare le linee casuali
function createRandomLines() {
    const lines = [];
    for (let i = 0; i < 3; i++) {
        const line = createRandomLine();
        lines.push({ line });
    }
    return lines;
}

// Funzione per creare le label cliccabili sui punti B delle linee selezionate casualmente
function createClickableLabels() {
    const labels = ['CLOTHING', 'FILMS', 'DESIGN']; // Nomi delle label
    const numLabels = 3; // Numero di label da creare
    const radius = 0.2; // Raggio della sfera per le label
    const labelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Materiale per le sfere

    // Seleziona casualmente tre linee/zampe
    const selectedLines = [];
    while (selectedLines.length < numLabels) {
        const randomIndex = Math.floor(Math.random() * lines.length);
        const selectedLine = lines[randomIndex];
        if (!selectedLines.includes(selectedLine)) {
            selectedLines.push(selectedLine);
        }
    }

    // Crea e posiziona le label (sfere) sui punti B delle linee/zampe selezionate
    for (let i = 0; i < numLabels; i++) {
        const pointB = selectedLines[i].line.geometry.attributes.position.array.slice(3, 6);
        const labelPosition = new THREE.Vector3().fromArray(pointB);

        // Crea la sfera per la label
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphere = new THREE.Mesh(sphereGeometry, labelMaterial);
        sphere.position.copy(labelPosition); // Imposta la posizione della sfera
        scene.add(sphere);

        // Crea la scritta di riferimento
        const labelSprite = createLabelSprite(labels[i]);
        labelSprite.position.copy(labelPosition); // Posiziona la scritta sopra la sfera
        scene.add(labelSprite);

        // Rendi la sfera e la label cliccabili
        sphere.userData.url = labels[i].toLowerCase(); // Imposta l'URL della pagina in base al nome della label
        sphere.userData.label = labelSprite;
    }
}

// Funzione per creare una scritta di riferimento
function createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 20px Arial';
    context.fillStyle = '#000000'; // Colore del testo
    context.fillText(text, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1); // Scala del testo
    return sprite;
}

// Chiamata alla funzione per creare le label
createClickableLabels();

// Aggiungi luci alla scena
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Controllo orbitale per interattività
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ciclo di renderizzazione
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    sphere.rotation.x += 0.01; // Rotazione della sfera sull'asse X
    sphere.rotation.y += 0.01; // Rotazione della sfera sull'asse Y
    sphere.rotation.z += 0.01; // Rotazione della sfera sull'asse Z
    renderer.render(scene, camera);
}

animate();

// Gestione ridimensionamento finestra
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Aggiungi funzionalità di cliccabilità alle label e alle sfere figlie
window.addEventListener('click', onClick, false);

function onClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.url) {
            window.location.href = `http://example.com/${object.userData.url}`; // Sostituire con l'URL corretto
        }
    }
}
