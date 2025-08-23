// wizard quiz logic
document.addEventListener('DOMContentLoaded', () => {
  // Script initialised
  const pages = document.querySelectorAll('.page');
  function goTo(id) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  // door animation and navigation
  const startBtn = document.getElementById('start-btn');
  startBtn?.addEventListener('click', () => {
    const intro = document.getElementById('intro-section');
    intro.classList.add('open');
    setTimeout(() => {
      goTo('guide-section');
      intro.style.display = 'none';
    }, 1200);
  });
  document.getElementById('guide-next-btn')?.addEventListener('click', () => {
    goTo('stage1-section');
  });

  // track stage results
  const stageResults = {
    stage1: false,
    stage2: false,
    stage3: false,
    stage4: false
  };

  /* Stage1: brightness puzzle */
  (function initStage1() {
    const slider = document.getElementById('brightness-slider');
    const valueDisplay = document.getElementById('slider-value');
    const img = document.getElementById('stage1-img');
    const msg = document.getElementById('stage1-msg');
    const nextBtn = document.getElementById('stage1-next');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      valueDisplay.textContent = val + '%';
      img.style.filter = `brightness(${val/100})`;
    });
    slider.addEventListener('change', () => {
      const val = parseInt(slider.value);
      if (val >= 68 && val <= 72) {
        stageResults.stage1 = true;
        msg.textContent = '정확한 밝기입니다! 벽의 액자 뒤에 숨은 문구를 발견했습니다: "철마가 떠난 시각을 기억하라."';
        msg.classList.add('success');
        // set brightness full to reveal
        img.style.filter = 'brightness(1)';
        nextBtn.style.display = 'inline-block';
      } else {
        msg.textContent = '밝기가 정확하지 않습니다. 힌트를 다시 확인하세요.';
        msg.classList.add('error');
      }
    });
    nextBtn.addEventListener('click', () => {
      goTo('stage2-section');
    });
  })();

  /* Stage2: parking code */
  (function initStage2() {
    const input = document.getElementById('code-input');
    const msg = document.getElementById('stage2-msg');
    const nextBtn = document.getElementById('stage2-next');
    input.addEventListener('input', () => {
      // allow only numbers
      input.value = input.value.replace(/\D/g, '');
      if (input.value.length === 4) {
        if (input.value === '1927') {
          stageResults.stage2 = true;
          msg.textContent = '정답입니다! 봉투를 열어 스티커 "현무 10W"와 다음 힌트를 얻었습니다: "현무의 물결은 잔잔해야 한다."';
          msg.classList.add('success');
          nextBtn.style.display = 'inline-block';
        } else {
          msg.textContent = '비밀번호가 틀렸습니다. 다시 시도하세요.';
          msg.classList.add('error');
        }
      }
    });
    nextBtn.addEventListener('click', () => {
      goTo('stage3-section');
    });
  })();

  /* Stage3: outlet puzzle */
  (function initStage3() {
    const toggle = document.getElementById('power-toggle');
    const thumb = toggle.querySelector('.toggle-thumb');
    const display = document.getElementById('power-display');
    const progressRing = document.getElementById('progress-ring');
    const progressBar = document.getElementById('progress-bar');
    const msg = document.getElementById('stage3-msg');
    const nextBtn = document.getElementById('stage3-next');
    let power = 100;
    let decreasing = false;
    let intervalId;
    let countdownId;
    function updateDisplay() {
      display.textContent = power + 'W';
    }
    updateDisplay();
    function startDecrease() {
      if (decreasing) return;
      decreasing = true;
      intervalId = setInterval(() => {
        if (power > 0) {
          power = Math.max(0, power - 20);
          updateDisplay();
        }
        if (power === 0) {
          clearInterval(intervalId);
          // start 3-second countdown
          let elapsed = 0;
          progressBar.style.setProperty('--angle', '0deg');
          countdownId = setInterval(() => {
            elapsed += 0.1;
            const percent = elapsed / 3;
            progressBar.style.width = (percent * 100) + '%';
            progressBar.style.setProperty('--angle', (percent * 360) + 'deg');
            if (elapsed >= 3) {
              clearInterval(countdownId);
              progressBar.style.width = '100%';
              stageResults.stage3 = true;
              msg.textContent = '전력이 0W로 유지되었습니다. 숨결의 주문이 완성되었습니다!';
              msg.classList.add('success');
              nextBtn.style.display = 'inline-block';
            }
          }, 100);
        }
      }, 500);
    }
    toggle.addEventListener('click', () => {
      // toggle state
      if (toggle.classList.contains('off')) {
        // turning on resets
        toggle.classList.remove('off');
        thumb.style.left = '3px';
        // reset values
        clearInterval(intervalId);
        clearInterval(countdownId);
        progressBar.style.width = '0%';
        decreasing = false;
        power = 100;
        updateDisplay();
        msg.textContent = '';
        nextBtn.style.display = 'none';
        stageResults.stage3 = false;
      } else {
        // turning off: start decreasing
        toggle.classList.add('off');
        thumb.style.left = '33px';
        startDecrease();
      }
    });
    nextBtn.addEventListener('click', () => {
      goTo('stage4-section');
    });
  })();

  /* Stage4: doorlock logs */
  (function initStage4() {
    const logs = document.querySelectorAll('#door-logs .log-item');
    const msg = document.getElementById('stage4-msg');
    const nextBtn = document.getElementById('stage4-next');
    logs.forEach(item => {
      item.addEventListener('click', () => {
        // remove previous selection
        logs.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        // check if correct (latest time on Wednesday)
        const correctId = '22:05';
        if (item.dataset.time === correctId) {
          stageResults.stage4 = true;
          msg.textContent = '정답입니다! 배우 C가 가장 늦게 귀가했습니다. 주문서를 획득했습니다!';
          msg.classList.add('success');
          nextBtn.style.display = 'inline-block';
        } else {
          msg.textContent = '선택한 사람이 아닙니다. 다시 선택하세요.';
          msg.classList.add('error');
        }
      });
    });
    nextBtn.addEventListener('click', () => {
      showResults();
      goTo('results-section');
    });
  })();

  /* Results and summary */
  const resultsList = document.getElementById('results-list');
  function showResults() {
    resultsList.innerHTML = '';
    const mapping = {
      stage1: '빛의 주문',
      stage2: '철마의 주문',
      stage3: '숨결의 주문',
      stage4: '마지막 문지기'
    };
    Object.keys(stageResults).forEach(key => {
      const li = document.createElement('li');
      li.textContent = `${mapping[key]}: ${stageResults[key] ? '성공' : '실패'}`;
      resultsList.appendChild(li);
    });
  }
  document.getElementById('to-summary')?.addEventListener('click', () => {
    const allSuccess = Object.values(stageResults).every(v => v);
    const summaryMsg = document.getElementById('summary-msg');
    if (allSuccess) {
      summaryMsg.textContent = '축하합니다! 세 가지 생활 주문을 모두 완성하여 집을 지켰습니다.';
    } else {
      summaryMsg.textContent = '일부 주문을 완성하지 못했습니다. 다시 도전해 보세요!';
    }
    goTo('summary-section');
  });
  // star rating
  const stars = document.querySelectorAll('#star-rating span');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.star);
      stars.forEach(s => {
        s.textContent = parseInt(s.dataset.star) <= rating ? '★' : '☆';
      });
    });
  });
  document.getElementById('restart-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
  document.getElementById('home-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
});