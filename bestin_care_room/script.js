// JavaScript controlling the Bestin smart home quiz
document.addEventListener('DOMContentLoaded', () => {
  /*** General setup ***/
  const sections = document.querySelectorAll('.page');
  // Track correct status for each puzzle
  let puzzleStatus = { p1: false, p2: false, p3: false, p4: false, p5: false };

  // Helper to switch visible section
  function goToSection(id) {
    sections.forEach((sec) => {
      if (sec.id === id) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
  }

  /*** Intro door animation ***/
  const introSection = document.getElementById('intro-section');
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    introSection.classList.add('open');
    // After doors slide, reveal guide page
    setTimeout(() => {
      goToSection('guide-section');
    }, 1200);
  });

  /*** Guide page navigation ***/
  const toPuzzle1Btn = document.getElementById('to-puzzle1');
  toPuzzle1Btn.addEventListener('click', () => {
    goToSection('puzzle1-section');
  });

  /*** Puzzle 1: entry logs ***/
  const p1Choices = document.querySelectorAll('#puzzle1-section .choice-btn');
  const p1NextBtn = document.getElementById('puzzle1-next');
  const p1Msg = document.getElementById('puzzle1-message');
  let p1Answered = false;
  p1Choices.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (p1Answered) return;
      const answer = btn.dataset.answer;
      // mark answered
      p1Answered = true;
      if (answer === 'a_phone') {
        puzzleStatus.p1 = true;
        btn.classList.add('correct');
        p1Msg.textContent = '정답입니다!';
        p1Msg.classList.add('success');
      } else {
        puzzleStatus.p1 = false;
        btn.classList.add('wrong');
        p1Msg.textContent = '틀렸습니다. 사용자 A의 스마트폰 인증 기록이 의심됩니다.';
        p1Msg.classList.add('error');
      }
      p1Msg.style.display = 'block';
      p1NextBtn.classList.remove('hidden');
    });
  });
  p1NextBtn.addEventListener('click', () => {
    p1Answered = false;
    // reset choice button classes for potential replay
    p1Choices.forEach((btn) => {
      btn.classList.remove('correct', 'wrong');
    });
    p1Msg.style.display = 'none';
    p1Msg.className = 'mission-message';
    p1NextBtn.classList.add('hidden');
    goToSection('puzzle2-section');
  });

  /*** Puzzle 2: sensor and ventilation ***/
  const ventRange = document.getElementById('vent-range');
  const ventValueLabel = document.getElementById('vent-value');
  const co2ValueLabel = document.getElementById('co2-value');
  const ventCheckBtn = document.getElementById('check-vent');
  const p2NextBtn = document.getElementById('puzzle2-next');
  const p2Msg = document.getElementById('puzzle2-message');
  let p2Evaluated = false;

  // Plus/minus buttons for ventilation slider
  const ventMinusBtn = document.getElementById('vent-minus');
  const ventPlusBtn = document.getElementById('vent-plus');

  function updateVentDisplay() {
    const minutes = parseInt(ventRange.value, 10);
    ventValueLabel.textContent = minutes;
    // initial 1200 ppm, reduce 200 per minute
    const predicted = 1200 - minutes * 200;
    co2ValueLabel.textContent = predicted < 0 ? 0 : predicted;
  }
  // Initial display update
  updateVentDisplay();
  ventRange.addEventListener('input', updateVentDisplay);

  // Adjust vent slider with plus/minus buttons
  ventMinusBtn.addEventListener('click', () => {
    const current = parseInt(ventRange.value, 10);
    if (current > parseInt(ventRange.min, 10)) {
      ventRange.value = current - 1;
      updateVentDisplay();
    }
  });
  ventPlusBtn.addEventListener('click', () => {
    const current = parseInt(ventRange.value, 10);
    if (current < parseInt(ventRange.max, 10)) {
      ventRange.value = current + 1;
      updateVentDisplay();
    }
  });
  ventCheckBtn.addEventListener('click', () => {
    // Always allow re‑evaluation; reset previous state
    const minutes = parseInt(ventRange.value, 10);
    // Remove any previous classes
    p2Msg.className = 'mission-message';
    if (minutes >= 3) {
      puzzleStatus.p2 = true;
      p2Msg.textContent = '정답입니다! 환기를 3분 이상 유지하세요.';
      p2Msg.classList.add('success');
      // Show next button only on success
      p2NextBtn.classList.remove('hidden');
    } else {
      puzzleStatus.p2 = false;
      p2Msg.textContent = 'CO₂ 수치가 아직 높습니다. 조금 더 환기해 주세요.';
      p2Msg.classList.add('error');
      // Hide next button to force retry
      p2NextBtn.classList.add('hidden');
    }
    p2Msg.style.display = 'block';
  });
  p2NextBtn.addEventListener('click', () => {
    // Reset message and hide next button for next use
    p2Msg.style.display = 'none';
    p2Msg.className = 'mission-message';
    p2NextBtn.classList.add('hidden');
    goToSection('puzzle3-section');
  });

  /*** Puzzle 3: curtains and lux ***/
  const curtainRange = document.getElementById('curtain-range');
  const curtainValueLabel = document.getElementById('curtain-value');
  const luxValueLabel = document.getElementById('lux-value');
  const curtainCheckBtn = document.getElementById('check-curtain');
  const p3NextBtn = document.getElementById('puzzle3-next');
  const p3Msg = document.getElementById('puzzle3-message');
  let p3Evaluated = false;

  // Plus/minus buttons for curtain slider
  const curtainMinusBtn = document.getElementById('curtain-minus');
  const curtainPlusBtn = document.getElementById('curtain-plus');

  function updateCurtainDisplay() {
    const percent = parseInt(curtainRange.value, 10);
    curtainValueLabel.textContent = percent;
    // approximate lux: 7lx per percent
    const lux = percent * 7;
    luxValueLabel.textContent = lux;
  }
  updateCurtainDisplay();
  curtainRange.addEventListener('input', updateCurtainDisplay);

  // Adjust curtain slider with plus/minus buttons
  curtainMinusBtn.addEventListener('click', () => {
    const current = parseInt(curtainRange.value, 10);
    const minVal = parseInt(curtainRange.min, 10);
    // step down by 5 to allow faster adjustment
    const newVal = Math.max(minVal, current - 5);
    curtainRange.value = newVal;
    updateCurtainDisplay();
  });
  curtainPlusBtn.addEventListener('click', () => {
    const current = parseInt(curtainRange.value, 10);
    const maxVal = parseInt(curtainRange.max, 10);
    const newVal = Math.min(maxVal, current + 5);
    curtainRange.value = newVal;
    updateCurtainDisplay();
  });
  curtainCheckBtn.addEventListener('click', () => {
    if (p3Evaluated) return;
    const percent = parseInt(curtainRange.value, 10);
    p3Evaluated = true;
    if (percent >= 40 && percent <= 50) {
      puzzleStatus.p3 = true;
      p3Msg.textContent = '정답입니다! 적절한 빛이 들어왔습니다.';
      p3Msg.classList.add('success');
      // Show next button only on success
      p3NextBtn.classList.remove('hidden');
    } else {
      puzzleStatus.p3 = false;
      if (percent < 40) {
        p3Msg.textContent = '조도가 부족합니다. 조금 더 열어주세요.';
      } else {
        p3Msg.textContent = '역광이 너무 강합니다. 덜 열어주세요.';
      }
      p3Msg.classList.add('error');
      p3NextBtn.classList.add('hidden');
    }
    p3Msg.style.display = 'block';
  });
  p3NextBtn.addEventListener('click', () => {
    p3Evaluated = false;
    p3Msg.style.display = 'none';
    p3Msg.className = 'mission-message';
    p3NextBtn.classList.add('hidden');
    goToSection('puzzle4-section');
  });

  /*** Puzzle 4: service records ***/
  const p4Choices = document.querySelectorAll('#puzzle4-section .choice-btn');
  const p4NextBtn = document.getElementById('puzzle4-next');
  const p4Msg = document.getElementById('puzzle4-message');
  let p4Answered = false;
  p4Choices.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (p4Answered) return;
      const ans = btn.dataset.answer;
      p4Answered = true;
      if (ans === 'filter') {
        puzzleStatus.p4 = true;
        btn.classList.add('correct');
        p4Msg.textContent = '정답입니다! 마지막으로 교체한 것은 에어컨 필터입니다.';
        p4Msg.classList.add('success');
      } else {
        puzzleStatus.p4 = false;
        btn.classList.add('wrong');
        p4Msg.textContent = '틀렸습니다. 정답은 에어컨 필터입니다.';
        p4Msg.classList.add('error');
      }
      p4Msg.style.display = 'block';
      p4NextBtn.classList.remove('hidden');
    });
  });
  p4NextBtn.addEventListener('click', () => {
    p4Answered = false;
    p4Choices.forEach((btn) => btn.classList.remove('correct', 'wrong'));
    p4Msg.style.display = 'none';
    p4Msg.className = 'mission-message';
    p4NextBtn.classList.add('hidden');
    goToSection('puzzle5-section');
  });

  /*** Puzzle 5: voice command ***/
  const voiceInput = document.getElementById('voice-input');
  const voiceCheckBtn = document.getElementById('check-voice');
  const finishBtn = document.getElementById('finish-btn');
  const p5Msg = document.getElementById('puzzle5-message');
  let p5Evaluated = false;
  voiceCheckBtn.addEventListener('click', () => {
    if (p5Evaluated) return;
    const text = voiceInput.value.trim();
    p5Evaluated = true;
    // Normalize input: remove spaces, punctuation
    const normalized = text.replace(/[\s,!"']/g, '');
    const target = '베스틴집을열어줘';
    if (normalized.includes('베스틴') && normalized.includes('집을열어줘')) {
      puzzleStatus.p5 = true;
      p5Msg.textContent = '정답입니다! AI 집사가 복구되었습니다.';
      p5Msg.classList.add('success');
    } else {
      puzzleStatus.p5 = false;
      p5Msg.textContent = '명령이 올바르지 않습니다. 다시 입력해 주세요.';
      p5Msg.classList.add('error');
    }
    p5Msg.style.display = 'block';
    finishBtn.classList.remove('hidden');
  });
  finishBtn.addEventListener('click', () => {
    p5Evaluated = false;
    p5Msg.style.display = 'none';
    p5Msg.className = 'mission-message';
    finishBtn.classList.add('hidden');
    showResults();
    goToSection('results-section');
  });

  /*** Results page ***/
  function showResults() {
    const total = 5;
    const correctCount = Object.values(puzzleStatus).filter(Boolean).length;
    const percent = Math.round((correctCount / total) * 100);
    const progressCircle = document.querySelector('.progress-circle');
    progressCircle.style.setProperty('--progress', `${percent}%`);
    document.getElementById('progress-percent').textContent = `${percent}%`;
    // populate list
    const names = [
      '퍼즐 1: 출입 기록',
      '퍼즐 2: 환기 시스템',
      '퍼즐 3: 전동 커튼',
      '퍼즐 4: 정비 기록',
      '퍼즐 5: AI 복구'
    ];
    const list = document.getElementById('completed-list');
    list.innerHTML = '';
    names.forEach((name, idx) => {
      const key = `p${idx + 1}`;
      const li = document.createElement('li');
      const passed = puzzleStatus[key];
      li.textContent = `${name} – ${passed ? '완료' : '실패'}`;
      li.style.color = passed ? '#a0eac3' : '#e8a6a6';
      list.appendChild(li);
    });
    // update summary completion percent
    document.getElementById('summary-complete').textContent = `${percent}%`;
    document.getElementById('summary-rating').textContent = correctCount === total ? '합격' : '재도전';
  }

  const toSummaryBtn = document.getElementById('to-summary');
  toSummaryBtn.addEventListener('click', () => {
    goToSection('summary-section');
  });

  /*** Summary / feedback ***/
  // Build star elements dynamically
  const starsContainer = document.getElementById('rating-stars');
  let currentRating = 0;
  // Clear any existing text
  starsContainer.textContent = '';
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement('span');
    span.classList.add('star');
    span.dataset.value = i;
    span.textContent = '★';
    starsContainer.appendChild(span);
  }
  const starElems = starsContainer.querySelectorAll('.star');
  starElems.forEach((star) => {
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.value, 10);
      highlightStars(val);
    });
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.value, 10);
      highlightStars(currentRating);
    });
  });
  starsContainer.addEventListener('mouseleave', () => {
    highlightStars(currentRating);
  });
  function highlightStars(val) {
    starElems.forEach((s) => {
      const sVal = parseInt(s.dataset.value, 10);
      if (sVal <= val) {
        s.classList.add('selected');
      } else {
        s.classList.remove('selected');
      }
    });
  }
  const feedbackBtn = document.getElementById('feedback-btn');
  feedbackBtn.addEventListener('click', () => {
    if (currentRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    alert(`감사합니다! ${currentRating}점 피드백이 제출되었습니다.`);
  });

  // Restart button: reload entire quiz
  const restartBtn = document.getElementById('restart-btn');
  restartBtn.addEventListener('click', () => {
    window.location.reload();
  });
  const mainBtn = document.getElementById('main-btn');
  mainBtn.addEventListener('click', () => {
    window.location.reload();
  });
});