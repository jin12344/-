// ================================================
//  Firebase 설정
//  Firebase 콘솔 > 프로젝트 설정 > 내 앱 > SDK 설정 에서 복사
// ================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "silmu-5d3d8.firebaseapp.com",
  databaseURL:       "https://silmu-5d3d8-default-rtdb.firebaseio.com",
  projectId:         "silmu-5d3d8",
  storageBucket:     "silmu-5d3d8.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.warn('Firebase 설정을 app.js 상단에 입력해주세요.');
}

// ================================================
//  게임 상태
// ================================================
const state = {
  nickname: '',
  startTime: null,
  timerInterval: null,
  foundCount: 0,
  differences: []
};

function createDifferences() {
  return [
    { x: 420, y: 70,  r: 55, found: false, label: '태양 크기' },
    { x: 245, y: 60,  r: 55, found: false, label: '구름 개수' },
    { x: 90,  y: 275, r: 30, found: false, label: '나무 줄기 색' },
    { x: 300, y: 232, r: 55, found: false, label: '지붕 색' },
    { x: 300, y: 336, r: 30, found: false, label: '문 색' }
  ];
}

// ================================================
//  캔버스
// ================================================
const canvasL = document.getElementById('canvas-left');
const canvasR = document.getElementById('canvas-right');
const ctxL = canvasL.getContext('2d');
const ctxR = canvasR.getContext('2d');

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(1, '#B8E4FF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 500, 380);

  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(0, 300, 500, 80);
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 300, 500, 10);
}

