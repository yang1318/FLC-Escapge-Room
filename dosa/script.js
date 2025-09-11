/*
 * LABS QUEST – 스마트홈 어드벤처 (모바일 세로 고정 1024x1536)
 * - 모든 레이어는 #app(1024x1536) 내부에서만 렌더링되도록 수정
 * - 터치 친화적 사이즈 및 이펙트 개선
 * - 첫 사용자 상호작용 시 BGM 재생
 */

// ===== 전역 상태 =====
const state = {
  currentScene: null,
  lineIndex: 0,
  waitingClick: false,
  typing: false,
  currentTyping: null,
  skipRequested: false,
  missions: {
    south: false, // red (주작)
    north: false, // black (현무)
    west: false,  // white (백호)
    east: false,  // blue (청룡)
    center: false // yellow (황중앙)
  },
  lastParkingCode: '1345',
  livingRoomLayer: null,
  // 현재 선택된 색온도(앰비언트 유지용). 초기값은 5700K(하얀빛).
  ambientKelvin: 5700,

  // === 추가된 전역 상태 (요구사항) ===
  // elec: 콘센트 전력을 차단하지 않았을 때 true, 3초간 전체끄기 유지로 차단되면 false
  // tiger: 자동차 장난감 비밀번호 해제 성공 시 true (실패/미해제는 false)
  // vent: 환기 전원이 ON이면 true, OFF면 false
  elec: true,   // 초기값: true
  tiger: false, // 초기값: false
  vent: false   // 초기값: false
};

// ===== DOM 참조 =====
const app = document.getElementById('app');
const backgroundEl = document.getElementById('background');
const ambientOverlay = document.getElementById('ambient-overlay'); // 색온도 배경 오버레이
const dialogueBox = document.getElementById('dialogue-box');
const portraitEl = document.getElementById('character-portrait');
const dialogueTextEl = document.getElementById('dialogue-text');
const choiceContainer = document.getElementById('choice-container');
const gaugeContainer = document.getElementById('gauge-container');
const gaugeSegments = {
  north: document.querySelector('.gauge-segment.north'),
  south: document.querySelector('.gauge-segment.south'),
  east: document.querySelector('.gauge-segment.east'),
  west: document.querySelector('.gauge-segment.west'),
  center: document.querySelector('.gauge-segment.center')
};
const modalContainer = document.getElementById('modal-container');
const toastEl = document.getElementById('toast');
const bgm = document.getElementById('bgm');

// ===== 이미지 프리로드 =====
const imageCache = {};
function preload(src) {
  if (!imageCache[src]) {
    const img = new Image();
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

// ===== 토스트 =====
let toastTimeout = null;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.style.opacity = '0';
    toastTimeout = null;
  }, 1800);
}

// ===== 배경 페이드 전환 =====
// Fade the background to a new image
function ensureBgLayers() {
  if (!backgroundEl.querySelector('.bg-layer')) {
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.className = 'bg-layer active';
    b.className = 'bg-layer';
    backgroundEl.appendChild(a);
    backgroundEl.appendChild(b);
  }
}

let flip = false;
function setBackground(src) {
  ensureBgLayers();
  const [a, b] = backgroundEl.querySelectorAll('.bg-layer');
  const top  = flip ? b : a;  // 올라올 레이어
  const back = flip ? a : b;  // 내려갈 레이어

  const img = preload(src);
  const swap = async () => {
    back.style.backgroundImage = `url(${src})`;
    // 크로스페이드
    top.classList.remove('active');
    back.classList.add('active');
    flip = !flip;
  };

  if (img.complete) swap();
  else img.addEventListener('load', swap, { once: true });
}

/* ===========================================================
   동적 배경 결정 (요구사항)
   - 장면 2 이후(즉, id >= 3) 모든 배경은 elec/tiger/vent 조합으로 결정
   =========================================================== */
function getDynamicBackgroundSrc() {
  const elecKey = state.elec ? 'elecon' : 'elecoff';
  const tigerKey = state.tiger ? 'tigeron' : 'tigeroff';
  const ventKey  = state.vent  ? 'venton'  : 'ventoff';
  return `assets/images/${elecKey}_${tigerKey}_${ventKey}.png`;
}

// 현재 장면이 동적 배경을 사용하는 경우 즉시 반영
function refreshDynamicBackgroundIfNeeded() {
  if (state.currentScene !== null && state.currentScene >= 3) {
    setBackground(getDynamicBackgroundSrc());
  }
}

