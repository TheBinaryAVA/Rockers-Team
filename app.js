// app.js (module)
// Browser-based 3D office + face-expression suggestions
// Uses: three.js (module), PointerLockControls, and face-api.js (already loaded via index.html global)

import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

//
// NOTES:
// - face-api.js is loaded via a global script (faceapi).
// - face-api.js models are loaded from a CDN in this file (public models).
// - Unsplash Source API is used for scenario + suggestion example images.
// - This file is written to be run as a module (index.html uses <script type="module">).
//

/* -------------------------
   Scenario + Unsplash data
   ------------------------- */
const UNSPLASH = {
  meeting: 'https://source.unsplash.com/1600x900/?meeting-room,office',
  openoffice: 'https://source.unsplash.com/1600x900/?open-office,workspace',
  conference: 'https://source.unsplash.com/1600x900/?conference-room,office',
  desk: 'https://source.unsplash.com/1600x900/?desk,workspace',
  hallway: 'https://source.unsplash.com/1600x900/?office-hallway,building',
  lobby: 'https://source.unsplash.com/1600x900/?office-lobby,modern',
  breakroom: 'https://source.unsplash.com/1600x900/?breakroom,office',
  cowork: 'https://source.unsplash.com/1600x900/?coworking,office',
  window: 'https://source.unsplash.com/1600x900/?office-window,daylight',
  team: 'https://source.unsplash.com/1600x900/?team-meeting,office'
};

const SCENARIOS = [
  { id:'interrupted', title:'Meeting: Repeated Interruptions', image:UNSPLASH.meeting, prompt:"You're presenting. A colleague keeps talking over you. What do you do?" , choices:[
    { label:"Set a calm boundary: 'Two more sentences.'", score:2 },
    { label:"Stay quiet and message later.", score:0 },
    { label:"Call them out loudly.", score:-1 }
  ]},
  { id:'name', title:'Name mispronounced', image:UNSPLASH.openoffice, prompt:"A coworker keeps mispronouncing your name after corrections. How respond?", choices:[
    { label:"Offer a short mnemonic and retry.", score:2 },
    { label:"Ignore it.", score:0 },
    { label:"Make a joke about it.", score:-1 }
  ]},
  { id:'credit', title:'Idea attributed to someone else', image:UNSPLASH.conference, prompt:"Someone repeats your idea and gets credit. What do you do?", choices:[
    { label:"Bridge back to your idea with action.", score:2 },
    { label:"Message privately later.", score:0 },
    { label:"Call them a thief publicly.", score:-1 }
  ]},
  { id:'origin', title:'\"Where are you really from?\"', image:UNSPLASH.desk, prompt:"Teammate presses someone's 'real' origin. How do you intervene?", choices:[
    { label:"Name impact + pivot.", score:2 },
    { label:"Change subject quietly.", score:0 },
    { label:"Label them racist loudly.", score:-1 }
  ]},
  { id:'role', title:'Assumption about role', image:UNSPLASH.hallway, prompt:"Someone assumes a colleague is the assistant not the manager. Response?", choices:[
    { label:"Correct briefly with facts.", score:2 },
    { label:"Do nothing.", score:0 },
    { label:"Laugh it off.", score:-1 }
  ]},
  { id:'accent', title:'Comment about accent', image:UNSPLASH.lobby, prompt:"A colleague says 'You speak English so well!' — what's your call?", choices:[
    { label:"Name the impact.", score:2 },
    { label:"Smile and accept.", score:0 },
    { label:"Joke about accent.", score:-1 }
  ]},
  { id:'excluded', title:'Left out of social gathering', image:UNSPLASH.breakroom, prompt:"A colleague wasn't invited to an offsite. What do you do?", choices:[
    { label:"Check in privately.", score:2 },
    { label:"Assume oversight and do nothing.", score:0 },
    { label:"Call the group out publicly.", score:-1 }
  ]},
  { id:'token', title:'Asked to speak for a group', image:UNSPLASH.cowork, prompt:"Someone asks 'What do people like you think?'", choices:[
    { label:"Refocus and ask for specifics.", score:2 },
    { label:"Offer a single view for the group.", score:0 },
    { label:"Agree to avoid conflict.", score:-1 }
  ]},
  { id:'dress', title:'Dress-based comment', image:UNSPLASH.window, prompt:"Manager says 'That outfit doesn't look professional on you'. How respond?", choices:[
    { label:"Ask for clarity on standards.", score:2 },
    { label:"Say sorry and change later.", score:0 },
    { label:"Snap back angrily.", score:-1 }
  ]},
  { id:'feedback', title:'Feedback framed biasedly', image:UNSPLASH.team, prompt:"Reviewer says 'You're coming off too aggressive'. What do you do?", choices:[
    { label:"Ask for specifics & examples.", score:2 },
    { label:"Accept it without question.", score:0 },
    { label:"Call reviewer biased.", score:-1 }
  ]}
];

