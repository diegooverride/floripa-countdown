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

function pad(n){return String(n).padStart(2, '0')}

function update(){
  const now = new Date();
  const target = new Date(TARGET_ISO);
  let diff = target.getTime() - now.getTime();
  if (diff <= 0){
    $d.textContent = '00'; $h.textContent = '00'; $m.textContent = '00'; $s.textContent = '00';
    document.querySelector('.subtitle').textContent = 'Pouso concluído. Bem-vindo(a) a Floripa!';
    if (soundOn){ try{ ping.currentTime = 0; ping.play(); }catch(e){} }
    clearInterval(timer); return;
  }
  const days = Math.floor(diff / (1000*60*60*24)); diff -= days * (1000*60*60*24);
  const hours = Math.floor(diff / (1000*60*60)); diff -= hours * (1000*60*60);
  const mins = Math.floor(diff / (1000*60)); diff -= mins * (1000*60);
  const secs = Math.floor(diff / 1000);
  $d.textContent = pad(days); $h.textContent = pad(hours); $m.textContent = pad(mins); $s.textContent = pad(secs);
}
const timer = setInterval(update, 1000); update();

// ===== Aviao animado com curvas e rastro =====
const plane = document.querySelector('.airplane');
const trail = document.getElementById('trail');
const ctx = trail.getContext('2d');
let points = [];
const SPEED = 0.6, FADE_MS = 3500, LINE_WIDTH = 3, DASH = [10,10];

function resize(){ trail.width = innerWidth * devicePixelRatio; trail.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
addEventListener('resize', resize); resize();
let t0 = performance.now()/1000;

function pathAt(t){
  const w = innerWidth, h = innerHeight, cx = w*0.5, cy = h*0.45, ax = w*0.42, ay = h*0.18;
  const x = cx + ax * Math.sin(t*0.7) * Math.cos(t*0.25);
  const y = cy + ay * Math.sin(t*0.9 + Math.sin(t*0.35));
  return {x,y};
}
function animate(){
  const now = performance.now()/1000, t = (now - t0) * SPEED;
  const p = pathAt(t), prev = pathAt(t-0.01);
  const angle = Math.atan2(p.y - prev.y, p.x - prev.x);
  plane.style.transform = `translate(${p.x - plane.clientWidth/2}px, ${p.y - plane.clientHeight/2}px) rotate(${angle}rad)`;
  points.push({x:p.x, y:p.y, t:now});
  const cutoff = now - FADE_MS/1000;
  points = points.filter(pt => pt.t >= cutoff);
  ctx.clearRect(0,0,trail.width,trail.height); ctx.lineWidth=LINE_WIDTH; ctx.setLineDash(DASH);
  for(let i=0;i<points.length-1;i++){ const a=points[i], b=points[i+1]; const age = now - a.t; const alpha = Math.max(0, 1-(age*1000)/FADE_MS); ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// === Música de fundo controlada pelo botão Som ===
const bgm = document.getElementById('bgm'); bgm.volume = 0.15;
try{ const saved = localStorage.getItem('floripa-sound'); if(saved==='on'){ soundOn = true; document.getElementById('sound-state').textContent='ON'; bgm.play().catch(()=>{}); } }catch(e){}
toggleBtn.addEventListener('click',()=>{ soundOn=!soundOn; document.getElementById('sound-state').textContent = soundOn?'ON':'OFF'; try{ if(soundOn){ bgm.play().catch(()=>{}); localStorage.setItem('floripa-sound','on'); } else { bgm.pause(); bgm.currentTime=0; localStorage.setItem('floripa-sound','off'); } }catch(e){} });