// ===== 색온도 → RGB 근사 (Tanner Helland 알고리즘) =====
function kelvinToRGB(kelvin) {
  let temp = kelvin / 100;
  let r, g, b;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = Math.min(255, Math.max(0, r));
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    g = Math.min(255, Math.max(0, g));
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    g = Math.min(255, Math.max(0, g));
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = Math.min(255, Math.max(0, b));
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

// ===== 배경 오버레이 색온도 적용(보정 강화) =====
function setAmbientFromKelvin(k) {
  if (!ambientOverlay) return;

  // 1) 물리 RGB
  const src = kelvinToRGB(k);

  // 2) '더 따뜻하게' 보이도록 목표색을 주황/노랑으로 설정
  const warmTarget = { r: 255, g: 176, b: 64 };

  // 3) 따뜻함 정도: 5700K(차가움)=0 → 3000K(따뜻함)=1
  const t = Math.min(1, Math.max(0, (5700 - k) / (5700 - 3000)));

  // 4) 색 보정(블렌딩): 따뜻할수록 목표색 쪽으로 더 강하게
  const blend = (a, b, amt) => Math.round(a + (b - a) * amt);
  const blendAmt = 0.25 + 0.55 * t; // 최대 약 0.8까지 당김
  const r = blend(src.r, warmTarget.r, blendAmt);
  const g = blend(src.g, warmTarget.g, blendAmt);
  const b = blend(src.b, warmTarget.b, blendAmt);
  ambientOverlay.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

  // 5) 불투명도: 따뜻할수록 더 두껍게(최대 약 0.7)
  const baseOpacity = 0.25; // 차가운 쪽 최소
  const extra = 0.45 * t;   // 따뜻할수록 추가
  ambientOverlay.style.opacity = String(baseOpacity + extra);
}

// ===== 게이지 업데이트 =====
function updateGauge() {
  ['north','south','east','west','center'].forEach(dir => {
    if (state.missions[dir]) {
      gaugeSegments[dir].classList.add('active');
    } else {
      gaugeSegments[dir].classList.remove('active');
    }
  });
}

// ===== 사신 연출 =====
function showCreature(creature) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '50';
  overlay.style.pointerEvents = 'none';
  overlay.style.background = 'rgba(0,0,0,0.45)';

  const img = document.createElement('img');
  img.src = `assets/images/${creature}.png`;
  img.style.width = '512px';
  img.style.maxWidth = '512px';
  img.style.objectFit = 'contain';
  img.style.animation = 'fadeCreature 1.2s ease forwards';
  overlay.appendChild(img);

  app.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1400);
}

// keyframes (사신 페이드)
const creatureStyle = document.createElement('style');
creatureStyle.textContent = `
  @keyframes fadeCreature {
    from { opacity: 0; transform: scale(0.88);}
    to   { opacity: 1; transform: scale(1);}
  }
`;
document.head.appendChild(creatureStyle);

// ===== 타자기 효과 =====
function typeText(text, callback) {
  state.typing = true;
  state.skipRequested = false;
  dialogueTextEl.innerHTML = '';
  let index = 0;

  function step() {
    if (state.skipRequested) {
      dialogueTextEl.innerHTML = text.replace(/\n/g, '<br>');
      state.typing = false;
      callback && callback();
      return;
    }
    const char = text[index];
    if (char === '\n') {
      dialogueTextEl.innerHTML += '<br>';
    } else {
      dialogueTextEl.innerHTML += char;
    }
    index++;
    if (index < text.length) {
      state.currentTyping = setTimeout(step, 26);
    } else {
      state.typing = false;
      callback && callback();
    }
  }
  step();
}

// ===== 다음 대사/로직 =====
function showNextLine() {
  const scene = scenes.find(s => s.id === state.currentScene);
  if (!scene) return;

  if (scene.script && state.lineIndex < scene.script.length) {
    const line = scene.script[state.lineIndex];
    state.lineIndex++;

    if (line.expression) {
      portraitEl.src = line.expression;
      portraitEl.style.display = 'block';
    } else {
      portraitEl.style.display = 'none';
    }

    dialogueBox.classList.remove('hidden');

    typeText(line.text, () => {
      state.waitingClick = true;
      if (state.lineIndex === scene.script.length && scene.choices) {
        showChoices(scene.choices);
      }
    });
  } else {
    dialogueBox.classList.add('hidden');

    if (scene.choices) {
      showChoices(scene.choices);
      return;
    }
    if (scene.process) {
      scene.process();
      return;
    }
    if (scene.nextScene) {
      showScene(scene.nextScene);
      return;
    }
  }
}

// ===== 선택지 =====
function showChoices(choices) {
  choiceContainer.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      choiceContainer.innerHTML = '';
      if (choice.onSelect) choice.onSelect();
      if (choice.nextScene) showScene(choice.nextScene);
    });
    choiceContainer.appendChild(btn);
  });
}

/* ===========================================================
   씬 전환
   - id < 3: 기존 scene.background 사용
   - id >= 3: 전역 상태(elec/tiger/vent) 조합으로 동적 배경 적용
   =========================================================== */