/* -------------------------
   Mapping expressions -> suggestion
   ------------------------- */
const EXPRESSION_SUGGESTIONS = {
  neutral: {
    text: "You're neutral — take a breath and reflect. Consider a calm, factual response that names impact and suggests next steps.",
    imageQuery: "professional-calm-body-language,office"
  },
  happy: {
    text: "You appear comfortable/positive — maintain professionalism. If the comment was positive but problematic, gently reframe it.",
    imageQuery: "friendly-professional-smile,office"
  },
  sad: {
    text: "You appear down — consider checking in with a peer or asking for support. Use a private follow-up if you don't want to address publicly.",
    imageQuery: "empathetic-listener,office"
  },
  angry: {
    text: "You look angry — when possible, pause before responding. Use assertive, specific language to name the behavior, not the person.",
    imageQuery: "assertive-professional,office"
  },
  fearful: {
    text: "You look surprised or unsettled. If you feel unsafe, prioritize removing yourself; otherwise ask for clarification or a timeout.",
    imageQuery: "calm-professional,office"
  },
  surprised: {
    text: "You seem surprised. Clarify the comment: ask 'Can you say more about what you meant by that?' to prompt reflection.",
    imageQuery: "clarifying-question,office"
  }
};

/* -------------------------
   Globals: Three.js scene setup
   ------------------------- */
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeaf3ff);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 4);

const controls = new PointerLockControls(camera, renderer.domElement);
// We'll enable pointer lock when user clicks the canvas.
document.addEventListener('click', () => {
  if (!document.pointerLockElement) renderer.domElement.requestPointerLock?.();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) controls.lock();
  else controls.unlock();
});

/* lights */
const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.9);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-2, 4, 2);
dir.castShadow = true;
scene.add(dir);

/* Room: floor + walls */
const floorMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fb });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// back wall
const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0f5fb });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat);
backWall.position.set(0, 4, -10);
scene.add(backWall);

/* Furniture: desk, chairs (simple boxes) */
function addDesk() {
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xdcd7d0 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.2), deskMat);
  desk.position.set(0, 1.05, -2);
  desk.castShadow = true;
  scene.add(desk);

  // legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x7a6c5d });
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), legMat);
  leg1.position.set(-1.15, 0.55, -1.45); scene.add(leg1);
  const leg2 = leg1.clone(); leg2.position.set(1.15, 0.55, -1.45); scene.add(leg2);
  const leg3 = leg1.clone(); leg3.position.set(-1.15, 0.55, -2.55); scene.add(leg3);
  const leg4 = leg1.clone(); leg4.position.set(1.15, 0.55, -2.55); scene.add(leg4);

  // a monitor (scenario panel) as a thin box — we'll texture its front
  const monitorGeo = new THREE.BoxGeometry(1.8, 1.02, 0.06);
  const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0b1230 });
  const monitor = new THREE.Mesh(monitorGeo, monitorMat);
  monitor.position.set(0, 1.55, -1.7);
  monitor.castShadow = true;
  monitor.name = "scenarioMonitor";
  scene.add(monitor);

  // create a plane in front of the monitor for the scenario image texture
  const panelGeo = new THREE.PlaneGeometry(1.7, 0.96);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // will set map later
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 1.55, -1.668);
  panel.name = "scenarioPanel";
  scene.add(panel);

  return { monitor, panel };
}
const { panel: scenarioPanelMesh } = addDesk();

/* chairs */
const chairMat = new THREE.MeshStandardMaterial({ color: 0x2e2f36 });
const chair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), chairMat);
chair.position.set(-1.4, 0.9, -1.6);
scene.add(chair);

/* small coffee table */
const table = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), new THREE.MeshStandardMaterial({ color: 0xe8e1d9 }));
table.position.set(2.4, 0.45, -1.4);
scene.add(table);

/* a small wall frame for a suggestion image (this will show suggestion example) */
const suggestionGeo = new THREE.PlaneGeometry(1.0, 0.6);
const suggestionMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const suggestionMesh = new THREE.Mesh(suggestionGeo, suggestionMat);
suggestionMesh.position.set(-3.5, 2.2, -6.5);
scene.add(suggestionMesh);

/* add a small plane to show webcam video in-world (near the desk) */
const webcamPlaneGeo = new THREE.PlaneGeometry(0.9, 0.5);
const webcamPlaneMat = new THREE.MeshBasicMaterial({ color: 0x07102a });
const webcamPlane = new THREE.Mesh(webcamPlaneGeo, webcamPlaneMat);
webcamPlane.position.set(3.2, 1.6, -1.7);
scene.add(webcamPlane);

