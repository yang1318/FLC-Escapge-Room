// JavaScript to handle page navigation and mission logic
document.addEventListener('DOMContentLoaded', () => {
  // Utility function to switch sections
  const sections = document.querySelectorAll('.page');
  let missionStatus = {
    mission1: false,
    mission2: false,
    mission3: false,
    mission4: false
  };

  function goToSection(id) {
    sections.forEach((sec) => {
      if (sec.id === id) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
  }

  // Door opening animation
  const introSection = document.getElementById('intro-section');
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    // Open doors
    introSection.classList.add('open');
    // After animation, go to character section
    setTimeout(() => {
      goToSection('character-section');
    }, 1200);
  });

  // Character page -> mission 1
  const toMission1Btn = document.getElementById('to-mission1');
  toMission1Btn.addEventListener('click', () => {
    goToSection('mission1-section');
  });

  /** Mission 1: ordering **/
  const itemButtons = document.querySelectorAll('.item-btn');
  const slots = document.querySelectorAll('.slot');
  const checkOrderBtn = document.getElementById('check-order');
  const mission1Msg = document.getElementById('mission1-message');
  let selectedOrder = [];

  function resetMission1() {
    selectedOrder = [];
    // Clear slots
    slots.forEach((slot) => {
      slot.innerHTML = `<span class="slot-number">${slot.dataset.slot}</span>`;
    });
    // Reset item buttons
    itemButtons.forEach((btn) => {
      btn.classList.remove('clicked');
    });
    mission1Msg.style.display = 'none';
    mission1Msg.className = 'mission-message';
  }
  // handle item click
  itemButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // if already clicked skip
      if (btn.classList.contains('clicked')) return;
      // find next empty slot
      const slot = Array.from(slots).find((s) => !s.dataset.filled);
      if (!slot) return;
      const itemKey = btn.dataset.item;
      // insert into slot
      slot.innerHTML = `<img src="${btn.querySelector('img').getAttribute('src')}" alt=""><span>${btn.querySelector('span').textContent}</span>`;
      slot.dataset.filled = itemKey;
      btn.classList.add('clicked');
      selectedOrder.push(itemKey);
    });
  });

  checkOrderBtn.addEventListener('click', () => {
    if (selectedOrder.length < 4) {
      mission1Msg.textContent = '모든 아이템을 순서대로 선택해주세요.';
      mission1Msg.classList.add('error');
      mission1Msg.style.display = 'block';
      return;
    }
    const correct = ['alarm', 'curtain', 'coffee', 'news'];
    const isCorrect = correct.every((val, idx) => val === selectedOrder[idx]);
    if (isCorrect) {
      missionStatus.mission1 = true;
      mission1Msg.textContent = '정답입니다! 다음 미션으로 이동합니다.';
      mission1Msg.classList.add('success');
      mission1Msg.style.display = 'block';
      // proceed after short delay
      setTimeout(() => {
        resetMission1();
        goToSection('mission2-section');
      }, 1500);
    } else {
      missionStatus.mission1 = false;
      mission1Msg.textContent = '틀렸습니다! 다시 시도하세요.';
      mission1Msg.classList.add('error');
      mission1Msg.style.display = 'block';
      // reset selection after delay
      setTimeout(() => {
        resetMission1();
      }, 1500);
    }
  });

  /** Mission 2: car location **/
  const choiceButtons = document.querySelectorAll('.choice-btn');
  const mission2Msg = document.getElementById('mission2-message');
  const mission2NextBtn = document.getElementById('mission2-next');
  let mission2Answered = false;

  choiceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mission2Answered) return;
      const choice = btn.dataset.choice;
      // Suppose correct answer is company parking
      const correctChoice = 'parking';
      mission2Answered = true;
      if (choice === correctChoice) {
        missionStatus.mission2 = true;
        btn.classList.add('correct');
        mission2Msg.textContent = '정답입니다!';
        mission2Msg.classList.add('success');
      } else {
        missionStatus.mission2 = false;
        btn.classList.add('wrong');
        mission2Msg.textContent = '틀렸습니다. 다음 미션으로 넘어가세요.';
        mission2Msg.classList.add('error');
      }
      mission2Msg.style.display = 'block';
      mission2NextBtn.classList.remove('hidden');
    });
  });
  mission2NextBtn.addEventListener('click', () => {
    goToSection('mission3-section');
    // reset mission2 states when leaving (optional)
  });

  /** Mission 3: lighting **/
  const lightButtons = document.querySelectorAll('.light-btn');
  const lightingPreview = document.getElementById('lighting-preview');
  const mission3Msg = document.getElementById('mission3-message');
  const mission3NextBtn = document.getElementById('mission3-next');
  let lightSelected = '';
  lightButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // set selected state
      lightButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      lightSelected = btn.dataset.light;
      // update preview color
      let color;
      if (lightSelected === 'warm') color = '#e0b089';
      else if (lightSelected === 'ivory') color = '#f5f4e7';
      else if (lightSelected === 'cool') color = '#d6e8ff';
      lightingPreview.style.background = color;
      lightingPreview.textContent = '';
      // Evaluate immediately
      const correctLight = 'ivory';
      if (lightSelected === correctLight) {
        missionStatus.mission3 = true;
        mission3Msg.textContent = '적절한 조명을 선택했습니다!';
        mission3Msg.classList.add('success');
      } else {
        missionStatus.mission3 = false;
        mission3Msg.textContent = '잘못된 조명입니다. 힌트를 다시 읽어보세요.';
        mission3Msg.classList.add('error');
      }
      mission3Msg.style.display = 'block';
      mission3NextBtn.classList.remove('hidden');
    });
  });
  mission3NextBtn.addEventListener('click', () => {
    goToSection('mission4-section');
    // reset preview for next time
    lightingPreview.style.background = '#1f2e4d';
    lightingPreview.textContent = '현재 조명 미리보기';
    mission3Msg.style.display = 'none';
    mission3Msg.className = 'mission-message';
    lightButtons.forEach((b) => b.classList.remove('selected'));
    mission3NextBtn.classList.add('hidden');
  });

  /** Mission 4: wedding ring **/
  const locationCards = document.querySelectorAll('.location-card');
  const finalSelectBtn = document.getElementById('final-select-btn');
  const finalSelection = document.getElementById('final-selection');
  const finalChoices = document.querySelectorAll('.final-choice');
  const mission4Msg = document.getElementById('mission4-message');
  const mission4NextBtn = document.getElementById('mission4-next');
  let mission4Answered = false;

  // Expand card on click
  locationCards.forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });
  finalSelectBtn.addEventListener('click', () => {
    finalSelection.classList.toggle('hidden');
  });
  finalChoices.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mission4Answered) return;
      const choice = btn.dataset.final;
      const correct = 'kitchen';
      mission4Answered = true;
      if (choice === correct) {
        missionStatus.mission4 = true;
        btn.classList.add('correct');
        mission4Msg.textContent = '정답입니다!';
        mission4Msg.classList.add('success');
      } else {
        missionStatus.mission4 = false;
        btn.classList.add('wrong');
        mission4Msg.textContent = '틀렸습니다. 정답은 부엌입니다.';
        mission4Msg.classList.add('error');
      }
      mission4Msg.style.display = 'block';
      mission4NextBtn.classList.remove('hidden');
    });
  });
  mission4NextBtn.addEventListener('click', () => {
    showResults();
    goToSection('results-section');
  });

  /** Results */
  function showResults() {
    // Compute percentage
    const total = 4;
    const correctCount = Object.values(missionStatus).filter(Boolean).length;
    const percent = Math.round((correctCount / total) * 100);
    const progressCircle = document.querySelector('.progress-circle');
    progressCircle.style.setProperty('--progress', `${percent}%`);
    document.getElementById('progress-percent').textContent = `${percent}%`;
    // Populate completed missions list
    const completedList = document.getElementById('completed-list');
    completedList.innerHTML = '';
    const missionNames = [
      '미션 1: 모닝 루틴 맞추기',
      '미션 2: 주인의 차 위치 찾기',
      '미션 3: 행동 기반 조명 세팅',
      '미션 4: 결혼반지 찾기'
    ];
    missionNames.forEach((name, idx) => {
      const li = document.createElement('li');
      const key = `mission${idx + 1}`;
      const passed = missionStatus[key];
      li.textContent = name + (passed ? ' – 완료' : ' – 실패');
      li.style.color = passed ? '#a0eac3' : '#e8a6a6';
      completedList.appendChild(li);
    });
  }

  // Results to summary
  const toSummaryBtn = document.getElementById('to-summary');
  toSummaryBtn.addEventListener('click', () => {
    goToSection('summary-section');
    // Update summary stats
    const total = 4;
    const correctCount = Object.values(missionStatus).filter(Boolean).length;
    document.getElementById('summary-missions').textContent = `${total}개`;
    document.getElementById('summary-difficulty').textContent = '어려움';
    document.getElementById('summary-rating').textContent = correctCount >= 3 ? '합격' : '불합격';
    document.getElementById('summary-complete').textContent = `${Math.round((correctCount / total) * 100)}%`;
  });

  /** Summary: feedback and restart **/
  // Star rating interaction
  const stars = document.querySelectorAll('#star-rating .star');
  let currentRating = 0;
  stars.forEach((star) => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      highlightStars(val);
    });
    star.addEventListener('mouseleave', () => {
      highlightStars(currentRating);
    });
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.value);
      highlightStars(currentRating);
    });
  });
  function highlightStars(val) {
    stars.forEach((star) => {
      if (parseInt(star.dataset.value) <= val) {
        star.classList.add('selected');
      } else {
        star.classList.remove('selected');
      }
    });
  }
  const submitFeedbackBtn = document.getElementById('submit-feedback');
  submitFeedbackBtn.addEventListener('click', () => {
    if (currentRating === 0) {
      alert('별점을 선택해주세요!');
    } else {
      alert(`감사합니다! ${currentRating}점 피드백이 제출되었습니다.`);
    }
  });

  // Restart game
  const restartBtn = document.getElementById('restart-btn');
  restartBtn.addEventListener('click', () => {
    // Reset mission status
    missionStatus = { mission1: false, mission2: false, mission3: false, mission4: false };
    // Reset mission-specific variables
    resetMission1();
    mission2Answered = false;
    mission3Msg.style.display = 'none';
    mission3Msg.className = 'mission-message';
    lightSelected = '';
    mission3NextBtn.classList.add('hidden');
    lightingPreview.style.background = '#1f2e4d';
    lightingPreview.textContent = '현재 조명 미리보기';
    mission4Answered = false;
    mission4Msg.style.display = 'none';
    mission4Msg.className = 'mission-message';
    finalSelection.classList.add('hidden');
    finalChoices.forEach((btn) => {
      btn.classList.remove('correct', 'wrong');
    });
    locationCards.forEach((card) => {
      card.classList.remove('expanded');
    });
    mission4NextBtn.classList.add('hidden');
    mission2NextBtn.classList.add('hidden');
    mission2Msg.style.display = 'none';
    mission2Msg.className = 'mission-message';
    choiceButtons.forEach((btn) => {
      btn.classList.remove('correct', 'wrong');
    });
    currentRating = 0;
    highlightStars(0);
    // Go back to intro and reset doors
    introSection.classList.remove('open');
    goToSection('intro-section');
  });

  // Back to main from summary
  const toMainBtn = document.getElementById('to-main');
  toMainBtn.addEventListener('click', () => {
    restartBtn.click();
  });
});