function showScene(id) {
  if (state.livingRoomLayer) {
    state.livingRoomLayer.remove();
    state.livingRoomLayer = null;
  }
  modalContainer.classList.add('hidden');
  modalContainer.innerHTML = '';
  choiceContainer.innerHTML = '';
  dialogueBox.classList.add('hidden');
  state.lineIndex = 0;
  state.currentScene = id;

  const scene = scenes.find(s => s.id === id);
  if (!scene) return;

  if (id >= 3) {
    setBackground(getDynamicBackgroundSrc());
  } else {
    if (scene.background) setBackground(scene.background);
  }

  if (id >= 3) {
    gaugeContainer.style.display = 'block';
  } else {
    gaugeContainer.style.display = 'none';
  }
  updateGauge();

  if (scene.script && scene.script.length > 0) {
    showNextLine();
  } else if (scene.process) {
    scene.process();
  }
}

// ===== 대사 클릭/스킵 =====
dialogueBox.addEventListener('click', () => {
  if (state.typing) {
    state.skipRequested = true;
    return;
  }
  if (state.waitingClick) {
    state.waitingClick = false;
    showNextLine();
  }
});

// ===== 씬 정의 =====
const scenes = [
  {
    id: 1,
    background: 'assets/images/ruined_city.png',
    script: [
      { speaker: 'Narrator', text: '도사가 사라지고, 스마트 홈시스템이 마비됐다.' }
    ],
    nextScene: 2
  },
  {
    id: 2,
    background: 'assets/images/white_bg.png',
    script: [
      {
        speaker: '도사',
        expression: 'assets/images/sage_face.png',
        text: '제자여.. 스마트홈에 숨어있는 4개의 생활 주문을 풀어 사방신을 깨워야한다. 그래야 이 재앙을 멈출 수 있다.'
      },
      {
        speaker: '도사',
        expression: 'assets/images/sage_face.png',
        text: '베스틴 스마트홈에 가보자.'
      }
    ],
    nextScene: 3
  },
  {
    id: 3,
    // background는 무시되고 동적 배경으로 대체됨
    background: 'assets/images/living_room.png',
    script: [
      { speaker: 'Narrator', text: '거실에는 월패드와 흰 호랑이 장난감 자동차, 액자가 보인다. 무엇을 먼저 살펴볼까?' }
    ],
    process: runLivingRoom
  },
  {
    id: 4,
    // 이후 씬들도 모두 동적 배경 사용
    background: 'assets/images/peaceful_city.png',
    script: [
      { speaker: 'Narrator', text: '모든 생활 주문이 풀리자, 사방신의 힘이 하나로 모여 나무 원이 빛난다.' }
    ],
    process: runGaugeComplete
  },
  {
    id: 5,
    background: 'assets/images/peaceful_city.png',
    script: [],
    process: runInfiltration
  },
  {
    id: 6,
    background: 'assets/images/peaceful_city.png',
    script: [
      { speaker: '도사', expression: 'assets/images/sage_face.png', text: '제자여. 스마트홈의 사방신을 모두 깨웠구나.' },
      { speaker: '도사', expression: 'assets/images/sage_face.png', text: '베스틴 스마트홈의 관리자는 스마트홈의 기능을 이해하고, 지혜가 있어야한다.' },
      { speaker: '도사', expression: 'assets/images/sage_face.png', text: '너는 베스틴 스마트홈 관리자가 될 자격이 있구나.' },
      { speaker: '도사', expression: 'assets/images/sage_face.png', text: '난 이제 편히 눈을 감을 수 있겠구나. 축하한다.' }
    ],
    nextScene: 7
  },
  {
    id: 7,
    background: 'assets/images/peaceful_city.png',
    script: [
      { speaker: 'Narrator', text: '평화로운 도시의 모습이 보인다.' },
      { speaker: 'Narrator', text: '스마트홈 시스템은 정상화되었고, 난 HDC LABS의 베스틴 스마트홈 관리자가 되었다.' }
    ],
    nextScene: null
  }
];

