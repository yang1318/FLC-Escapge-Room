// JavaScript for 부동산114 Smart Puzzle Quest
document.addEventListener('DOMContentLoaded', () => {
  /*** Utility for navigation ***/
  const sections = document.querySelectorAll('.page');
  function goToSection(id) {
    sections.forEach((sec) => {
      sec.classList.toggle('active', sec.id === id);
    });
  }

  // Track completion status for each stage
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
  toStage1Btn.addEventListener('click', (e) => {
    e.preventDefault();
    // hide intro completely
    introSection.style.display = 'none';
    goToSection('stage1-section');
    initStage1();
  });

  /*** Stage1: Natural language search puzzle ***/
  const listingsContainer = document.getElementById('listings');
  const stage1NextBtn = document.getElementById('stage1-next');
  const stage1Msg = document.getElementById('stage1-message');
  function initStage1() {
    // Clear previous content
    listingsContainer.innerHTML = '';
    stage1NextBtn.classList.add('hidden');
    stage1Msg.style.display = 'none';
    stage1Msg.className = 'mission-message';
    status.s1 = false;
    // Define three listings
    const listings = [
      {
        id: 1,
        title: '매물 1',
        features: ['테라스 있음', '지하 1층', '채광 불량'],
        img: 'living_room.png',
        correct: false,
      },
      {
        id: 2,
        title: '매물 2',
        features: ['테라스 없음', '2층', '채광 우수'],
        img: 'living_room.png',
        correct: false,
      },
      {
        id: 3,
        title: '매물 3',
        features: ['테라스 있음', '3층', '채광 우수'],
        img: 'living_room.png',
        correct: true,
      },
    ];
    // Render cards
    listings.forEach((item) => {
      const card = document.createElement('div');
      card.classList.add('listing-card');
      card.dataset.correct = item.correct;
      // image
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.title;
      card.appendChild(img);
      // info
      const info = document.createElement('div');
      info.classList.add('listing-info');
      const title = document.createElement('h4');
      title.textContent = item.title;
      info.appendChild(title);
      const ul = document.createElement('ul');
      item.features.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
      });
      info.appendChild(ul);
      card.appendChild(info);
      // click event
      card.addEventListener('click', () => handleListingClick(card));
      listingsContainer.appendChild(card);
    });
  }
  function handleListingClick(card) {
    // remove selections
    const cards = listingsContainer.querySelectorAll('.listing-card');
    cards.forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    const isCorrect = card.dataset.correct === 'true';
    stage1Msg.style.display = 'block';
    stage1Msg.className = 'mission-message';
    if (isCorrect) {
      status.s1 = true;
      stage1Msg.textContent = '정답입니다! 올바른 매물을 찾았습니다.';
      stage1Msg.classList.add('success');
      stage1NextBtn.classList.remove('hidden');
    } else {
      status.s1 = false;
      stage1Msg.textContent = '해당 매물은 조건을 만족하지 않습니다.';
      stage1Msg.classList.add('error');
    }
  }
  stage1NextBtn.addEventListener('click', () => {
    goToSection('stage2-section');
    initStage2();
  });

  /*** Stage2: VR hidden clue puzzle ***/
  const vrContainer = document.getElementById('vr-container');
  const vrImage = document.getElementById('vr-image');
  const hiddenCode = document.getElementById('hidden-code');
  const stage2Slider = document.getElementById('stage2-slider');
  const stage2Input = document.getElementById('stage2-input');
  const stage2Confirm = document.getElementById('stage2-confirm');
  const stage2NextBtn = document.getElementById('stage2-next');
  const stage2Msg = document.getElementById('stage2-message');
  function initStage2() {
    // reset slider, hide code
    stage2Slider.value = 0;
    hiddenCode.style.opacity = 0;
    stage2Input.value = '';
    stage2NextBtn.classList.add('hidden');
    stage2Msg.style.display = 'none';
    stage2Msg.className = 'mission-message';
    status.s2 = false;
  }
  stage2Slider.addEventListener('input', () => {
    const val = parseInt(stage2Slider.value);
    // reveal code gradually after 70
    const opacity = (val - 60) / 40;
    hiddenCode.style.opacity = opacity > 0 ? Math.min(opacity, 1) : 0;
    // also adjust brightness of image
    const brightness = 0.5 + (val / 100) * 0.5;
    vrImage.style.filter = `brightness(${brightness})`;
  });
  stage2Confirm.addEventListener('click', () => {
    stage2Msg.style.display = 'block';
    stage2Msg.className = 'mission-message';
    if (stage2Input.value.trim() === '314') {
      status.s2 = true;
      stage2Msg.textContent = '정답입니다! 비밀번호가 해제되었습니다.';
      stage2Msg.classList.add('success');
      stage2NextBtn.classList.remove('hidden');
    } else {
      status.s2 = false;
      stage2Msg.textContent = '오답입니다. 숫자를 다시 찾아보세요.';
      stage2Msg.classList.add('error');
    }
  });
  stage2NextBtn.addEventListener('click', () => {
    goToSection('stage3-section');
    initStage3();
  });

  /*** Stage3: Price estimation puzzle ***/
  const priceOptionsContainer = document.getElementById('price-options');
  const stage3NextBtn = document.getElementById('stage3-next');
  const stage3Msg = document.getElementById('stage3-message');
  function initStage3() {
    // reset
    stage3NextBtn.classList.add('hidden');
    stage3Msg.style.display = 'none';
    stage3Msg.className = 'mission-message';
    status.s3 = false;
    // reset selected
    const buttons = priceOptionsContainer.querySelectorAll('.price-option');
    buttons.forEach((btn) => {
      btn.classList.remove('selected');
      btn.disabled = false;
    });
  }
  priceOptionsContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.price-option');
    if (!target) return;
    // mark selected
    const buttons = priceOptionsContainer.querySelectorAll('.price-option');
    buttons.forEach((btn) => btn.classList.remove('selected'));
    target.classList.add('selected');
    // evaluate
    stage3Msg.style.display = 'block';
    stage3Msg.className = 'mission-message';
    if (target.dataset.range === 'low') {
      status.s3 = true;
      stage3Msg.textContent = '정답입니다! 합리적인 시세를 선택했습니다.';
      stage3Msg.classList.add('success');
      stage3NextBtn.classList.remove('hidden');
    } else {
      status.s3 = false;
      stage3Msg.textContent = '이 가격대는 너무 높습니다. 다시 선택하세요.';
      stage3Msg.classList.add('error');
    }
  });
  stage3NextBtn.addEventListener('click', () => {
    goToSection('stage4-section');
    initStage4();
  });

  /*** Stage4: Investment value puzzle ***/
  const regionOptions = document.getElementById('region-options');
  const stage4NextBtn = document.getElementById('stage4-next');
  const stage4Msg = document.getElementById('stage4-message');
  function initStage4() {
    // reset
    stage4NextBtn.classList.add('hidden');
    stage4Msg.style.display = 'none';
    stage4Msg.className = 'mission-message';
    status.s4 = false;
    // remove selection classes
    const cards = regionOptions.querySelectorAll('.region-card');
    cards.forEach((c) => c.classList.remove('selected'));
  }
  regionOptions.addEventListener('click', (e) => {
    const card = e.target.closest('.region-card');
    if (!card) return;
    // highlight selection
    const cards = regionOptions.querySelectorAll('.region-card');
    cards.forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    stage4Msg.style.display = 'block';
    stage4Msg.className = 'mission-message';
    if (card.dataset.region === 'B') {
      status.s4 = true;
      stage4Msg.textContent = '정답입니다! 수요 대비 공급이 적은 지역 B가 더 유망합니다.';
      stage4Msg.classList.add('success');
      stage4NextBtn.classList.remove('hidden');
    } else {
      status.s4 = false;
      stage4Msg.textContent = '지역 A는 공급이 너무 많습니다. 다시 선택하세요.';
      stage4Msg.classList.add('error');
    }
  });
  stage4NextBtn.addEventListener('click', () => {
    goToSection('stage5-section');
    initStage5();
  });

  /*** Stage5: Pet friendly puzzle ***/
  const petOptionsContainer = document.getElementById('pet-options');
  const stage5NextBtn = document.getElementById('stage5-next');
  const stage5Msg = document.getElementById('stage5-message');
  function initStage5() {
    // reset
    petOptionsContainer.innerHTML = '';
    stage5NextBtn.classList.add('hidden');
    stage5Msg.style.display = 'none';
    stage5Msg.className = 'mission-message';
    status.s5 = false;
    // define some properties
    const pets = [
      { id: 1, name: '매물 A', pet: false },
      { id: 2, name: '매물 B', pet: true },
      { id: 3, name: '매물 C', pet: false },
    ];
    // render cards
    pets.forEach((item) => {
      const card = document.createElement('div');
      card.classList.add('pet-card');
      card.dataset.pet = item.pet;
      const title = document.createElement('h4');
      title.textContent = item.name;
      card.appendChild(title);
      // add dog icon if pet friendly
      const icon = document.createElement('span');
      icon.classList.add('pet-icon');
      icon.textContent = item.pet ? '🐶' : '';
      card.appendChild(icon);
      card.addEventListener('click', () => handlePetClick(card));
      petOptionsContainer.appendChild(card);
    });
  }
  function handlePetClick(card) {
    // highlight selection
    const cards = petOptionsContainer.querySelectorAll('.pet-card');
    cards.forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    stage5Msg.style.display = 'block';
    stage5Msg.className = 'mission-message';
    if (card.dataset.pet === 'true') {
      status.s5 = true;
      stage5Msg.textContent = '정답입니다! 반려견과 함께 살 수 있는 집을 찾았습니다.';
      stage5Msg.classList.add('success');
      stage5NextBtn.classList.remove('hidden');
    } else {
      status.s5 = false;
      stage5Msg.textContent = '해당 매물은 반려견이 허용되지 않습니다.';
      stage5Msg.classList.add('error');
    }
  }
  stage5NextBtn.addEventListener('click', () => {
    goToSection('final-section');
    initFinal();
  });

  /*** Final stage: connect to agent ***/
  const connectBtn = document.getElementById('connect-btn');
  const finalMsg = document.getElementById('final-message');
  const finalNextBtn = document.getElementById('final-next');
  function initFinal() {
    finalMsg.style.display = 'none';
    finalMsg.className = 'mission-message';
    finalNextBtn.classList.add('hidden');
    status.s6 = false;
  }
  connectBtn.addEventListener('click', () => {
    finalMsg.style.display = 'block';
    finalMsg.className = 'mission-message success';
    finalMsg.textContent = '축하합니다! 중개사와 연결되었습니다.';
    status.s6 = true;
    finalNextBtn.classList.remove('hidden');
  });
  finalNextBtn.addEventListener('click', () => {
    goToSection('results-section');
    showResults();
  });

  /*** Results and Summary ***/
  const resultsList = document.getElementById('results-list');
  const toSummaryBtn = document.getElementById('to-summary');
  function showResults() {
    resultsList.innerHTML = '';
    const names = [
      '자연어 검색 해독',
      'VR 속 숨은 단서',
      '시세 추리',
      '투자 가치',
      '반려견 힌트',
      '계약 연결',
    ];
    Object.keys(status).forEach((key, idx) => {
      const li = document.createElement('li');
      li.classList.add('result-item');
      li.textContent = `${names[idx]}: ${status[key] ? '성공' : '실패'}`;
      resultsList.appendChild(li);
    });
  }
  toSummaryBtn.addEventListener('click', () => {
    goToSection('summary-section');
    showSummary();
  });

  const summaryText = document.getElementById('summary-text');
  const starRating = document.getElementById('star-rating');
  const restartBtn = document.getElementById('restart-btn');
  const mainBtn = document.getElementById('main-btn');
  function showSummary() {
    const allPassed = Object.values(status).every((s) => s);
    if (allPassed) {
      summaryText.textContent = '축하합니다! 민지와 함께 완벽한 집을 찾아 계약까지 마쳤습니다.';
    } else {
      summaryText.textContent = '몇 가지 퍼즐을 놓쳤습니다. 다시 도전해 보세요!';
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
      const v = parseInt(star.dataset.value);
      if (v <= count) {
        star.textContent = '★';
        star.classList.add('filled');
      } else {
        star.textContent = '☆';
        star.classList.remove('filled');
      }
    });
  }
  restartBtn.addEventListener('click', () => {
    window.location.reload();
  });
  mainBtn.addEventListener('click', () => {
    Object.keys(status).forEach((k) => (status[k] = false));
    introSection.style.display = '';
    introSection.classList.remove('open');
    goToSection('intro-section');
  });
});