// =====================
// 100 Filósofos Dijeron — PRO
// =====================

const $ = (id) => document.getElementById(id);

// ---- Estado global
let scoreA = 0, scoreB = 0;
let bank = 0, strikes = 0;

let roundIndex = 0;     // 0..4
let multiplier = 1;

let timerId = null;
let timerLeft = 0;
let timerPaused = false;

// ---- Nombres equipos
let teamAName = "Equipo A";
let teamBName = "Equipo B";

// ---- 5 RONDAS listas (Samuel Ramos)
// OJO: son “respuestas esperadas” para el juego; tú puedes ajustar puntajes a tu gusto.
const rounds = [
  {
    title: "Identidad mexicana",
    mult: 1,
    question: "…según Samuel Ramos, explica una causa del sentimiento de inferioridad en México?",
    answers: [
      { text: "Complejo de inferioridad", pts: 35 },
      { text: "Imitación de modelos extranjeros", pts: 20 },
      { text: "Falta de autoconocimiento", pts: 14 },
      { text: "Desigualdad / herencia histórica", pts: 12 },
      { text: "Dependencia cultural", pts: 10 },
      { text: "Educación deficiente", pts: 9 }
    ]
  },
  {
    title: "El ‘pelado’ y la máscara",
    mult: 1,
    question: "…describe una característica del ‘pelado’ en el análisis de Samuel Ramos?",
    answers: [
      { text: "Agresividad como defensa", pts: 28 },
      { text: "Fanfarronería / alarde", pts: 18 },
      { text: "Machismo / demostración de poder", pts: 16 },
      { text: "Inseguridad interna", pts: 14 },
      { text: "Lenguaje fuerte / insulto", pts: 12 },
      { text: "Necesidad de respeto", pts: 10 }
    ]
  },
  {
    title: "Crítica a la imitación",
    mult: 2,
    question: "…según Samuel Ramos, ¿qué consecuencia trae imitar modelos extranjeros sin adaptarlos?",
    answers: [
      { text: "Desconexión con la realidad mexicana", pts: 26 },
      { text: "Identidad frágil", pts: 18 },
      { text: "Dependencia cultural", pts: 16 },
      { text: "Falsa modernidad", pts: 14 },
      { text: "Proyectos que no funcionan aquí", pts: 13 },
      { text: "Desprecio de lo propio", pts: 12 }
    ]
  },
  {
    title: "Solución / propuesta",
    mult: 2,
    question: "…según Samuel Ramos, ¿qué ayuda a superar el complejo de inferioridad?",
    answers: [
      { text: "Autoconocimiento (conocer lo que somos)", pts: 30 },
      { text: "Educación y formación del carácter", pts: 20 },
      { text: "Crear cultura propia (no copiar)", pts: 16 },
      { text: "Crítica racional / reflexión", pts: 14 },
      { text: "Asumir la circunstancia histórica", pts: 12 },
      { text: "Trabajo colectivo / responsabilidad", pts: 10 }
    ]
  },
  {
    title: "Cultura y circunstancia",
    mult: 3,
    question: "…es algo que influye en la identidad mexicana según Ramos (pista: contexto)?",
    answers: [
      { text: "Historia y circunstancias del país", pts: 26 },
      { text: "Cultura y tradiciones", pts: 18 },
      { text: "Relaciones sociales / jerarquías", pts: 16 },
      { text: "Economía / desigualdad", pts: 14 },
      { text: "Educación / instituciones", pts: 13 },
      { text: "Modelos culturales importados", pts: 12 }
    ]
  }
];

// Convertir a estructura con revealed
function normalizeRound(r){
  return {
    title: r.title || "—",
    question: r.question || "(Pregunta aquí)",
    mult: Number(r.mult || 1),
    answers: (r.answers || []).map(a => ({
      text: a.text || "Respuesta",
      pts: Number(a.pts || 0),
      revealed: false
    }))
  };
}

let current = normalizeRound(rounds[roundIndex]);

// ---- Render
function renderScores(){
  $("scoreA").textContent = scoreA;
  $("scoreB").textContent = scoreB;
  $("bankPoints").textContent = bank;
  $("roundNum").textContent = (roundIndex + 1);
  $("roundTitle").textContent = current.title;
  $("nameA").textContent = teamAName;
  $("nameB").textContent = teamBName;
}

function renderStrikes(){
  const xs = $("xrow").querySelectorAll(".x");
  xs.forEach((x,i)=> x.classList.toggle("on", i < strikes));
  $("stealBtn").disabled = strikes < 3;
  $("stealHint").textContent = strikes < 3 ? "3 strikes = robar" : "ROBAR ACTIVADO";
}