/* resize handler */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -------------------------
   Loaders (textures, models)
   ------------------------- */
const loader = new THREE.TextureLoader();

/* -------------------------
   Interaction UI & Logic
   ------------------------- */
let currentIndex = 0;
let score = 0;
const log = [];

const scenarioLabel = document.getElementById('scenarioLabel');
const scoreLabel = document.getElementById('scoreLabel');
const statusLabel = document.getElementById('statusLabel');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnStartCam = document.getElementById('btnStartCam');
const btnSnapshot = document.getElementById('btnSnapshot');
const btnExport = document.getElementById('btnExport');
const btnSubmitResp = document.getElementById('btnSubmitResp');
const btnClearResp = document.getElementById('btnClearResp');
const responseText = document.getElementById('responseText');
const webcamPreview = document.getElementById('webcamPreview');
const webcamState = document.getElementById('webcamState');
const suggestionImg = document.getElementById('suggestionImg');
const suggestionText = document.getElementById('suggestionText');

function updateHUD() {
  scenarioLabel.textContent = `Scenario ${currentIndex + 1} / ${SCENARIOS.length}`;
  scoreLabel.textContent = `Score: ${score}`;
}

function showScenario(i) {
  const sc = SCENARIOS[i];
  updateHUD();
  statusLabel.textContent = `Loaded: ${sc.title}`;
  // set scenario panel texture to Unsplash image (cache-bust)
  const url = sc.image + '&' + encodeURIComponent(Date.now());
  loader.load(url, (tex) => {
    scenarioPanelMesh.material.map = tex;
    scenarioPanelMesh.material.needsUpdate = true;
  });
  // also update suggestion placeholder
  suggestionImg.src = ''; suggestionText.textContent = '';
  // log view
  log.push({ type: 'view', scenario: sc.id, at: new Date().toISOString() });
}

/* choice application — called when user selects one of three options */
function applyChoice(choiceIdx) {
  const sc = SCENARIOS[currentIndex];
  const ch = sc.choices[choiceIdx];
  score += ch.score;
  updateHUD();
  // feedback text — show on suggestion area
  suggestionText.textContent = `You chose: "${ch.label}". Coach: ${ch.score > 0 ? 'Constructive' : ch.score === 0 ? 'Neutral' : 'Less effective'}.`;
  log.push({ type: 'choice', scenario: sc.id, choice: ch.label, score: ch.score, at: new Date().toISOString() });
  // advance automatically after short delay
  setTimeout(() => {
    currentIndex = (currentIndex + 1) % SCENARIOS.length;
    showScenario(currentIndex);
  }, 1500);
}

/* clicking on the in-world panel to choose would use raycasting;
   for simplicity we map keyboard 1/2/3 to choices and also handle click near objects.
*/
window.addEventListener('keydown', (ev) => {
  if (ev.key === '1') applyChoice(0);
  if (ev.key === '2') applyChoice(1);
  if (ev.key === '3') applyChoice(2);
});

/* HUD button wiring */
btnPrev.addEventListener('click', () => { currentIndex = (currentIndex - 1 + SCENARIOS.length) % SCENARIOS.length; showScenario(currentIndex); });
btnNext.addEventListener('click', () => { currentIndex = (currentIndex + 1) % SCENARIOS.length; showScenario(currentIndex); });
btnExport.addEventListener('click', () => {
  const data = { exportedAt: new Date().toISOString(), score, log };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'training-session.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
});

/* Response submit / clear */
btnSubmitResp.addEventListener('click', () => {
  const txt = (responseText.value || '').trim();
  if (!txt) { alert('Please type a response.'); return; }
  log.push({ type: 'response', scenario: SCENARIOS[currentIndex].id, text: txt, at: new Date().toISOString() });
  suggestionText.textContent = `Saved response: "${txt}"`;
  responseText.value = '';
});
btnClearResp.addEventListener('click', () => { responseText.value = ''; });

/* -------------------------
   Webcam + face-api (expression detection)
   ------------------------- */
let webcamStream = null;
let webcamVideoElement = null;
let webcamTexture = null;
let detectionInterval = null;