// ===== 거실 인터랙션 레이어 =====
function runLivingRoom() {
  gaugeContainer.style.display = 'block';
  updateGauge();

  const layer = document.createElement('div');
  layer.id = 'interactive-layer';
  layer.style.position = 'absolute';
  layer.style.top = '0';
  layer.style.left = '0';
  layer.style.width = '100%';
  layer.style.height = '100%';
  layer.style.zIndex = '4';
  layer.style.pointerEvents = 'none';

  // 월패드 (좌측 벽)
  const wallpad = document.createElement('div');
  wallpad.classList.add('hotspot');
  wallpad.style.position = 'absolute';
  wallpad.style.top = '30%';
  wallpad.style.left = '5%';
  wallpad.style.width = '22%';
  wallpad.style.height = '40%';
  wallpad.style.cursor = 'pointer';
  wallpad.style.pointerEvents = 'auto';
  wallpad.setAttribute('title', '월패드');
  wallpad.addEventListener('click', () => openWallpad());
  layer.appendChild(wallpad);

  // 액자 (소파 위)
  const frame = document.createElement('div');
  frame.classList.add('hotspot');
  frame.style.position = 'absolute';
  frame.style.top = '30%';
  frame.style.left = '40%';
  frame.style.width = '20%';
  frame.style.height = '25%';
  frame.style.cursor = 'pointer';
  frame.style.pointerEvents = 'auto';
  frame.setAttribute('title', '액자');
  frame.addEventListener('click', () => openNote());
  layer.appendChild(frame);

  // 장난감 자동차 (하단 좌측)
  const car = document.createElement('div');
  car.classList.add('hotspot');
  car.style.position = 'absolute';
  car.style.top = '70%';
  car.style.left = '15%';
  car.style.width = '20%';
  car.style.height = '20%';
  car.style.cursor = 'pointer';
  car.style.pointerEvents = 'auto';
  car.setAttribute('title', '장난감 자동차');
  car.addEventListener('click', () => {
      if (!state.missions.west) {
        openCarLock()
      }
    }
  );
  layer.appendChild(car);

  app.appendChild(layer);
  state.livingRoomLayer = layer;
}

// ===== 쪽지 =====
function openNote() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '840px';
  content.innerHTML = `
    <h3>쪽지</h3>
    <p>방을 노을빛으로 물들이면 사방신 주작이 깨어난다.</p>
    <p>현무의 물결은 잔잔해야 한다. 3초간 방에 전기가 흐르지 않도록 유지해라.</p>
    <p>철마차가 떠난 시각을 기억하라. 그럼 백호가 움직일 것이다.</p>
    <p>청룡이 나타날 수 있도록, 깨끗한 하늘과 같은 환경을 만들어라.</p>
    <div style="text-align:center;margin-top:1rem;">
      <button id="close-note" class="btn-secondary">닫기</button>
    </div>
  `;
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');
  document.getElementById('close-note').addEventListener('click', () => {
    modalContainer.classList.add('hidden');
  });
}

// ===== 월패드 홈 =====
function openWallpad() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '960px';
  content.style.position = 'relative';

  const title = document.createElement('h3');
  title.textContent = '월패드';
  title.style.textAlign = 'center';
  title.style.marginBottom = '0.5rem';
  content.appendChild(title);

  const padWrapper = document.createElement('div');
  padWrapper.style.position = 'relative';
  padWrapper.style.width = '100%';
  padWrapper.style.borderRadius = '16px';
  padWrapper.style.overflow = 'hidden';
  padWrapper.style.marginBottom = '1rem';

  const img = document.createElement('img');
  img.src = 'assets/images/wallpad_home.png';
  img.style.width = '100%';
  img.style.display = 'block';
  padWrapper.appendChild(img);

  // 클릭 좌표로 아이콘 영역 판별 (우측 45% 영역, 2x2)
  padWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = padWrapper.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    if (xRatio < 0.55) return; // 좌측은 무시

    const row = yRatio < 0.45 ? 'top' : 'bottom';
    const col = xRatio < 0.73 ? 'left' : 'right';

    modalContainer.classList.add('hidden');
    if (row === 'top' && col === 'left') {
      openLighting();
    } else if (row === 'top' && col === 'right') {
      openVentilation();
    } else if (row === 'bottom' && col === 'left') {
      openParking();
    } else if (row === 'bottom' && col === 'right') {
      openOutlet();
    } else {
      showToast('아직 구현되지 않은 기능입니다.');
    }
  });

  content.appendChild(padWrapper);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '닫기';
  closeBtn.className = 'btn-secondary';
  closeBtn.style.display = 'block';
  closeBtn.style.margin = '0 auto';
  closeBtn.addEventListener('click', () => {
    modalContainer.classList.add('hidden');
  });
  content.appendChild(closeBtn);

  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');
}

/* =========================================
   조명 – 실제 월패드 색온도 슬라이더 구현 (개선)
   ========================================= */