function renderBoard(){
  $("questionText").textContent = current.question;

  const wrap = $("answers");
  wrap.innerHTML = "";

  current.answers.forEach((a, idx) => {
    const card = document.createElement("button");
    card.className = "answer " + (a.revealed ? "revealed" : "hidden");
    card.type = "button";
    card.title = `Click para revelar/ocultar (atajo: ${idx+1})`;

    card.innerHTML = `
      <div class="left">
        <div class="badge">${idx+1}</div>
        <div class="txt">${a.text}</div>
      </div>
      <div class="pts">${a.pts * multiplier}</div>
    `;

    card.addEventListener("click", () => toggleAnswer(idx));
    wrap.appendChild(card);
  });

  // Admin sync
  $("adminTitle").value = current.title;
  $("adminQuestion").value = current.question;
  $("adminMult").value = multiplier;
  $("adminAnswers").value = current.answers.map(a => `${a.text}|${a.pts}`).join("\n");
}

function recalcBank(){
  bank = current.answers
    .filter(a => a.revealed)
    .reduce((acc,a)=> acc + (a.pts * multiplier), 0);
  if (bank < 0) bank = 0;
}

function toggleAnswer(i){
  const a = current.answers[i];
  a.revealed = !a.revealed;
  recalcBank();
  renderScores();
  renderBoard();
  a.revealed ? beep(560, 0.07) : beep(240, 0.06);
}

function strike(){
  if (strikes >= 3) return;
  strikes++;
  renderStrikes();
  shakeBoard();
  beep(140, 0.12);
}

function revealAll(){
  current.answers.forEach(a => a.revealed = true);
  recalcBank();
  renderScores();
  renderBoard();
  beep(720, 0.08);
}

function resetRoundState(){
  strikes = 0;
  bank = 0;
  current.answers.forEach(a => a.revealed = false);
  stopTimer(true);
  renderScores();
  renderStrikes();
  renderBoard();
}

// ---- Efectos PRO
function shakeBoard(){
  const b = document.querySelector(".board");
  b.animate([
    { transform:"translateX(0)" },
    { transform:"translateX(-8px)" },
    { transform:"translateX(8px)" },
    { transform:"translateX(-5px)" },
    { transform:"translateX(0)" }
  ], { duration: 260, easing:"ease-out" });
}

function confettiBoom(){
  const root = $("confetti");
  root.innerHTML = "";
  const pieces = 80;
  for(let i=0;i<pieces;i++){
    const el = document.createElement("div");
    el.className = "c";
    el.style.left = Math.random()*100 + "vw";
    el.style.top = (-10 - Math.random()*30) + "vh";
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.background = `hsl(${Math.floor(Math.random()*360)}, 90%, 65%)`;
    el.style.animationDuration = (900 + Math.random()*700) + "ms";
    root.appendChild(el);
    setTimeout(()=>el.remove(), 2200);
  }
}

// ---- Sonido
function beep(freq, dur){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, dur*1000);
  }catch(e){}
}

// ---- Timer (con overlay gigante)
function openTimerOverlay(){
  $("timerOverlay").classList.add("show");
  $("timerOverlay").setAttribute("aria-hidden","false");
  updateTimerOverlay();
}
function closeTimerOverlay(){
  $("timerOverlay").classList.remove("show");
  $("timerOverlay").setAttribute("aria-hidden","true");
}
function updateTimerOverlay(){
  $("timerOverlayTime").textContent = timerLeft > 0 ? timerLeft : "--";
}
function setTimer(seconds){
  stopTimer(false);
  timerLeft = seconds;
  timerPaused = false;
  $("timerText").textContent = timerLeft + "s";
  updateTimerOverlay();
  openTimerOverlay();

  timerId = setInterval(()=>{
    if (timerPaused) return;
    timerLeft--;
    $("timerText").textContent = timerLeft + "s";
    updateTimerOverlay();

    if (timerLeft <= 5 && timerLeft > 0) beep(520, 0.04);

    if (timerLeft <= 0){
      stopTimer(false);
      beep(90, 0.25);
      confettiBoom();
    }
  }, 1000);
}

function stopTimer(resetText){
  if (timerId) clearInterval(timerId);
  timerId = null;
  timerPaused = false;
  if (resetText) $("timerText").textContent = "--";
  closeTimerOverlay();
}