async function startCameraAndModels() {
  if (webcamStream) { stopCamera(); return; }

  try {
    // load models (small face expression model)
    statusLabel.textContent = 'Loading face detection models...';
    // We use the bundled models hosted by unpkg (face-api requires model files)
    // Using a public model host: https://justadudewhohacks.github.io/face-api.js/models/
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    // optional: landmark net could help, but not required
    statusLabel.textContent = 'Models loaded. Starting camera...';

    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360, facingMode: 'user' }, audio: false });
    webcamStream = stream;
    webcamVideoElement = webcamPreview;
    webcamVideoElement.srcObject = stream;
    await webcamVideoElement.play();

    // create a three.js video texture and apply to in-world plane
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    webcamTexture = new THREE.VideoTexture(video);
    webcamTexture.minFilter = THREE.LinearFilter;
    webcamTexture.magFilter = THREE.LinearFilter;
    webcamPlane.material.map = webcamTexture;
    webcamPlane.material.needsUpdate = true;

    webcamState.textContent = 'Camera: on';
    btnSnapshot.disabled = false;
    btnStartCam.textContent = 'Stop Camera';

    // start detection loop every 700ms
    detectionInterval = setInterval(async () => {
      if (!webcamVideoElement || webcamVideoElement.readyState < 2) return;
      // tiny face detector options
      const detections = await faceapi.detectSingleFace(webcamVideoElement, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      if (detections && detections.expressions) {
        // find top expression
        const expr = detections.expressions;
        let top = { name: 'neutral', val: 0 };
        for (const k of Object.keys(expr)) {
          if (expr[k] > top.val) { top = { name: k, val: expr[k] }; }
        }
        // map face-api expression names to our suggestion keys
        let mapped = 'neutral';
        if (top.name === 'happy') mapped = 'happy';
        else if (top.name === 'sad') mapped = 'sad';
        else if (top.name === 'angry') mapped = 'angry';
        else if (top.name === 'surprised') mapped = 'surprised';
        else if (top.name === 'fearful') mapped = 'fearful';
        else mapped = 'neutral';

        applySuggestion(mapped);
        // log expression event
        log.push({ type: 'expression', scenario: SCENARIOS[currentIndex].id, expression: mapped, confidence: top.val, at: new Date().toISOString() });
      }
    }, 700);

    statusLabel.textContent = 'Camera + detection active.';
  } catch (err) {
    console.error('Camera/detection error', err);
    alert('Could not access camera or load models. See console for details.');
    statusLabel.textContent = 'Camera: error';
  }
}

function stopCamera() {
  if (detectionInterval) { clearInterval(detectionInterval); detectionInterval = null; }
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  if (webcamTexture) {
    webcamPlane.material.map = null;
    webcamTexture = null;
  }
  if (webcamPreview) {
    webcamPreview.pause();
    webcamPreview.srcObject = null;
  }
  webcamState.textContent = 'Camera: off';
  btnSnapshot.disabled = true;
  btnStartCam.textContent = 'Start Camera';
  statusLabel.textContent = 'Camera stopped.';
}

btnStartCam.addEventListener('click', () => {
  if (webcamStream) stopCamera(); else startCameraAndModels();
});

/* snapshot */
btnSnapshot.addEventListener('click', () => {
  if (!webcamPreview || !webcamPreview.videoWidth) return alert('Camera not ready');
  const c = document.createElement('canvas'); c.width = webcamPreview.videoWidth; c.height = webcamPreview.videoHeight;
  const ctx = c.getContext('2d'); ctx.drawImage(webcamPreview, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/png');
  log.push({ type: 'snapshot', scenario: SCENARIOS[currentIndex].id, dataUrl, at: new Date().toISOString() });
  statusLabel.textContent = 'Snapshot saved to session log';
});

/* map expression key -> suggestion + set suggestion image (Unsplash) */
function applySuggestion(key) {
  const s = EXPRESSION_SUGGESTIONS[key] || EXPRESSION_SUGGESTIONS.neutral;
  suggestionText.textContent = s.text;
  // fetch an example image from Unsplash Source API
  const url = 'https://source.unsplash.com/600x400/?' + encodeURIComponent(s.imageQuery);
  suggestionImg.src = url + '&' + encodeURIComponent(Date.now()); // cache-bust
  // also set as texture on suggestionMesh in the 3D world
  loader.load(url + '&' + encodeURIComponent(Date.now()), (tex) => {
    suggestionMesh.material.map = tex;
    suggestionMesh.material.needsUpdate = true;
  });
}

/* -------------------------
   Simple raycasting for clicks in world
   ------------------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (ev) => {
  // convert to NDC
  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  // test intersection with scenarioPanelMesh, opt boxes (we didn't create opt boxes here, so click on panel toggles choice0)
  const intersects = raycaster.intersectObjects([scenarioPanelMesh, webcamPlane, suggestionMesh], true);
  if (intersects.length > 0) {
    // clicking the scenario panel will select option 0
    applyChoice(0);
  }
});

/* -------------------------
   Animate loop
   ------------------------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update(0.01);
  renderer.render(scene, camera);
}
animate();

/* -------------------------
   Initialize: show first scenario
   ------------------------- */
showScenario(currentIndex);

/* -------------------------
   Small helper: auto-advance by clicking keyboard 1/2/3
   Also expose some helpers to window for debugging
   ------------------------- */
window.__training = { scene, camera, showScenario, SCENARIOS, log };

/* end of module */