function drawCloud(ctx, x, y) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(x,      y,      22, 0, Math.PI * 2);
  ctx.arc(x + 28, y - 10, 28, 0, Math.PI * 2);
  ctx.arc(x + 58, y,      22, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, trunkColor) {
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.arc(90, 225, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#388E3C';
  ctx.beginPath();
  ctx.arc(75, 245, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(110, 240, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = trunkColor;
  ctx.fillRect(78, 252, 24, 50);
}

function drawHouse(ctx, roofColor, doorColor) {
  // 본체
  ctx.fillStyle = '#F5DEB3';
  ctx.fillRect(210, 260, 180, 100);
  ctx.strokeStyle = '#C8A882';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(210, 260, 180, 100);

  // 지붕
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(198, 262);
  ctx.lineTo(300, 195);
  ctx.lineTo(402, 262);
  ctx.closePath();
  ctx.fill();

  // 창문 공통
  function drawWindow(wx, wy) {
    ctx.fillStyle = '#ADD8E6';
    ctx.fillRect(wx, wy, 42, 32);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, 42, 32);
    ctx.beginPath();
    ctx.moveTo(wx + 21, wy); ctx.lineTo(wx + 21, wy + 32);
    ctx.moveTo(wx, wy + 16); ctx.lineTo(wx + 42, wy + 16);
    ctx.stroke();
  }
  drawWindow(225, 278);
  drawWindow(333, 278);

  // 문
  ctx.fillStyle = doorColor;
  ctx.fillRect(284, 312, 32, 48);
  ctx.strokeStyle = '#00000033';
  ctx.lineWidth = 1;
  ctx.strokeRect(284, 312, 32, 48);

  // 문손잡이
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(311, 337, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

// 원본 그리기
function drawOriginal() {
  drawBackground(ctxL);

  // 태양 (크고, 광선 8개)
  ctxL.fillStyle = '#FFD700';
  ctxL.beginPath();
  ctxL.arc(420, 70, 38, 0, Math.PI * 2);
  ctxL.fill();
  ctxL.strokeStyle = '#FFD700';
  ctxL.lineWidth = 3.5;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctxL.beginPath();
    ctxL.moveTo(420 + 43 * Math.cos(a), 70 + 43 * Math.sin(a));
    ctxL.lineTo(420 + 60 * Math.cos(a), 70 + 60 * Math.sin(a));
    ctxL.stroke();
  }

  // 구름 3개
  drawCloud(ctxL, 60,  80);
  drawCloud(ctxL, 210, 58);
  drawCloud(ctxL, 375, 95);

  drawTree(ctxL, '#6D4C41');                    // 갈색 줄기
  drawHouse(ctxL, '#DC143C', '#6D4C41');        // 빨간 지붕, 갈색 문
}

// 다른 그림 그리기 (5가지 차이 포함)
function drawDifferent() {
  drawBackground(ctxR);

  // 차이 1: 태양이 작고 광선 없음
  ctxR.fillStyle = '#FFD700';
  ctxR.beginPath();
  ctxR.arc(420, 70, 20, 0, Math.PI * 2);
  ctxR.fill();

  // 차이 2: 구름 2개 (가운데 없음)
  drawCloud(ctxR, 60,  80);
  drawCloud(ctxR, 375, 95);

  drawTree(ctxR, '#558B2F');                    // 차이 3: 올리브 줄기
  drawHouse(ctxR, '#1565C0', '#2E7D32');        // 차이 4: 파란 지붕, 차이 5: 초록 문
}

// 찾은 차이 표시 (양쪽 모두)
function markFound(diff) {
  [ctxL, ctxR].forEach(ctx => {
    ctx.strokeStyle = '#FF3333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 51, 51, 0.18)';
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 오답 X 표시 (잠깐 보여주고 지움)
function markWrong(x, y) {
  const s = 12;
  ctxR.strokeStyle = '#FF6B6B';
  ctxR.lineWidth = 3;
  ctxR.beginPath();
  ctxR.moveTo(x - s, y - s); ctxR.lineTo(x + s, y + s);
  ctxR.moveTo(x + s, y - s); ctxR.lineTo(x - s, y + s);
  ctxR.stroke();

  setTimeout(() => {
    drawDifferent();
    state.differences.filter(d => d.found).forEach(markFound);
  }, 400);
}

// ================================================
//  게임 흐름
// ================================================
function initCanvases() {
  drawOriginal();
  drawDifferent();
}

function startGame() {
  const name = document.getElementById('nickname-input').value.trim();
  if (!name) { alert('닉네임을 입력해주세요!'); return; }

  state.nickname = name;
  state.startTime = Date.now();
  state.foundCount = 0;
  state.differences = createDifferences();

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('player-name').textContent = name;
  document.getElementById('score-display').textContent = '0 / 5 발견';
  document.getElementById('feedback-msg').textContent = '';
  document.getElementById('timer-display').textContent = '00:00';

  drawOriginal();
  drawDifferent();
  startTimer();
}

function restartToLogin() {
  stopTimer();
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('complete-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function playAgain() {
  document.getElementById('complete-screen').classList.add('hidden');
  state.startTime = Date.now();
  state.foundCount = 0;
  state.differences = createDifferences();

  document.getElementById('score-display').textContent = '0 / 5 발견';
  document.getElementById('feedback-msg').textContent = '';
  document.getElementById('timer-display').textContent = '00:00';

  drawOriginal();
  drawDifferent();
  startTimer();
}

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - state.startTime) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mm}:${ss}`;
  }, 500);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

function elapsedSeconds() {
  return Math.floor((Date.now() - state.startTime) / 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function showFeedback(msg, ok) {
  const el = document.getElementById('feedback-msg');
  el.textContent = msg;
  el.className = ok ? 'feedback-ok' : 'feedback-fail';
}

// 오른쪽 캔버스 클릭
canvasR.addEventListener('click', e => {
  if (state.foundCount >= 5) return;

  const rect = canvasR.getBoundingClientRect();
  const sx = canvasR.width / rect.width;
  const sy = canvasR.height / rect.height;
  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top)  * sy;

  let hit = false;
  state.differences.forEach(diff => {
    if (diff.found) return;
    if (Math.hypot(x - diff.x, y - diff.y) <= diff.r) {
      diff.found = true;
      hit = true;
      state.foundCount++;
      markFound(diff);
      showFeedback(`✓ ${diff.label} 발견!`, true);
      document.getElementById('score-display').textContent =
        `${state.foundCount} / 5 발견`;

      if (state.foundCount === 5) {
        stopTimer();
        const sec = elapsedSeconds();
        setTimeout(() => {
          document.getElementById('complete-msg').textContent =
            `${state.nickname}님, ${formatTime(sec)}에 모두 찾으셨습니다!`;
          document.getElementById('complete-screen').classList.remove('hidden');
          saveScore(state.nickname, sec);
        }, 500);
      }
    }
  });

  if (!hit) {
    markWrong(x, y);
    showFeedback('틀렸습니다! 다시 찾아보세요.', false);
  }
});

// ================================================
//  Firebase — 점수 저장 / 리더보드
// ================================================
function saveScore(nickname, timeSeconds) {
  if (!db) return;
  db.ref('scores').push({ nickname, time: timeSeconds, timestamp: Date.now() })
    .catch(err => console.error('점수 저장 실패:', err));
}

function loadLeaderboard() {
  if (!db) {
    document.getElementById('leaderboard-list').innerHTML =
      '<li class="lb-empty">Firebase 설정 후 리더보드가 표시됩니다.</li>';
    return;
  }

  db.ref('scores').orderByChild('time').limitToFirst(10).on('value', snapshot => {
    const list = document.getElementById('leaderboard-list');
    const items = [];
    snapshot.forEach(child => items.push(child.val()));

    if (items.length === 0) {
      list.innerHTML = '<li class="lb-empty">아직 기록이 없습니다.</li>';
      return;
    }

    list.innerHTML = items.map((s, i) => `
      <li>
        <span class="lb-rank">${i + 1}위</span>
        <span class="lb-name">${s.nickname}</span>
        <span class="lb-time">${formatTime(s.time)}</span>
      </li>
    `).join('');
  });
}

// ================================================
//  이벤트
// ================================================
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('nickname-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});
document.getElementById('restart-btn').addEventListener('click', restartToLogin);
document.getElementById('play-again-btn').addEventListener('click', playAgain);
document.getElementById('back-btn').addEventListener('click', restartToLogin);

// ================================================
//  초기화
// ================================================
initCanvases();
loadLeaderboard();
