// JavaScript for inbase Smart Puzzle Quest
document.addEventListener('DOMContentLoaded', () => {
  /*** Navigation setup ***/
  const sections = document.querySelectorAll('.page');
  function goToSection(id) {
    sections.forEach((sec) => {
      if (sec.id === id) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
  }

  // Track completion status for stages
  const status = {
    s1: false,
    s2: false,
    s3: false,
    s4: false,
    s5: false,
    s6: false,
  };

  /*** Intro page ***/
  const introSection = document.getElementById('intro-section');
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    introSection.classList.add('open');
    setTimeout(() => {
      goToSection('guide-section');
    }, 1200);
  });

  /*** Guide page ***/
  const toStage1Btn = document.getElementById('to-stage1');
  // Navigate to the first stage when clicking "탐험 시작" on the guide page.
  // Use preventDefault to ensure no unwanted navigation occurs (e.g. if the button is inside a form)
  toStage1Btn.addEventListener('click', (e) => {
    e.preventDefault();
    goToSection('stage1-section');
    // initialize the first stage input state
    stage1Input.value = '';
    stage1Confirm.disabled = true;
    stage1Msg.style.display = 'none';
    stage1Msg.className = 'mission-message';
    stage1Next.classList.add('hidden');
    // hide the intro section completely once we move to the first stage
    introSection.style.display = 'none';
  });

  /*** Stage1: Password puzzle ***/
  const stage1Input = document.getElementById('stage1-input');
  const stage1Confirm = document.getElementById('stage1-confirm');
  const stage1Next = document.getElementById('stage1-next');
  const stage1Msg = document.getElementById('stage1-message');
  let stage1Answer = '0421'; // example correct password (family birthday)

  // Enable confirm button when 4 digits entered
  stage1Input.addEventListener('input', () => {
    stage1Confirm.disabled = stage1Input.value.length !== 4;
    // Hide previous message when typing
    stage1Msg.style.display = 'none';
  });
  stage1Confirm.addEventListener('click', () => {
    stage1Msg.className = 'mission-message';
    if (stage1Input.value === stage1Answer) {
      status.s1 = true;
      stage1Msg.textContent = '정답입니다! 현관문이 열립니다.';
      stage1Msg.classList.add('success');
      stage1Next.classList.remove('hidden');
      stage1Confirm.disabled = true;
    } else {
      status.s1 = false;
      stage1Msg.textContent = '비밀번호가 틀렸습니다. 다시 확인하세요.';
      stage1Msg.classList.add('error');
    }
    stage1Msg.style.display = 'block';
  });
  stage1Next.addEventListener('click', () => {
    // reset input and message for next time
    stage1Input.value = '';
    stage1Confirm.disabled = true;
    stage1Msg.style.display = 'none';
    stage1Msg.className = 'mission-message';
    stage1Next.classList.add('hidden');
    // go to stage2 and initialize
    goToSection('stage2-section');
    initStage2();
  });

  /*** Stage2: Switch ordering puzzle ***/
  const switchContainer = document.getElementById('switch-container');
  const stage2ResetBtn = document.getElementById('stage2-reset');
  const stage2NextBtn = document.getElementById('stage2-next');
  const stage2Msg = document.getElementById('stage2-message');
  let stage2Data = [];
  let stage2Order = [];
  let stage2Expected = [];

  function initStage2() {
    // clear previous elements
    switchContainer.innerHTML = '';
    stage2Msg.style.display = 'none';
    stage2Msg.className = 'mission-message';
    stage2NextBtn.classList.add('hidden');
    stage2Order = [];
    // define switches with consumption (randomly assign labels)
    stage2Data = [
      { id: 1, label: 'TV', watt: 50 },
      { id: 2, label: '스피커', watt: 30 },
      { id: 3, label: '스탠드', watt: 10 },
      { id: 4, label: '공기청정기', watt: 20 },
    ];
    // Shuffle order of buttons
    stage2Data.sort(() => Math.random() - 0.5);
    // Determine expected order (ascending consumption)
    stage2Expected = [...stage2Data].sort((a, b) => a.watt - b.watt).map((s) => s.id);
    // Render buttons
    stage2Data.forEach((sw) => {
      const btn = document.createElement('button');
      btn.classList.add('switch-btn');
      btn.textContent = `${sw.label} (${sw.watt}W)`;
      btn.dataset.id = sw.id;
      btn.dataset.watt = sw.watt;
      btn.disabled = false;
      btn.addEventListener('click', () => handleSwitchClick(btn));
      switchContainer.appendChild(btn);
    });
  }
  function handleSwitchClick(btn) {
    const id = parseInt(btn.dataset.id);
    // Determine expected id based on current progress
    const expectedId = stage2Expected[stage2Order.length];
    if (id === expectedId) {
      // correct
      btn.classList.add('selected');
      btn.disabled = true;
      stage2Order.push(id);
      if (stage2Order.length === stage2Expected.length) {
        // success
        status.s2 = true;
        stage2Msg.textContent = '정답입니다! 거실 조명이 켜집니다.';
        stage2Msg.className = 'mission-message success';
        stage2Msg.style.display = 'block';
        stage2NextBtn.classList.remove('hidden');
      }
    } else {
      // wrong order
      status.s2 = false;
      stage2Msg.textContent = '순서가 잘못되었습니다. 다시 시도해보세요.';
      stage2Msg.className = 'mission-message error';
      stage2Msg.style.display = 'block';
      // reset all buttons
      stage2Order = [];
      const buttons = switchContainer.querySelectorAll('.switch-btn');
      buttons.forEach((b) => {
        b.disabled = false;
        b.classList.remove('selected');
      });
    }
  }
  stage2ResetBtn.addEventListener('click', () => {
    initStage2();
  });
  stage2NextBtn.addEventListener('click', () => {
    goToSection('stage3-section');
    initStage3();
  });

  /*** Stage3: Kids room brightness puzzle ***/
  const kidsImage = document.getElementById('kids-image');
  const stage3Slider = document.getElementById('stage3-slider');
  const stage3Next = document.getElementById('stage3-next');
  const stage3Msg = document.getElementById('stage3-message');
  function initStage3() {
    // reset slider and image filter
    stage3Slider.value = 0;
    kidsImage.style.filter = 'blur(8px) brightness(0.5)';
    stage3Msg.style.display = 'none';
    stage3Msg.className = 'mission-message';
    stage3Next.classList.add('hidden');
    status.s3 = false;
  }
  stage3Slider.addEventListener('input', () => {
    const val = parseInt(stage3Slider.value);
    // gradually reduce blur and increase brightness
    const blur = 8 - (val / 100) * 8;
    const brightness = 0.5 + (val / 100) * 0.5;
    kidsImage.style.filter = `blur(${blur}px) brightness(${brightness})`;
    if (val > 80 && !status.s3) {
      // success when slider past threshold
      status.s3 = true;
      stage3Msg.textContent = '아이의 상태를 확인했습니다!';
      stage3Msg.className = 'mission-message success';
      stage3Msg.style.display = 'block';
      stage3Next.classList.remove('hidden');
    }
  });
  stage3Next.addEventListener('click', () => {
    goToSection('stage4-section');
    initStage4();
  });

  /*** Stage4: Kitchen gas leak puzzle ***/
  const kitchenOptions = document.getElementById('kitchen-options');
  const stage4NextBtn = document.getElementById('stage4-next');
  const stage4Msg = document.getElementById('stage4-message');
  function initStage4() {
    // clear previous
    kitchenOptions.innerHTML = '';
    stage4Msg.style.display = 'none';
    stage4Msg.className = 'mission-message';
    stage4NextBtn.classList.add('hidden');
    status.s4 = false;
    // define options: correct and distractors
    const options = [
      { img: 'icon_valve.png', correct: true, label: '가스 차단' },
      { img: 'icon_cctv.png', correct: false, label: 'CCTV' },
      { img: 'icon_calendar.png', correct: false, label: '일정' },
      { img: 'icon_report.png', correct: false, label: '리포트' },
    ];
    // shuffle
    options.sort(() => Math.random() - 0.5);
    // render
    options.forEach((opt) => {
      const div = document.createElement('div');
      div.classList.add('kitchen-option');
      div.dataset.correct = opt.correct;
      const img = document.createElement('img');
      img.src = opt.img;
      img.alt = opt.label;
      div.appendChild(img);
      div.addEventListener('click', () => handleKitchenClick(div));
      kitchenOptions.appendChild(div);
    });
  }
  function handleKitchenClick(div) {
    const isCorrect = div.dataset.correct === 'true';
    stage4Msg.className = 'mission-message';
    if (isCorrect) {
      status.s4 = true;
      stage4Msg.textContent = '정답입니다! 가스가 안전하게 차단되었습니다.';
      stage4Msg.classList.add('success');
      stage4NextBtn.classList.remove('hidden');
    } else {
      status.s4 = false;
      stage4Msg.textContent = '오답입니다. 밸브 모양을 찾아보세요.';
      stage4Msg.classList.add('error');
    }
    stage4Msg.style.display = 'block';
  }
  stage4NextBtn.addEventListener('click', () => {
    goToSection('stage5-section');
    initStage5();
  });

  /*** Stage5: Sleep mode drag & drop puzzle ***/
  const sleepOptionsContainer = document.getElementById('sleep-options');
  const sleepSlotsContainer = document.getElementById('sleep-slots');
  const stage5Next = document.getElementById('stage5-next');
  const stage5Msg = document.getElementById('stage5-message');
  function initStage5() {
    // reset
    sleepOptionsContainer.innerHTML = '';
    sleepSlotsContainer.innerHTML = '';
    stage5Msg.style.display = 'none';
    stage5Msg.className = 'mission-message';
    stage5Next.classList.add('hidden');
    status.s5 = false;
    // define available items
    const items = [
      { id: 'lock', img: 'icon_lock.png', label: '현관 잠금' },
      { id: 'lights', img: 'icon_lights_off.png', label: '조명 소등' },
      { id: 'heat', img: 'icon_heater.png', label: '보일러 절전' },
    ];
    // shuffle options
    items.sort(() => Math.random() - 0.5);
    // render draggable options
    items.forEach((item) => {
      const opt = document.createElement('div');
      opt.classList.add('sleep-option');
      opt.draggable = true;
      opt.dataset.id = item.id;
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.label;
      opt.appendChild(img);
      opt.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.id);
      });
      sleepOptionsContainer.appendChild(opt);
    });
    // create three empty slots
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.classList.add('sleep-slot');
      slot.dataset.index = i;
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      slot.addEventListener('drop', (e) => handleSleepDrop(e, slot));
      sleepSlotsContainer.appendChild(slot);
    }
  }
  function handleSleepDrop(e, slot) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    // if slot already filled, do nothing
    if (slot.firstChild) return;
    // find dragged element
    const dragged = sleepOptionsContainer.querySelector(`[data-id="${id}"]`);
    if (!dragged) return;
    // append to slot
    slot.appendChild(dragged);
    // When all slots filled, check order
    const slots = Array.from(sleepSlotsContainer.children);
    if (slots.every((s) => s.firstChild)) {
      const order = slots.map((s) => s.firstChild.dataset.id);
      // correct order
      const correct = ['lock', 'lights', 'heat'];
      if (JSON.stringify(order) === JSON.stringify(correct)) {
        status.s5 = true;
        stage5Msg.textContent = '정답입니다! 취침 모드가 활성화되었습니다.';
        stage5Msg.className = 'mission-message success';
        stage5Next.classList.remove('hidden');
      } else {
        status.s5 = false;
        stage5Msg.textContent = '조합이 잘못되었습니다. 다시 배치해보세요.';
        stage5Msg.className = 'mission-message error';
      }
      stage5Msg.style.display = 'block';
    }
  }
  stage5Next.addEventListener('click', () => {
    goToSection('final-section');
    initFinalStage();
  });

  /*** Final Stage: AI butler exam ***/
  const finalInput = document.getElementById('final-input');
  const finalConfirm = document.getElementById('final-confirm');
  const finalNext = document.getElementById('final-next');
  const finalMsg = document.getElementById('final-message');
  function initFinalStage() {
    finalInput.value = '';
    finalMsg.style.display = 'none';
    finalMsg.className = 'mission-message';
    finalNext.classList.add('hidden');
    status.s6 = false;
  }
  finalConfirm.addEventListener('click', () => {
    const ans = finalInput.value.replace(/\s+/g, '');
    finalMsg.className = 'mission-message';
    const keywords = ['보안', '편의', '안전', '절약'];
    const hasAll = keywords.every((k) => ans.includes(k));
    const hasAi = ans.includes('AI') || ans.includes('ai') || ans.includes('집사');
    if (hasAll && hasAi) {
      status.s6 = true;
      finalMsg.textContent = '훌륭합니다! 당신은 inbase의 진정한 의미를 이해했습니다.';
      finalMsg.classList.add('success');
      finalNext.classList.remove('hidden');
    } else {
      status.s6 = false;
      finalMsg.textContent = '정답이 아닙니다. 키워드를 조합해 보세요.';
      finalMsg.classList.add('error');
    }
    finalMsg.style.display = 'block';
  });
  finalNext.addEventListener('click', () => {
    goToSection('results-section');
    showResults();
  });

  /*** Results page ***/
  const resultsList = document.getElementById('results-list');
  const toSummaryBtn = document.getElementById('to-summary');
  function showResults() {
    resultsList.innerHTML = '';
    const stages = [
      { id: 's1', name: '현관 보안 인증' },
      { id: 's2', name: '거실 조명 문제' },
      { id: 's3', name: '아이 방 안전 확인' },
      { id: 's4', name: '주방 가스 누출' },
      { id: 's5', name: '취침 모드 퍼즐' },
      { id: 's6', name: 'AI 집사 시험' },
    ];
    stages.forEach((stage, idx) => {
      const li = document.createElement('li');
      li.classList.add('result-item');
      li.textContent = `${stage.name}: ${status[stage.id] ? '성공' : '실패'}`;
      resultsList.appendChild(li);
    });
  }
  toSummaryBtn.addEventListener('click', () => {
    goToSection('summary-section');
    showSummary();
  });

  /*** Summary page ***/
  const summaryText = document.getElementById('summary-text');
  const starRating = document.getElementById('star-rating');
  const restartBtn = document.getElementById('restart-btn');
  const mainBtn = document.getElementById('main-btn');
  function showSummary() {
    const allPassed = Object.values(status).every((s) => s);
    if (allPassed) {
      summaryText.textContent = '축하합니다! inbase와 함께 모든 퍼즐을 해결했습니다. 당신은 스마트홈 마스터입니다.';
    } else {
      summaryText.textContent = '몇 가지 퍼즐을 놓쳤습니다. 다시 도전하여 완벽한 하루를 만들어 보세요!';
    }
  }
  // Star rating interaction
  starRating.addEventListener('mouseover', (e) => {
    const val = parseInt(e.target.dataset.value);
    if (!val) return;
    highlightStars(val);
  });
  starRating.addEventListener('mouseout', () => {
    highlightStars(0);
  });
  starRating.addEventListener('click', (e) => {
    const val = parseInt(e.target.dataset.value);
    if (!val) return;
    highlightStars(val);
    alert('소중한 평가 감사합니다!');
  });
  function highlightStars(count) {
    const stars = starRating.querySelectorAll('.star');
    stars.forEach((star) => {
      const val = parseInt(star.dataset.value);
      if (val <= count) {
        star.textContent = '★';
        star.classList.add('filled');
      } else {
        star.textContent = '☆';
        star.classList.remove('filled');
      }
    });
  }
  // Restart and main navigation
  restartBtn.addEventListener('click', () => {
    // reload the page to reset everything
    window.location.reload();
  });
  mainBtn.addEventListener('click', () => {
    // reset statuses
    Object.keys(status).forEach((key) => {
      status[key] = false;
    });
    goToSection('intro-section');
    // reset door state
    introSection.classList.remove('open');
  });
});