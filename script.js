/* ---------- Mini-fase jogável ---------- */
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, GROUND = 290;
  const deathsEl = document.getElementById('deaths');
  const tauntEl = document.getElementById('taunt');
  let deaths = 0, tauntIdx = 0;

  const taunts = [
    'Parece fácil, né?', 'Aquilo era uma plataforma. Era.', 'O chão não é seu amigo.',
    'Tem certeza que você olhou pra cima?', 'Mais uma. Só mais uma.', 'Isso foi injusto. (Não foi.)',
    'Dica: observe o que se mexe quando você pisa.', 'Respira. Tenta de novo.'
  ];

  const keys = {left:false, right:false, jump:false};
  const level = () => ({
    p: {x:30, y:GROUND-26, w:26, h:26, vx:0, vy:0, on:true},
    door: {x:735, y:GROUND-56, w:30, h:56},
    // espinhos visíveis
    spikes: [{x:200, w:60}],
    // espinhos que surgem ao se aproximar (armadilha)
    hidden: [{x:420, w:54, up:0, trig:360}],
    // chão que cai
    floor: {x:540, w:90, drop:0, trig:520},
    saw: {x:660, y:GROUND-110, r:20, a:0},
    won:false
  });
  let L = level();

  const die = () => {
    deaths++; deathsEl.textContent = deaths;
    tauntIdx = (tauntIdx + 1) % taunts.length;
    tauntEl.textContent = taunts[tauntIdx];
    L = level();
  };

  const onKey = (down) => (e) => {
    const map = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'jump', ' ':'jump'};
    if (map[e.key]) { keys[map[e.key]] = down; e.preventDefault(); }
    if (down && (e.key === 'r' || e.key === 'R')) die();
  };
  addEventListener('keydown', onKey(true));
  addEventListener('keyup', onKey(false));

  document.querySelectorAll('.touch button').forEach(b => {
    const k = b.dataset.k;
    const set = v => e => { keys[k] = v; e.preventDefault(); };
    b.addEventListener('pointerdown', set(true));
    ['pointerup','pointerleave','pointercancel'].forEach(t => b.addEventListener(t, set(false)));
  });

  const hit = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;

  function update() {
    const p = L.p;
    p.vx = (keys.right - keys.left) * 3.2;
    if (keys.jump && p.on) { p.vy = -9.5; p.on = false; }
    p.vy += 0.5;
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = 0;

    // chão (com buraco quando a armadilha cai)
    const fl = L.floor;
    const overFloor = p.x + p.w > fl.x && p.x < fl.x + fl.w;
    if (p.x + p.w/2 > fl.trig && !fl.drop) fl.drop = 1;
    if (fl.drop) fl.drop += 6;
    const solidHere = !(overFloor && fl.drop > 1);
    if (solidHere && p.y + p.h >= GROUND) { p.y = GROUND - p.h; p.vy = 0; p.on = true; }
    else if (p.y > H + 40) return die();

    // espinhos
    for (const s of L.spikes) if (hit(p, {x:s.x, y:GROUND-20, w:s.w, h:20})) return die();
    for (const s of L.hidden) {
      if (p.x + p.w > s.trig) s.up = Math.min(20, s.up + 4);
      if (s.up > 4 && hit(p, {x:s.x, y:GROUND-s.up, w:s.w, h:s.up})) return die();
    }
    // serra
    L.saw.a += .25; L.saw.y = GROUND - 80 + Math.sin(L.saw.a * .35) * 38;
    const sw = L.saw;
    if (hit(p, {x:sw.x-sw.r+4, y:sw.y-sw.r+4, w:sw.r*2-8, h:sw.r*2-8})) return die();

    // porta
    if (hit(p, L.door) && !L.won) {
      L.won = true;
      tauntEl.textContent = deaths === 0 ? 'Zero mortes?! Quem é você?' : `Passou com ${deaths} morte${deaths>1?'s':''}. Agora tenta fazer melhor.`;
      setTimeout(() => { deaths = 0; deathsEl.textContent = 0; L = level(); }, 2200);
    }
  }

  function tri(x, y, w, h) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w/2, y - h); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#cbb9ea'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#301b4a';
    const fl = L.floor;
    ctx.fillRect(0, GROUND, fl.x, H - GROUND);
    ctx.fillRect(fl.x + fl.w, GROUND, W - fl.x - fl.w, H - GROUND);
    ctx.fillRect(fl.x, GROUND + fl.drop, fl.w, H);

    ctx.fillStyle = '#d3122f';
    for (const s of L.spikes) for (let i = 0; i < s.w; i += 20) tri(s.x + i, GROUND, 20, 20);
    for (const s of L.hidden) if (s.up > 0) for (let i = 0; i < s.w; i += 18) tri(s.x + i, GROUND, 18, s.up);

    // serra
    const sw = L.saw;
    ctx.save(); ctx.translate(sw.x, sw.y); ctx.rotate(sw.a);
    ctx.fillStyle = '#555a66';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, r = i % 2 ? sw.r - 5 : sw.r;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d3122f'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
    ctx.restore();

    // porta
    const d = L.door;
    ctx.fillStyle = '#1f6b4f'; ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#14091f'; ctx.lineWidth = 3; ctx.strokeRect(d.x, d.y, d.w, d.h);

    // jogador
    const p = L.p;
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#14091f';
    const ex = p.x + (p.vx < 0 ? 5 : 14);
    ctx.fillRect(ex, p.y + 7, 3, 7); ctx.fillRect(ex + 5, p.y + 7, 3, 7);
  }

  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(cv);
  (function loop() { if (visible) { update(); draw(); } requestAnimationFrame(loop); })();
  cv.addEventListener('click', () => cv.focus());
})();

/* ---------- Recorde local ---------- */
(() => {
  const form = document.getElementById('scoreForm');
  const input = document.getElementById('mortes');
  const msg = document.getElementById('scoreMsg');
  const list = document.getElementById('scoreList');
  const KEY = 'morri-de-novo-runs';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  const render = () => {
    const runs = load().sort((a, b) => a - b).slice(0, 5);
    list.innerHTML = runs.map((n, i) => `<li>${i + 1}º melhor: ${n} mortes</li>`).join('');
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = parseInt(input.value, 10);
    if (isNaN(n) || n < 0) return;
    const runs = load();
    const best = runs.length ? Math.min(...runs) : Infinity;
    runs.push(n); save(runs);
    msg.textContent = n < best
      ? (runs.length === 1 ? `Primeira run registrada: ${n} mortes.` : `Novo recorde! ${n} mortes. Dá pra baixar mais?`)
      : `${n} mortes. Seu recorde continua ${best}. Tenta de novo.`;
    input.value = ''; render();
  });
  render();
})();