function openLighting() {
  const content = document.createElement('div');
  content.className = 'modal-content tintable-light'; /* 모달 틴팅 활성 */
  content.style.width = '900px';

  content.innerHTML = `
    <h3>조명 제어</h3>
    <p style="margin-top:0.2rem">오른쪽 <strong>세로 슬라이더</strong>를 드래그하여 색온도를 조절하세요. (위쪽=하얀빛, 아래쪽=노을빛)</p>

    <div class="wallpad-light-wrap" aria-label="월패드 조명 제어 화면">
      <img class="wallpad-light-img" src="assets/images/Color_Temperature_Adjustment_Screen.png" alt="월패드 색온도 조절 화면" />
      <!-- 실제로 동작하는 커스텀 세로 슬라이더 (이미지 위에 정밀 오버레이) -->
      <div id="ct-slider" class="vslider" role="slider" aria-label="색온도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
        <div class="vslider-track" aria-hidden="true"></div>
        <div class="vslider-thumb" aria-hidden="true"></div>
      </div>
    </div>

    <div class="ct-readout-wrap">
      <div id="ct-swatch" class="ct-swatch" aria-hidden="true"></div>
      <p id="ct-readout" class="ct-readout">색온도 5700K · 차가운 흰색</p>
    </div>

    <div style="text-align:center; margin-top:1rem;">
      <button id="light-close" class="btn-secondary">닫기</button>
    </div>
  `;

  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');

  const slider = content.querySelector('#ct-slider');
  const thumb = slider.querySelector('.vslider-thumb');
  const readout = content.querySelector('#ct-readout');
  const swatch  = content.querySelector('#ct-swatch');

  // value: 0(상단, 하얀색=5700K) ~ 100(하단, 노란색=3000K)
  // 현재 유지 중인 색온도(state.ambientKelvin)를 슬라이더 위치로 반영
  const K_MIN = 3000, K_MAX = 5700;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function valueToKelvin(v) {
    const t = v / 100; // 0 → 1
    return Math.round(K_MAX - (K_MAX - K_MIN) * t);
  }
  function kelvinToValue(k) {
    // k=5700 -> 0, k=3000 -> 100
    const t = (K_MAX - k) / (K_MAX - K_MIN);
    return clamp(Math.round(t * 100), 0, 100);
  }

  function kelvinToLabel(k) {
    if (k >= 5200) return '차가운 흰색';
    if (k >= 4200) return '중성 백색';
    if (k >= 3600) return '따뜻한 백색';
    return '노을빛';
  }

  function updateSwatchFromKelvin(k) {
    const { r, g, b } = kelvinToRGB(k);
    swatch.style.background = `rgb(${r},${g},${b})`;
  }

  // 모달 자체 틴트(색온도 연동) - CSS 변수 업데이트
  function setModalTintFromKelvin(k) {
    // ambient와 동일한 보정 로직을 사용하되, 과하지 않게 알파만 다르게
    const src = kelvinToRGB(k);
    const warmTarget = { r: 255, g: 176, b: 64 };
    const t = Math.min(1, Math.max(0, (K_MAX - k) / (K_MAX - K_MIN)));
    const blendAmt = 0.22 + 0.50 * t; // 모달은 ambient보다 약간 낮게
    const r = Math.round(src.r + (warmTarget.r - src.r) * blendAmt);
    const g = Math.round(src.g + (warmTarget.g - src.g) * blendAmt);
    const b = Math.round(src.b + (warmTarget.b - src.b) * blendAmt);

    // 따뜻할수록 강하게: top/bottom 알파 및 스트로크 알파 가변
    const aTop = (0.08 + 0.28 * t).toFixed(3);     // 0.08 ~ 0.36
    const aBottom = (0.04 + 0.20 * t).toFixed(3);  // 0.04 ~ 0.24
    const aStroke = (0.06 + 0.22 * t).toFixed(3);  // 0.06 ~ 0.28

    content.style.setProperty('--modal-tint-rgb', `${r}, ${g}, ${b}`);
    content.style.setProperty('--modal-tint-alpha-top', aTop);
    content.style.setProperty('--modal-tint-alpha-bottom', aBottom);
    content.style.setProperty('--modal-stroke-alpha', aStroke);
  }

  // 조명 배경(앰비언트) 동기화
  let sunsetTimer = null; // '노을빛' 1초 유지 체크

  // 초기 상태를 현재 유지 중인 색온도로 세팅
  let value = kelvinToValue(state.ambientKelvin);

  function render() {
    // thumb 위치 (중심 정렬)
    thumb.style.top = `${value}%`;
    slider.setAttribute('aria-valuenow', String(Math.round(value)));

    const k = valueToKelvin(value);
    readout.textContent = `색온도 ${k}K · ${kelvinToLabel(k)}`;
    updateSwatchFromKelvin(k);

    // 배경/모달 동시에 업데이트 (항상 표시)
    setAmbientFromKelvin(k);
    setModalTintFromKelvin(k);

    const label = kelvinToLabel(k);

    // '노을빛' 조건 1초 유지 시 주작 발동
    if (label === '노을빛' && !state.missions.south) {
      if (!sunsetTimer) {
        sunsetTimer = setTimeout(() => {
          const currentK = valueToKelvin(value);
          if (kelvinToLabel(currentK) === '노을빛' && !state.missions.south) {
            state.missions.south = true;
            updateGauge();
            showCreature('phoenix');
            showToast('주작의 힘이 깨어났습니다!');
            // 노을빛 유지: 현재 색온도를 상태에 저장하고 모달만 닫음
            state.ambientKelvin = currentK;
            setAmbientFromKelvin(state.ambientKelvin);
            setTimeout(() => {
              modalContainer.classList.add('hidden');
              // 모달 CSS 변수 초기화
              content.style.removeProperty('--modal-tint-rgb');
              content.style.removeProperty('--modal-tint-alpha-top');
              content.style.removeProperty('--modal-tint-alpha-bottom');
              content.style.removeProperty('--modal-stroke-alpha');
              checkAllMissions();
            }, 1200);
          }
          sunsetTimer = null;
        }, 1000); // 1초 지연
      }
    } else {
      // 노을빛에서 벗어나면 타이머 취소
      if (sunsetTimer) {
        clearTimeout(sunsetTimer);
        sunsetTimer = null;
      }
    }
  }

  function setValue(v) {
    value = clamp(v, 0, 100);
    render();
  }

  function clientYToValue(clientY) {
    const rect = slider.getBoundingClientRect();
    const percent = ((clientY - rect.top) / rect.height) * 100;
    return Math.max(0, Math.min(100, percent));
  }

  // 포인터(마우스/터치) 처리
  function onPointerDown(e) {
    e.preventDefault();
    slider.setPointerCapture?.(e.pointerId);
    setValue(clientYToValue(e.clientY));

    const move = (ev) => setValue(clientYToValue(ev.clientY));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  slider.addEventListener('pointerdown', onPointerDown, { passive: false });

  // 키보드 접근성
  slider.addEventListener('keydown', (e) => {
    const step = (e.shiftKey ? 10 : 3);
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      setValue(value + step);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      setValue(value - step);
      e.preventDefault();
    } else if (e.key === 'Home') {
      setValue(0); e.preventDefault();
    } else if (e.key === 'End') {
      setValue(100); e.preventDefault();
    }
  });

  // 초기 렌더 (현재 유지 중인 색온도로)
  requestAnimationFrame(render);

  // 닫기
  content.querySelector('#light-close').addEventListener('click', () => {
    if (sunsetTimer) {
      clearTimeout(sunsetTimer);
      sunsetTimer = null;
    }
    // 닫기 시에도 현재 설정 색온도를 '유지'
    state.ambientKelvin = valueToKelvin(value);
    setAmbientFromKelvin(state.ambientKelvin);

    modalContainer.classList.add('hidden');
    // 모달 CSS 변수 정리
    content.style.removeProperty('--modal-tint-rgb');
    content.style.removeProperty('--modal-tint-alpha-top');
    content.style.removeProperty('--modal-tint-alpha-bottom');
    content.style.removeProperty('--modal-stroke-alpha');
  });
}

