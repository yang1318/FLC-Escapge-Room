// Heist puzzle logic
// Global startGame function for inline button
function startGame() {
  const pages = document.querySelectorAll('.page');
  const intro = document.getElementById('intro-section');
  // slide doors
  intro.classList.add('open');
  // after animation, go to guide
  setTimeout(() => {
    pages.forEach(p => p.classList.remove('active'));
    const guide = document.getElementById('guide-section');
    if (guide) guide.classList.add('active');
    intro.style.display = 'none';
  }, 1200);
}

// Global goToSection function for inline navigation. Removes 'active' from all pages and
// sets the specified section active. Used in HTML onclick handlers.
function goToSection(id) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  function goTo(id) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  // Door animation and navigation
  // Start button handled by global startGame() via inline onclick. See index.html.
  document.getElementById('guide-next-btn')?.addEventListener('click', () => {
    goTo('stage1-section');
  });

  // Automatically move from guide page to stage1 after a short delay to ensure progression
  setTimeout(() => {
    // If still on guide page (i.e., stage1 not completed), navigate automatically
    const guideActive = document.getElementById('guide-section')?.classList.contains('active');
    if (guideActive) {
      goTo('stage1-section');
    }
  }, 1500);

  // Track stage results
  const stageResults = {
    stage1: false,
    stage2: false,
    stage3: false
  };

  /* Stage1: suspect identification */
  (function initStage1() {
    const options = document.querySelectorAll('#suspect-options input[type="checkbox"]');
    const msg = document.getElementById('stage1-msg');
    const nextBtn = document.getElementById('stage1-next');
    function evaluate() {
      const selected = Array.from(options).filter(c => c.checked).map(c => c.value);
      if (selected.length === 2) {
        // sort to ignore order
        const sorted = selected.slice().sort().join(',');
        if (sorted === ['민지','설치기사'].sort().join(',')) {
          stageResults.stage1 = true;
          msg.textContent = '정답입니다! 민지와 설치기사가 혼자 있던 시간에 범행이 가능했습니다.';
          msg.classList.remove('error');
          msg.classList.add('success');
          nextBtn.style.display = 'inline-block';
        } else {
          msg.textContent = '선택한 인물이 범행 시간대에 혼자 있지 않았습니다. 다시 시도하세요.';
          msg.classList.remove('success');
          msg.classList.add('error');
          nextBtn.style.display = 'none';
          stageResults.stage1 = false;
        }
      } else {
        msg.textContent = '';
        nextBtn.style.display = 'none';
        stageResults.stage1 = false;
      }
    }
    options.forEach(opt => {
      opt.addEventListener('change', evaluate);
    });
    nextBtn.addEventListener('click', () => {
      goTo('stage2-section');
    });
  })();

  /* Stage2: code puzzle */
  (function initStage2() {
    const input = document.getElementById('code-input');
    const msg = document.getElementById('stage2-msg');
    const nextBtn = document.getElementById('stage2-next');
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      if (input.value.length === 4) {
        if (input.value === '0205') {
          stageResults.stage2 = true;
          msg.textContent = '정답입니다! 케이크 상자 힌트를 얻었습니다: "작별 케이크를 의심하라."';
          msg.classList.remove('error');
          msg.classList.add('success');
          nextBtn.style.display = 'inline-block';
        } else {
          msg.textContent = '비밀번호가 틀렸습니다. 가장 짧게 머문 사람의 시간으로 다시 시도하세요.';
          msg.classList.remove('success');
          msg.classList.add('error');
          nextBtn.style.display = 'none';
          stageResults.stage2 = false;
        }
      } else {
        msg.textContent = '';
        nextBtn.style.display = 'none';
        stageResults.stage2 = false;
      }
    });
    nextBtn.addEventListener('click', () => {
      goTo('stage3-section');
    });
  })();

  /* Stage3: cake box puzzle */
  (function initStage3() {
    const cakeImg = document.getElementById('cake-img');
    const msg = document.getElementById('stage3-msg');
    const nextBtn = document.getElementById('stage3-next');
    cakeImg.addEventListener('click', () => {
      stageResults.stage3 = true;
      msg.textContent = '상자 안에서 보석 모형을 찾았습니다! 사건이 해결되었습니다.';
      msg.classList.remove('error');
      msg.classList.add('success');
      nextBtn.style.display = 'inline-block';
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
      stage1: '범행 가능 시간대 찾기',
      stage2: '4자리 자물쇠',
      stage3: '은닉 위치 찾기'
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
      summaryMsg.textContent = '축하합니다! 보석 도난 사건의 범인을 밝혀내고 보석을 회수했습니다.';
    } else {
      summaryMsg.textContent = '일부 단서를 놓쳐 사건을 완전히 해결하지 못했습니다. 다시 도전해보세요!';
    }
    goTo('summary-section');
  });
  // Star rating
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