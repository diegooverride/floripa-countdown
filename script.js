// Ajuste aqui a data/horário de chegada (Timezone GMT-3)
const TARGET_ISO = '2025-12-30T18:30:00-03:00'; // Florianópolis (previsto)

const $d = document.getElementById('days');
const $h = document.getElementById('hours');
const $m = document.getElementById('minutes');
const $s = document.getElementById('seconds');
const ping = document.getElementById('ping');
const soundState = document.getElementById('sound-state');
const toggleBtn = document.getElementById('toggle-sound');

let soundOn = false;
toggleBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundState.textContent = soundOn ? 'ON' : 'OFF';
});

function pad(n){return String(n).padStart(2, '0')}

function update(){
  const now = new Date();
  const target = new Date(TARGET_ISO);
  let diff = target.getTime() - now.getTime();
  if (diff <= 0){
    $d.textContent = '00';
    $h.textContent = '00';
    $m.textContent = '00';
    $s.textContent = '00';
    document.querySelector('.subtitle').textContent = 'Pouso concluído. Bem-vindo(a) a Floripa!';
    if (soundOn){
      try{ ping.currentTime = 0; ping.play(); }catch(e){}
    }
    clearInterval(timer);
    return;
  }
  const days = Math.floor(diff / (1000*60*60*24)); diff -= days * (1000*60*60*24);
  const hours = Math.floor(diff / (1000*60*60)); diff -= hours * (1000*60*60);
  const mins = Math.floor(diff / (1000*60)); diff -= mins * (1000*60);
  const secs = Math.floor(diff / 1000);

  $d.textContent = pad(days);
  $h.textContent = pad(hours);
  $m.textContent = pad(mins);
  $s.textContent = pad(secs);
}

const timer = setInterval(update, 1000);
update();

// ===== Aviao animado com curvas e rastro =====
const plane = document.querySelector('.airplane');
const trail = document.getElementById('trail');
const ctx = trail.getContext('2d');

let points = []; // {x,y,t}

// Configuracoes ajustaveis
const SPEED = 0.6;            // velocidade (rad/s)
const FADE_MS = 3500;         // tempo para o rastro desaparecer (ms)
const LINE_WIDTH = 3;         // espessura do rastro
const DASH = [10, 10];        // padrao tracejado

function resize(){
  trail.width = window.innerWidth * devicePixelRatio;
  trail.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

let t0 = performance.now()/1000;

function pathAt(t){
  // Curvas suaves e retorno usando Lissajous com drift
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w * 0.5;
  const cy = h * 0.45;
  const ax = w * 0.42;
  const ay = h * 0.18;

  const x = cx + ax * Math.sin(t * 0.7) * Math.cos(t * 0.25);
  const y = cy + ay * Math.sin(t * 0.9 + Math.sin(t * 0.35));
  return {x, y};
}

function animate(){
  const now = performance.now()/1000;
  const t = (now - t0) * SPEED;

  const p = pathAt(t);
  const prev = pathAt(t - 0.01);
  const angle = Math.atan2(p.y - prev.y, p.x - prev.x);

  plane.style.transform = `translate(${p.x - plane.clientWidth/2}px, ${p.y - plane.clientHeight/2}px) rotate(${angle}rad)`;

  // Salva ponto do rastro
  points.push({x: p.x, y: p.y, t: now});
  const cutoff = now - FADE_MS/1000;
  points = points.filter(pt => pt.t >= cutoff);

  // Desenha rastro tracejado com fade
  ctx.clearRect(0, 0, trail.width, trail.height);
  ctx.lineWidth = LINE_WIDTH;
  ctx.setLineDash(DASH);
  for (let i=0; i<points.length-1; i++){
    const a = points[i], b = points[i+1];
    const age = now - a.t;
    const alpha = Math.max(0, 1 - (age*1000)/FADE_MS);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  requestAnimationFrame(animate);
}

if (plane.complete){
  requestAnimationFrame(animate);
}else{
  plane.addEventListener('load', () => requestAnimationFrame(animate));
}