// ===== 콘센트 =====
function openOutlet() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '840px';
  content.innerHTML = `
    <h3>콘센트 제어</h3>
    <p>모든 전원을 끄고 3초간 유지하세요.</p>
    <div id="outlet-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem; margin-top:1rem;">
      <div class="tile">거실<br><small>ON</small></div>
      <div class="tile">방1<br><small>ON</small></div>
      <div class="tile">방2<br><small>ON</small></div>
      <div class="tile">방3<br><small>ON</small></div>
    </div>
    <div style="margin-top:1rem; text-align:center;">
      <button id="outlet-off" class="btn-danger">전체끄기</button>
    </div>
    <p id="outlet-timer" style="text-align:center; margin-top:0.5rem;"></p>
    <div style="text-align:center; margin-top:1rem;">
      <button id="outlet-close" class="btn-secondary">닫기</button>
    </div>
  `;
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');

  const offBtn = content.querySelector('#outlet-off');
  const timerP = content.querySelector('#outlet-timer');
  let countdown;

  offBtn.addEventListener('click', () => {
    state.elec = false;
    refreshDynamicBackgroundIfNeeded();
    offBtn.disabled = true;
    let remaining = 4;
    timerP.textContent = `${remaining - 1}초...`;
    showToast(`${remaining - 1}초...`);
    countdown = setInterval(() => {
      remaining--;
      if (remaining > 1) {
        timerP.textContent = `${remaining - 1}초...`;
        showToast(`${remaining - 1}초...`);
      } else if (remaining == 1) {
          showToast(`완료!`);
          timerP.textContent = '완료!';
      } 
      else {
        clearInterval(countdown);
        if (!state.missions.north) {
          state.missions.north = true;
          updateGauge();
          showCreature('black_tortoise');
          showToast('현무의 힘이 깨어났습니다!');
        }
        setTimeout(() => {
          modalContainer.classList.add('hidden');
          checkAllMissions();
        }, 1200);
      }
    }, 1000);
  });
  content.querySelector('#outlet-close').addEventListener('click', () => {
    // if (countdown) clearInterval(countdown);
    modalContainer.classList.add('hidden');
  });
}

