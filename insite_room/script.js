// JavaScript for insite Smart Puzzle Quest
document.addEventListener('DOMContentLoaded', () => {
  /*** General setup ***/
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

  // Track stage completion status
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
  toStage1Btn.addEventListener('click', () => {
    goToSection('stage1-section');
  });

  /*** Stage 1: Graph matching ***/
  const graphOptions = document.querySelectorAll('.graph-option');
  const stage1ConfirmBtn = document.getElementById('stage1-confirm');
  const stage1NextBtn = document.getElementById('stage1-next');
  const stage1Msg = document.getElementById('stage1-message');
  let stage1Selected = null;
  graphOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      // clear previous selection
      graphOptions.forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      stage1Selected = opt.dataset.answer;
      stage1ConfirmBtn.disabled = false;
    });
  });
  stage1ConfirmBtn.addEventListener('click', () => {
    // remove any previous classes
    stage1Msg.className = 'mission-message';
    if (stage1Selected === 'borderline') {
      status.s1 = true;
      stage1Msg.textContent = '정답입니다! 긴급 점검 예약을 진행합니다.';
      stage1Msg.classList.add('success');
      stage1NextBtn.classList.remove('hidden');
      stage1ConfirmBtn.disabled = true;
    } else {
      status.s1 = false;
      stage1Msg.textContent = '틀렸습니다. 임계치에 가까운 그래프를 선택해야 합니다.';
      stage1Msg.classList.add('error');
    }
    stage1Msg.style.display = 'block';
  });
  stage1NextBtn.addEventListener('click', () => {
    // reset selection
    graphOptions.forEach((o) => o.classList.remove('selected'));
    stage1Selected = null;
    stage1ConfirmBtn.disabled = true;
    stage1Msg.style.display = 'none';
    stage1Msg.className = 'mission-message';
    stage1NextBtn.classList.add('hidden');
    goToSection('stage2-section');
    // shuffle puzzle pieces for stage2
    initStage2();
  });

  /*** Stage 2: Energy optimisation jigsaw ***/
  const energyPuzzle = document.getElementById('energy-puzzle');
  const stage2CheckBtn = document.getElementById('stage2-check');
  const stage2NextBtn = document.getElementById('stage2-next');
  const stage2Msg = document.getElementById('stage2-message');
  let draggedPiece = null;
  function shuffleNodes(parent) {
    const nodes = Array.from(parent.children);
    for (let i = nodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      parent.appendChild(nodes[j]);
    }
  }
  function initStage2() {
    // shuffle pieces each time stage is loaded
    shuffleNodes(energyPuzzle);
    // reset message and next button
    stage2Msg.style.display = 'none';
    stage2Msg.className = 'mission-message';
    stage2NextBtn.classList.add('hidden');
  }
  // enable drag and drop
  energyPuzzle.addEventListener('dragstart', (e) => {
    const target = e.target.closest('.energy-piece');
    if (!target) return;
    draggedPiece = target;
    target.classList.add('dragging');
  });
  energyPuzzle.addEventListener('dragend', (e) => {
    const target = e.target.closest('.energy-piece');
    if (target) {
      target.classList.remove('dragging');
    }
  });
  energyPuzzle.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.energy-piece');
    const afterElement = target;
    if (!afterElement || afterElement === draggedPiece) return;
    const bounding = afterElement.getBoundingClientRect();
    const offset = e.clientX - bounding.left;
    const insertBefore = offset < bounding.width / 2;
    if (insertBefore) {
      energyPuzzle.insertBefore(draggedPiece, afterElement);
    } else {
      energyPuzzle.insertBefore(draggedPiece, afterElement.nextSibling);
    }
  });
  stage2CheckBtn.addEventListener('click', () => {
    stage2Msg.className = 'mission-message';
    // check order of pieces
    const pieces = Array.from(energyPuzzle.children);
    const correct = pieces.every((p, idx) => parseInt(p.dataset.index) === idx + 1);
    if (correct) {
      status.s2 = true;
      stage2Msg.textContent = '정답입니다! 최적 냉방 시간대는 13~15시입니다.';
      stage2Msg.classList.add('success');
      stage2NextBtn.classList.remove('hidden');
    } else {
      status.s2 = false;
      stage2Msg.textContent = '그래프가 올바르지 않습니다. 조각의 순서를 다시 맞춰보세요.';
      stage2Msg.classList.add('error');
      stage2NextBtn.classList.add('hidden');
    }
    stage2Msg.style.display = 'block';
  });
  stage2NextBtn.addEventListener('click', () => {
    goToSection('stage3-section');
    // initialize stage3 when entering
    startStage3();
  });

  /*** Stage 3: Meeting room complaint ***/
  const roomsContainer = document.getElementById('rooms');
  const stage3TimerBar = document.getElementById('stage3-timer');
  const stage3NextBtn = document.getElementById('stage3-next');
  const stage3Msg = document.getElementById('stage3-message');
  let stage3TimerInterval = null;
  function startStage3() {
    // reset
    roomsContainer.innerHTML = '';
    stage3Msg.style.display = 'none';
    stage3Msg.className = 'mission-message';
    stage3NextBtn.classList.add('hidden');
    if (stage3TimerInterval) clearInterval(stage3TimerInterval);
    // create room data
    const rooms = [
      { src: 'room_ok.png', correct: false },
      { src: 'room_flicker.png', correct: true },
      { src: 'room_off.png', correct: false },
    ];
    // shuffle rooms
    for (let i = rooms.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
    }
    // render
    rooms.forEach((room) => {
      const div = document.createElement('div');
      div.classList.add('room-img');
      div.dataset.correct = room.correct;
      const img = document.createElement('img');
      img.src = room.src;
      img.alt = '회의실';
      div.appendChild(img);
      roomsContainer.appendChild(div);
      div.addEventListener('click', () => {
        handleRoomSelection(div);
      });
    });
    // start timer 10 seconds
    let remaining = 10;
    updateTimerBar(stage3TimerBar, remaining, 10);
    stage3TimerInterval = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        clearInterval(stage3TimerInterval);
        handleRoomTimeout();
      } else {
        updateTimerBar(stage3TimerBar, remaining, 10);
      }
    }, 100);
  }
  function updateTimerBar(bar, value, total) {
    const ratio = Math.max(0, value / total);
    bar.style.setProperty('--value', ratio);
    // Using pseudo element width via transform; we update style via CSS variable
    bar.querySelector && bar.querySelector('::before');
    // But cannot easily update ::before; instead, update inline style
    bar.style.background = 'rgba(255,255,255,0.1)';
    bar.innerHTML = '';
    const inner = document.createElement('div');
    inner.style.height = '100%';
    inner.style.width = (ratio * 100) + '%';
    inner.style.background = '#2f81c7';
    bar.appendChild(inner);
  }
  function handleRoomSelection(div) {
    if (stage3TimerInterval) {
      clearInterval(stage3TimerInterval);
    }
    // remove any previous classes
    Array.from(roomsContainer.children).forEach((child) => {
      child.classList.remove('correct', 'wrong');
    });
    if (div.dataset.correct === 'true') {
      status.s3 = true;
      div.classList.add('correct');
      stage3Msg.textContent = '정답입니다! 깜빡이는 회의실을 찾았습니다.';
      stage3Msg.classList.add('success');
      stage3NextBtn.classList.remove('hidden');
    } else {
      status.s3 = false;
      div.classList.add('wrong');
      stage3Msg.textContent = '틀렸습니다. 다시 시도해보세요.';
      stage3Msg.classList.add('error');
    }
    stage3Msg.style.display = 'block';
  }
  function handleRoomTimeout() {
    status.s3 = false;
    stage3Msg.textContent = '시간 초과! 다시 시도해보세요.';
    stage3Msg.classList.add('error');
    stage3Msg.style.display = 'block';
  }
  stage3NextBtn.addEventListener('click', () => {
    goToSection('stage4-section');
    initStage4();
  });

  /*** Stage 4: Maze navigation ***/
  const mazePlayer = document.getElementById('maze-player');
  const mazeControls = document.querySelectorAll('.arrow-btn');
  const stage4TimerBar = document.getElementById('stage4-timer');
  const stage4Msg = document.getElementById('stage4-message');
  const stage4NextBtn = document.getElementById('stage4-next');
  let stage4TimerInterval = null;
  let stage4Index = 0;
  let stage4Remaining = 40;
  // Define the correct path as sequence of directions
  const path = ['right', 'down', 'down', 'right', 'right', 'down'];
  // Define positions for marker relative to container (percent values)
  const positions = [
    { x: 10, y: 10 },
    { x: 30, y: 10 },
    { x: 30, y: 30 },
    { x: 30, y: 50 },
    { x: 50, y: 50 },
    { x: 70, y: 50 },
    { x: 70, y: 70 },
  ];
  function initStage4() {
    // reset state
    stage4Index = 0;
    stage4Remaining = 40;
    stage4Msg.style.display = 'none';
    stage4Msg.className = 'mission-message';
    stage4NextBtn.classList.add('hidden');
    // reset player position
    updatePlayerPosition();
    // start timer
    if (stage4TimerInterval) clearInterval(stage4TimerInterval);
    updateTimerBar(stage4TimerBar, stage4Remaining, 40);
    stage4TimerInterval = setInterval(() => {
      stage4Remaining -= 0.1;
      if (stage4Remaining <= 0) {
        clearInterval(stage4TimerInterval);
        handleMazeTimeout();
      } else {
        updateTimerBar(stage4TimerBar, stage4Remaining, 40);
      }
    }, 100);
  }
  function updatePlayerPosition() {
    const pos = positions[stage4Index];
    mazePlayer.style.left = pos.x + '%';
    mazePlayer.style.top = pos.y + '%';
  }
  function handleMazeTimeout() {
    status.s4 = false;
    stage4Msg.textContent = '시간 초과! 다시 시도해보세요.';
    stage4Msg.classList.add('error');
    stage4Msg.style.display = 'block';
  }
  mazeControls.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (stage4TimerInterval && stage4Remaining > 0 && stage4Index < path.length) {
        const dir = btn.dataset.dir;
        if (dir === path[stage4Index]) {
          stage4Index++;
          updatePlayerPosition();
          if (stage4Index === path.length) {
            // success
            clearInterval(stage4TimerInterval);
            status.s4 = true;
            stage4Msg.textContent = '정답입니다! 밸브에 도달했습니다.';
            stage4Msg.classList.add('success');
            stage4Msg.style.display = 'block';
            stage4NextBtn.classList.remove('hidden');
          }
        } else {
          // wrong move, penalty
          stage4Remaining -= 5;
          if (stage4Remaining < 0) stage4Remaining = 0;
          updateTimerBar(stage4TimerBar, stage4Remaining, 40);
        }
      }
    });
  });
  stage4NextBtn.addEventListener('click', () => {
    goToSection('stage5-section');
    initStage5();
  });

  /*** Stage 5: Fire response quick reaction ***/
  const reactionContainer = document.getElementById('reaction-buttons');
  const stage5TimerBar = document.getElementById('stage5-timer');
  const stage5Msg = document.getElementById('stage5-message');
  const stage5NextBtn = document.getElementById('stage5-next');
  let stage5Sequence = ['sprinkler', 'elevator', 'lock'];
  let stage5Index = 0;
  let stage5Remaining = 10;
  let stage5TimerInterval = null;
  function initStage5() {
    // reset
    stage5Index = 0;
    stage5Remaining = 10;
    stage5Msg.style.display = 'none';
    stage5Msg.className = 'mission-message';
    stage5NextBtn.classList.add('hidden');
    reactionContainer.innerHTML = '';
    // clear timer
    if (stage5TimerInterval) clearInterval(stage5TimerInterval);
    // create buttons data
    const actions = [
      { id: 'sprinkler', label: '스프링클러', icon: 'icon_sprinkler.png' },
      { id: 'elevator', label: '엘리베이터', icon: 'icon_elevator.png' },
      { id: 'lock', label: '도어락', icon: 'icon_lock.png' },
    ];
    // shuffle actions
    for (let i = actions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [actions[i], actions[j]] = [actions[j], actions[i]];
    }
    actions.forEach((act) => {
      const btn = document.createElement('div');
      btn.classList.add('reaction-btn');
      btn.dataset.action = act.id;
      const img = document.createElement('img');
      img.src = act.icon;
      img.alt = act.label;
      const span = document.createElement('span');
      span.textContent = act.label;
      btn.appendChild(img);
      btn.appendChild(span);
      reactionContainer.appendChild(btn);
      btn.addEventListener('click', () => handleReactionClick(btn));
    });
    // start timer
    updateTimerBar(stage5TimerBar, stage5Remaining, 10);
    stage5TimerInterval = setInterval(() => {
      stage5Remaining -= 0.1;
      if (stage5Remaining <= 0) {
        clearInterval(stage5TimerInterval);
        handleReactionTimeout();
      } else {
        updateTimerBar(stage5TimerBar, stage5Remaining, 10);
      }
    }, 100);
  }
  function handleReactionClick(btn) {
    if (stage5TimerInterval && stage5Remaining > 0 && stage5Index < stage5Sequence.length) {
      const id = btn.dataset.action;
      // remove existing state classes
      btn.classList.remove('correct', 'wrong');
      if (id === stage5Sequence[stage5Index]) {
        btn.classList.add('correct');
        stage5Index++;
        if (stage5Index === stage5Sequence.length) {
          // success
          clearInterval(stage5TimerInterval);
          status.s5 = true;
          stage5Msg.textContent = '정답입니다! 화재 대응을 완료했습니다.';
          stage5Msg.classList.add('success');
          stage5Msg.style.display = 'block';
          stage5NextBtn.classList.remove('hidden');
        }
      } else {
        // wrong click
        btn.classList.add('wrong');
        status.s5 = false;
        clearInterval(stage5TimerInterval);
        stage5Msg.textContent = '틀렸습니다. 순서를 다시 확인하세요.';
        stage5Msg.classList.add('error');
        stage5Msg.style.display = 'block';
        stage5NextBtn.classList.remove('hidden');
      }
    }
  }
  function handleReactionTimeout() {
    status.s5 = false;
    stage5Msg.textContent = '시간 초과! 다시 시도해보세요.';
    stage5Msg.classList.add('error');
    stage5Msg.style.display = 'block';
    stage5NextBtn.classList.remove('hidden');
  }
  stage5NextBtn.addEventListener('click', () => {
    goToSection('stage6-section');
    initStage6();
  });

  /*** Stage 6: Final code puzzle ***/
  const reportComplaintsEl = document.getElementById('report-complaints');
  const reportSavingEl = document.getElementById('report-saving');
  const reportEventsEl = document.getElementById('report-events');
  const codeAnswerInput = document.getElementById('code-answer');
  const stage6CheckBtn = document.getElementById('stage6-check');
  const stage6NextBtn = document.getElementById('stage6-next');
  const stage6Msg = document.getElementById('stage6-message');
  let correctCode = 0;
  function initStage6() {
    // compute dynamic numbers
    const complaints = status.s3 ? 1 : 0;
    const saving = 12; // constant 12% saving from stage2
    const events = status.s1 + status.s2 + status.s3 + status.s4 + status.s5; // number of successfully handled events
    correctCode = complaints + saving + events;
    reportComplaintsEl.textContent = complaints;
    reportSavingEl.textContent = saving;
    reportEventsEl.textContent = events;
    codeAnswerInput.value = '';
    stage6Msg.style.display = 'none';
    stage6Msg.className = 'mission-message';
    stage6NextBtn.classList.add('hidden');
  }
  stage6CheckBtn.addEventListener('click', () => {
    stage6Msg.className = 'mission-message';
    const value = parseInt(codeAnswerInput.value, 10);
    if (value === correctCode) {
      status.s6 = true;
      stage6Msg.textContent = '정답입니다! 보고서가 발송되었습니다.';
      stage6Msg.classList.add('success');
      stage6NextBtn.classList.remove('hidden');
    } else {
      status.s6 = false;
      stage6Msg.textContent = '암호가 올바르지 않습니다. 다시 입력해 주세요.';
      stage6Msg.classList.add('error');
    }
    stage6Msg.style.display = 'block';
  });
  stage6NextBtn.addEventListener('click', () => {
    goToSection('results-section');
    showResults();
  });

  /*** Results & Summary ***/
  const resultsList = document.getElementById('results-list');
  const efficiencyCircle = document.getElementById('efficiency-circle');
  const satisfactionCircle = document.getElementById('satisfaction-circle');
  const safetyCircle = document.getElementById('safety-circle');
  const toSummaryBtn = document.getElementById('to-summary');
  function showResults() {
    // compute category scores
    // efficiency: stage2 and stage6
    const eff = (Number(status.s2) + Number(status.s6)) / 2;
    const sat = (Number(status.s3) + Number(status.s4)) / 2;
    const safe = (Number(status.s1) + Number(status.s5)) / 2;
    updateProgressCircle(efficiencyCircle, eff);
    updateProgressCircle(satisfactionCircle, sat);
    updateProgressCircle(safetyCircle, safe);
    // populate list
    resultsList.innerHTML = '';
    const stages = [
      { name: 'Stage1: 예지보전', ok: status.s1 },
      { name: 'Stage2: 에너지 최적화', ok: status.s2 },
      { name: 'Stage3: 민원 처리', ok: status.s3 },
      { name: 'Stage4: AR 길찾기', ok: status.s4 },
      { name: 'Stage5: 화재 대응', ok: status.s5 },
      { name: 'Stage6: 보고서 잠금 해제', ok: status.s6 },
    ];
    stages.forEach((st) => {
      const item = document.createElement('div');
      item.classList.add('result-item');
      item.classList.add(st.ok ? 'success' : 'failure');
      item.innerHTML = `<span>${st.name}</span><span>${st.ok ? '성공' : '실패'}</span>`;
      resultsList.appendChild(item);
    });
  }
  function updateProgressCircle(circle, ratio) {
    const percent = Math.round(ratio * 100);
    circle.style.background = `conic-gradient(#2f81c7 0% ${percent}%, #283556 ${percent}% 100%)`;
    circle.querySelector('span').setAttribute('data-value', percent);
  }
  toSummaryBtn.addEventListener('click', () => {
    goToSection('summary-section');
    showSummary();
  });

  /*** Summary page logic ***/
  const finalMessage = document.getElementById('final-message');
  const stars = document.querySelectorAll('.star');
  const submitFeedbackBtn = document.getElementById('submit-feedback');
  const restartBtn = document.getElementById('restart-game');
  const backToMainBtn = document.getElementById('back-to-main');
  function showSummary() {
    // determine ending
    const allSuccess = Object.values(status).every((v) => v === true);
    if (allSuccess) {
      finalMessage.textContent =
        'Perfect Ending! 오늘 당신은 insite와 함께 3시간 절감, 비용 15% 절감, 민원 처리 시간 50% 단축을 달성했습니다.';
    } else {
      finalMessage.textContent =
        'insite가 있었는데도 일부 대응에 실패했습니다. 다시 도전해 보세요!';
    }
    // reset stars
    stars.forEach((star) => {
      star.classList.remove('selected');
    });
  }
  stars.forEach((star) => {
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.value, 10);
      stars.forEach((s) => {
        if (parseInt(s.dataset.value, 10) <= val) {
          s.classList.add('highlight');
        } else {
          s.classList.remove('highlight');
        }
      });
    });
    star.addEventListener('mouseout', () => {
      stars.forEach((s) => s.classList.remove('highlight'));
    });
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.value, 10);
      stars.forEach((s) => {
        if (parseInt(s.dataset.value, 10) <= val) {
          s.classList.add('selected');
        } else {
          s.classList.remove('selected');
        }
      });
    });
  });
  submitFeedbackBtn.addEventListener('click', () => {
    const selectedCount = Array.from(stars).filter((s) => s.classList.contains('selected')).length;
    alert(`별점 ${selectedCount}점이 제출되었습니다. 감사합니다!`);
  });
  restartBtn.addEventListener('click', () => {
    // reload page to restart entire game
    window.location.reload();
  });
  backToMainBtn.addEventListener('click', () => {
    window.location.reload();
  });
});