function togglePauseTimer(){
  if (!timerId) return;
  timerPaused = !timerPaused;
  beep(timerPaused ? 260 : 520, 0.06);
}

// ---- Cobrar banca
function awardTo(team){
  if (bank <= 0) { beep(180, 0.08); return; }
  if (team === "A") scoreA += bank;
  else scoreB += bank;

  bank = 0;
  strikes = 0;
  current.answers.forEach(a => a.revealed = false);
  renderScores();
  renderStrikes();
  renderBoard();
  confettiBoom();
  beep(880, 0.09);
}

// ---- Cambiar nombres
function editName(team){
  const currentName = team === "A" ? teamAName : teamBName;
  const n = prompt("Nombre del " + (team === "A" ? "Equipo A" : "Equipo B") + ":", currentName);
  if (!n) return;
  if (team === "A") teamAName = n.trim();
  else teamBName = n.trim();
  renderScores();
}

// ---- Cargar ronda
function loadRound(i){
  roundIndex = i;
  current = normalizeRound(rounds[roundIndex]);
  multiplier = current.mult;
  resetRoundState();
  $("roundTitle").textContent = current.title;
}

// ---- Admin
function applyAdminToCurrent(alsoSave){
  const title = $("adminTitle").value.trim() || "—";
  const q = $("adminQuestion").value.trim() || "(Pregunta aquí)";
  const mult = parseInt($("adminMult").value || "1", 10);
  const lines = $("adminAnswers").value.split("\n").map(s=>s.trim()).filter(Boolean);

  const parsed = lines.map(line=>{
    const [t,p] = line.split("|").map(s=>s.trim());
    return { text: t || "Respuesta", pts: Number(p || 0) };
  });

  current.title = title;
  current.question = q;
  multiplier = Number.isFinite(mult) && mult > 0 ? mult : 1;
  current.answers = parsed.length
    ? parsed.map(a => ({...a, revealed:false}))
    : [{text:"Respuesta", pts:10, revealed:false}];

  resetRoundState();

  if (alsoSave){
    rounds[roundIndex] = {
      title: current.title,
      question: current.question,
      mult: multiplier,
      answers: current.answers.map(a => ({ text: a.text, pts: a.pts }))
    };
    beep(700, 0.08);
  }
}

// ---- Botones
$("strikeBtn").addEventListener("click", strike);
$("revealAllBtn").addEventListener("click", revealAll);
$("stealBtn").addEventListener("click", ()=>{
  alert("¡ROBAR ACTIVADO!\nEl equipo que robe debe decir UNA respuesta final.\nSi la dice bien, dale la banca con 'Cobrar banca'.");
  beep(860, 0.08);
});

$("resetRoundBtn").addEventListener("click", resetRoundState);

$("nextRoundBtn").addEventListener("click", ()=>{
  const next = (roundIndex + 1) % rounds.length;
  loadRound(next);
});

$("awardA").addEventListener("click", ()=>awardTo("A"));
$("awardB").addEventListener("click", ()=>awardTo("B"));

$("editA").addEventListener("click", ()=>editName("A"));
$("editB").addEventListener("click", ()=>editName("B"));

$("timerBtn").addEventListener("click", ()=>{
  // Si no hay timer, abre overlay igual
  openTimerOverlay();
});

$("timerOverlay").addEventListener("click", (e)=>{
  // click fuera de la tarjeta cierra
  if (e.target.id === "timerOverlay") closeTimerOverlay();
});

$("applyAdmin").addEventListener("click", ()=>applyAdminToCurrent(false));
$("saveToRounds").addEventListener("click", ()=>applyAdminToCurrent(true));

// ---- Atajos
document.addEventListener("keydown", (e)=>{
  const k = e.key.toLowerCase();

  // 1-9 revelar
  if (!isNaN(Number(k))) {
    const idx = Number(k) - 1;
    if (idx >= 0 && idx < current.answers.length) toggleAnswer(idx);
  }

  if (k === "x") strike();
  if (k === "r") $("stealBtn").click();
  if (k === "n") $("nextRoundBtn").click();

  if (k === "t") setTimer(30);
  if (k === "s") setTimer(45);

  if (k === "q") awardTo("A");
  if (k === "e") awardTo("B");

  if (k === "escape") closeTimerOverlay();
  if (k === " ") { // espacio pausa
    e.preventDefault();
    togglePauseTimer();
  }
});

// ---- Init
renderScores();
renderStrikes();
renderBoard();
$("roundTitle").textContent = current.title;