// ===== 주차 기록 =====
function openParking() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '90vw';
  content.style.maxWidth = '800px';
  content.style.height = 'auto';
  content.style.position = 'relative';
  // Title
  const title = document.createElement('h3');
  title.textContent = '월패드';
  title.style.textAlign = 'center';
  title.style.marginBottom = '0.5rem';
  content.appendChild(title);
  // Wallpad image container
  const padWrapper = document.createElement('div');
  padWrapper.style.position = 'relative';
  padWrapper.style.width = '100%';
  padWrapper.style.borderRadius = '1rem';
  padWrapper.style.overflow = 'hidden';
  padWrapper.style.marginBottom = '1rem';
  const img = document.createElement('img');
  img.src = 'assets/images/wallpad_car_history.png';
  img.style.width = '100%';
  img.style.display = 'block';
  padWrapper.appendChild(img);
  content.appendChild(padWrapper);
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '닫기';
  closeBtn.style.display = 'block';
  closeBtn.style.margin = '0 auto';
  closeBtn.style.padding = '0.5rem 1rem';
  closeBtn.style.background = '#444';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '0.5rem';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => {
    modalContainer.classList.add('hidden');
  });
  content.appendChild(closeBtn);
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');
}

// ===== 환기 =====
function openVentilation() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '960px';

  // 현재 vent 상태에 따른 이미지 선택
  const ventImgSrc = state.vent ? 'assets/images/venton.png' : 'assets/images/ventoff.png';

  content.innerHTML = `
    <h3>환기 제어</h3>
    <div style="position:relative; width:100%; margin-top:1rem;">
      <img id="vent-img" src="${ventImgSrc}" alt="환기 상태" 
           style="width:100%; border-radius:8px; display:block; cursor:pointer;" />
    </div>
    <p style="text-align:center; margin-top:0.6rem;">
      이미지를 탭/클릭하면 환기 상태가 전환됩니다. (OFF ↔ ON)
    </p>
    <div style="text-align:center; margin-top:1rem;">
      <button id="vent-close" class="btn-secondary">닫기</button>
    </div>
  `;

  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');

  const ventImg = content.querySelector('#vent-img');

  // 이미지 클릭으로 vent 상태 토글
  ventImg.addEventListener('click', () => {
    const before = state.vent;
    state.vent = !state.vent;

    // 이미지 즉시 갱신
    ventImg.src = state.vent ? 'assets/images/venton.png' : 'assets/images/ventoff.png';

    // 동적 배경 즉시 반영
    refreshDynamicBackgroundIfNeeded();

    // 토스트 안내
    showToast(state.vent ? '환기 ON' : '환기 OFF');

    // OFF->ON 전환 "최초 1회"만 청룡 미션 달성 연출
    if (!before && state.vent && !state.missions.east) {
      state.missions.east = true;
      updateGauge();
      showCreature('blue_dragon');
      showToast('청룡의 힘이 깨어났습니다!');
      // 연출 후 자연스럽게 모달 닫고 다음 진행 체크
      setTimeout(() => {
        modalContainer.classList.add('hidden');
        checkAllMissions();
      }, 1200);
    }
  });

  content.querySelector('#vent-close').addEventListener('click', () => {
    // 상태는 그대로 유지, 모달만 닫기
    modalContainer.classList.add('hidden');
  });
}


// ===== 자동차 비밀번호 =====
function openCarLock() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '80vw';
  content.style.maxWidth = '400px';
  content.innerHTML = `
    <h3>가장 마지막 "철마차"가 떠난 시간과 분을 기억하라.</h3>
    <p>그럼 백호가 움직일 것이다.</p>
    <input type="text" id="car-code" style="width:100%; padding:0.5rem; font-size:1rem; margin-top:0.5rem; border-radius:0.5rem; border:none; background:#333; color:#fff;" placeholder="비밀번호 입력" />
    <div style="text-align:center; margin-top:1rem;">
      <button id="car-confirm" style="padding:0.5rem 1rem; background:#0a84ff; color:#fff; border:none; border-radius:0.5rem; cursor:pointer;font-size: 0.8rem;">확인</button>
      <button id="car-close" style="padding:0.5rem 1rem; margin-left:0.5rem; background:#444; color:#fff; border:none; border-radius:0.5rem; cursor:pointer;font-size: 0.8rem;">닫기</button>
    </div>
  `;
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');
  content.querySelector('#car-confirm').addEventListener('click', () => {
    const code = content.querySelector('#car-code').value.trim();
    if (code === state.lastParkingCode) {
      state.tiger = true;
      refreshDynamicBackgroundIfNeeded();
      if (!state.missions.west) {
        state.missions.west = true;
        updateGauge();
        showCreature('white_tiger');
        showToast('백호의 힘이 깨어났습니다!');
      }
      modalContainer.classList.add('hidden');
      checkAllMissions();
    } else {
      showToast('비밀번호가 틀렸습니다.');
    }
  });
  content.querySelector('#car-close').addEventListener('click', () => {
    modalContainer.classList.add('hidden');
  });
}

// ===== 모든 미션 체크 =====
function checkAllMissions() {
  const completed = state.missions.north && state.missions.south && state.missions.east && state.missions.west;
  if (completed && !state.missions.center) {
    setTimeout(() => {
      showScene(4);
    }, 500);
  }
}

// ===== 게이지 완성 연출 =====
function runGaugeComplete() {
  gaugeContainer.style.display = 'block';
  updateGauge();

  Object.keys(gaugeSegments).forEach(dir => {
    if (dir !== 'center' && state.missions[dir]) {
      gaugeSegments[dir].style.animation = 'blink 0.8s infinite';
    }
  });

  setTimeout(() => {
    Object.keys(gaugeSegments).forEach(dir => {
      gaugeSegments[dir].style.animation = '';
    });
    showIntruderOverlay(() => showScene(5));
  }, 3000);
}

// ===== 침입자 경고 오버레이 =====
function showIntruderOverlay(callback) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0, 0, 0, 0.8)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '60';
  overlay.style.cursor = 'pointer';

  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.background = 'rgba(255, 0, 0, 0.3)';
  flash.style.animation = 'flashRed 0.6s infinite';
  overlay.appendChild(flash);

  const img = document.createElement('img');
  img.src = 'assets/images/intruder.png';
  img.style.width = '600px';
  img.style.maxWidth = '600px';
  img.style.objectFit = 'contain';
  img.style.zIndex = '61';
  overlay.appendChild(img);

  const prompt = document.createElement('p');
  prompt.textContent = '베란다를 통해 누군가 들어왔습니다! 화면을 터치하여 상황을 확인하세요.';
  prompt.style.color = '#fff';
  prompt.style.marginTop = '1rem';
  prompt.style.zIndex = '61';
  prompt.style.textAlign = 'center';
  prompt.style.fontSize = '1rem';
  overlay.appendChild(prompt);

  app.appendChild(overlay);
  overlay.addEventListener('click', () => {
    overlay.remove();
    callback && callback();
  });
}

// keyframes (플래시/블링크)
const effectStyle = document.createElement('style');
effectStyle.textContent = `
  @keyframes flashRed { 0% { opacity: 0.2; } 50% { opacity: 0.6; } 100% { opacity: 0.2; } }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
`;
document.head.appendChild(effectStyle);

// ===== 침입자 찾기 퍼즐 =====
function runInfiltration() {
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.width = '920px';
  content.innerHTML = `
    <h3>침입자 찾기</h3>
    <p>스마트홈의 침입자가 누군지 알아내라.</p>
    <ul class="log-list">
      <li>07:45 AM - 사용자 A (얼굴 인식)</li>
      <li>08:12 AM - 택배 기사 (임시 출입 권한)</li>
      <li>08:50 AM - 사용자 A (스마트폰 인증)</li>
      <li>12:03 PM - 사용자 B (지문)</li>
      <li>05:20 PM - 사용자 A (스마트폰 인증)</li>
      <li>07:10 PM - 사용자 A (스마트폰 인증)</li>
    </ul>
    <div id="intrusion-choices" class="choice-col"></div>
  `;
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);
  modalContainer.classList.remove('hidden');

  const choices = [
    { text: '사용자A', value: 'A' },
    { text: '택배 기사', value: 'Delivery' },
    { text: '사용자B', value: 'B' }
  ];
  const choiceWrapper = content.querySelector('#intrusion-choices');
  choices.forEach(ch => {
    const btn = document.createElement('button');
    btn.textContent = ch.text;
    btn.className = 'btn-primary';
    btn.addEventListener('click', () => {
      if (ch.value === 'A') {
        modalContainer.classList.add('hidden');
        state.missions.center = true;
        updateGauge();
        showScene(6);
      } else {
        showToast('틀렸습니다. 다시 생각해보세요.');
      }
    });
    choiceWrapper.appendChild(btn);
  });
}

// ===== 초기화 =====
function init() {
  // 동적 배경에 쓰이는 8종 이미지 프리로드 (끊김 방지)
  [
    'assets/images/elecoff_tigeroff_ventoff.png',
    'assets/images/elecoff_tigeroff_venton.png',
    'assets/images/elecoff_tigeron_ventoff.png',
    'assets/images/elecoff_tigeron_venton.png',
    'assets/images/elecon_tigeroff_ventoff.png',
    'assets/images/elecon_tigeroff_venton.png',
    'assets/images/elecon_tigeron_ventoff.png',
    'assets/images/elecon_tigeron_venton.png'
  ].forEach(preload);

  // BGM: 첫 상호작용 시 재생
  bgm.volume = 0.4;
  const resumeAudio = () => {
    bgm.play().catch(() => {});
    window.removeEventListener('pointerdown', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('pointerdown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // 시작
  showScene(1);
}

// ===== 시작 =====
document.addEventListener('DOMContentLoaded', init);
