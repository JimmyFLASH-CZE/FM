// === SCRIPTY PRO EDITOR VZORCŮ ===

let pattern = [];
let chart;
let activeIndex = -1; // index aktivního kroku
let isDirty = false;  // flag pro sledování změn

// -------------------- DARK MODE + LOGO --------------------
const darkModeCheckbox = document.getElementById('darkModeCheckbox');
const appLogoImg = document.querySelector('.app-logo img');

// funkce pro nastavení loga podle režimu
function updateLogo(isDark) {
  if (!appLogoImg) return;
  appLogoImg.src = isDark ? "JFM-X_fist_drkbg.png" : "JFM-X_fist_ltbg.png";
}

// načtení uloženého režimu
const darkMode = localStorage.getItem('darkMode') === 'true';
document.body.classList.toggle('dark-mode', darkMode);
if (darkModeCheckbox) darkModeCheckbox.checked = darkMode;
updateLogo(darkMode);

// reagovat na změnu
if (darkModeCheckbox) {
  darkModeCheckbox.addEventListener('change', e => {
    const enabled = e.target.checked;
    document.body.classList.toggle('dark-mode', enabled);
    localStorage.setItem('darkMode', enabled);
    updateLogo(enabled);
  });
}

// Sledování kroku zpět a BACK button
function goBack() { window.location.href = 'index.html'; }

// Sledování pokusu o opuštění stránky
window.addEventListener("beforeunload", function (e) {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = ""; // nutné pro zobrazení varování v některých prohlížečích
  }
});

// inicializace patternu
function initPattern() {
  pattern = [
    { targetPosPercent: Math.floor(Math.random() * 51 + 50), speedPercent: 50, accelPercent: 10, randomizePercent: 0, aux1: false, aux2: false, partDelay: 0 },
    { targetPosPercent: Math.floor(Math.random() * 50), speedPercent: 50, accelPercent: 10, randomizePercent: 0, aux1: false, aux2: false, partDelay: 0 }
  ];
  renderSteps();
  setActiveStep(0);
  drawGraph();
}

// vykreslení tlačítek kroků 
function renderSteps() {
  const container = document.getElementById('patternContainer');
  container.innerHTML = "";
  pattern.forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = 'step';
    div.textContent = "Step " + (idx + 1);
    div.onclick = () => setActiveStep(idx);
    container.appendChild(div);
  });
}

// event přidání kroku s random pozicí
function addStep() {
  if (activeIndex < 0) activeIndex = 0;

  const newStep = {
    targetPosPercent: Math.floor(Math.random() * 101),
    speedPercent: 50,
    accelPercent: 10,
    randomizePercent: 0,
    aux1: false,
    aux2: false,
    partDelay: 0
  };

  pattern.splice(activeIndex + 1, 0, newStep);
  renderSteps();
  setActiveStep(activeIndex + 1);
  drawGraph();
}

// event odebrání aktivního kroku
function removeStep() {
  if (pattern.length <= 2 || activeIndex < 0) return;
  pattern.splice(activeIndex, 1);
  if (activeIndex >= pattern.length) activeIndex = pattern.length - 1;
  renderSteps();
  setActiveStep(activeIndex);
  drawGraph();
}

// event nastavení aktivního kroku
function setActiveStep(idx) {
  if (idx < 0 || idx >= pattern.length) return;
  activeIndex = idx;

  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  const step = pattern[idx];
  document.getElementById('posSlider').value = step.targetPosPercent;
  document.getElementById('posVal').textContent = step.targetPosPercent;
  document.getElementById('speedSlider').value = step.speedPercent;
  document.getElementById('speedVal').textContent = step.speedPercent;
  document.getElementById('accelSlider').value = step.accelPercent;
  document.getElementById('accelVal').textContent = step.accelPercent;
  document.getElementById('randomSlider').value = step.randomizePercent || 0;
  document.getElementById('randomVal').textContent = step.randomizePercent || 0;
  document.getElementById('aux1Box').checked = step.aux1;
  document.getElementById('aux2Box').checked = step.aux2;
  document.getElementById('delayInput').value = step.partDelay;

  drawGraph();
}

// eventy Name a Description
document.getElementById('formulaName').addEventListener('input', () => {
  isDirty = true;
  drawGraph(); // aktualizace JSON preview
});
document.getElementById('formulaDesc').addEventListener('input', () => {
  isDirty = true;
  drawGraph(); // aktualizace JSON preview
});

// eventy sliderů a checkboxů
document.getElementById('posSlider').addEventListener('input', updateActiveStep);
document.getElementById('speedSlider').addEventListener('input', updateActiveStep);
document.getElementById('accelSlider').addEventListener('input', updateActiveStep);
document.getElementById('randomSlider').addEventListener('input', updateActiveStep);
document.getElementById('aux1Box').addEventListener('change', updateActiveStep);
document.getElementById('aux2Box').addEventListener('change', updateActiveStep);
document.getElementById('delayInput').addEventListener('input', updateActiveStep);

// aktualizace aktivního kroku při změně sliderů/checkboxů
function updateActiveStep() {
  if (activeIndex < 0) return;
  const step = pattern[activeIndex];
  step.targetPosPercent = parseInt(document.getElementById('posSlider').value);
  step.speedPercent = parseInt(document.getElementById('speedSlider').value);
  step.accelPercent = parseInt(document.getElementById('accelSlider').value);
  step.randomizePercent = parseInt(document.getElementById('randomSlider').value);
  step.aux1 = document.getElementById('aux1Box').checked;
  step.aux2 = document.getElementById('aux2Box').checked;
  step.partDelay = parseInt(document.getElementById('delayInput').value);
  document.getElementById('posVal').textContent = step.targetPosPercent;
  document.getElementById('speedVal').textContent = step.speedPercent;
  document.getElementById('accelVal').textContent = step.accelPercent;
  document.getElementById('randomVal').textContent = step.randomizePercent;
  drawGraph();
  isDirty = true; // označit jako změněné
}

// simulace trapezoidního profilu s jemným zastavením
function simulateMotion(startPos, targetPos, maxSpeed, accel, stepTime = 0.01) {
  let points = [];
  let pos = startPos;
  let vel = 0;
  let time = 0;
  let dir = Math.sign(targetPos - startPos);
  if (dir === 0) return [{ x: 0, y: startPos }];

  let maxSteps = 10000;
  for (let i = 0; i < maxSteps; i++) {
    let distance = targetPos - pos;
    if (Math.abs(distance) < 0.1) {
      pos = targetPos;
      vel = 0;
      points.push({ x: time, y: pos });
      break;
    }

    let brakeDist = (vel * vel) / (2 * accel);
    if (Math.abs(distance) <= brakeDist) {
      vel -= accel * stepTime;
      if (vel < 0) vel = 0;
    } else {
      if (vel < maxSpeed) {
        vel += accel * stepTime;
        if (vel > maxSpeed) vel = maxSpeed;
      }
    }

    pos += dir * vel * stepTime;
    time += stepTime;
    points.push({ x: time, y: parseFloat(pos.toFixed(4)) });
  }
  return points;
}

// vykreslení grafu
function drawGraph() {
  const MAX_SPEED_ABS = 100;   // reálná maximální rychlost (steps/s)
  const MAX_ACCEL_ABS = 300;  // reálné max. zrychlení (steps/s²)

  let dataset = [];
  let upperBand = []; // horní hranice náhodného rozsahu
  let lowerBand = []; // dolní hranice náhodného rozsahu
  let auxLayers = [];

  let timeOffset = 0;
  pattern.forEach((step, idx) => {
    const startPos = idx === 0 ? pattern[pattern.length - 1].targetPosPercent : pattern[idx - 1].targetPosPercent;
    const prevRand = idx === 0 ? pattern[pattern.length - 1].randomizePercent : pattern[idx - 1].randomizePercent;
    const currRand = step.randomizePercent;

    const speed = (step.speedPercent / 100) * MAX_SPEED_ABS;
    const accel = (step.accelPercent / 100) * MAX_ACCEL_ABS;
    const segment = simulateMotion(startPos, step.targetPosPercent, speed, accel);
    //const segment = simulateMotion(startPos, step.targetPosPercent, step.speedPercent, step.accelPercent);
    const n = segment.length;

    // Výpočet start a end bodů Randomize
    let startMin = startPos - prevRand / 2;
    let startMax = startPos + prevRand / 2;
    if (startMin < 0) { startMax += -startMin; startMin = 0; }
    if (startMax > 100) { startMin -= (startMax - 100); startMax = 100; }

    let endMin = step.targetPosPercent - currRand / 2;
    let endMax = step.targetPosPercent + currRand / 2;
    if (endMin < 0) { endMax += -endMin; endMin = 0; }
    if (endMax > 100) { endMin -= (endMax - 100); endMax = 100; }

    segment.forEach((p, i) => {
      const x = p.x + timeOffset;
      dataset.push({ x, y: p.y, stepIdx: idx });

      let t = n > 1 ? i / (n - 1) : 1;

      // Start a end body – zachovat přesnou hodnotu
      if (i === 0) {
        lowerBand.push({ x, y: startMin });
        upperBand.push({ x, y: startMax });
        return;
      } else if (i === n - 1) {
        lowerBand.push({ x, y: endMin });
        upperBand.push({ x, y: endMax });
        return;
      }

      // Prostřední body – plynulá interpolace
      const s = 0.5 - 0.5 * Math.cos(Math.PI * t); // cosine easing
      const minY = startMin + (endMin - startMin) * s;
      const maxY = startMax + (endMax - startMax) * s;

      lowerBand.push({ x, y: Math.max(0, minY) });
      upperBand.push({ x, y: Math.min(100, maxY) });
    });

    let stepStart = timeOffset;
    if (segment.length > 0) timeOffset = dataset[dataset.length - 1].x;

    // === Zpoždění ===
    if (step.partDelay > 0) {
      dataset.push({ x: timeOffset, y: step.targetPosPercent, stepIdx: idx });
      timeOffset += step.partDelay / 1000.0;
      dataset.push({ x: timeOffset, y: step.targetPosPercent, stepIdx: idx });
    }
    let stepEnd = timeOffset;

    // === AUX vrstvy ===
    if (step.aux1) auxLayers.push({
      x0: stepStart, x1: stepEnd, y0: 0, y1: 10, backgroundColor: 'rgba(21, 255, 0, 0.4)'
    });
    if (step.aux2) auxLayers.push({
      x0: stepStart, x1: stepEnd, y0: 10, y1: 20, backgroundColor: 'rgba(240, 93, 93, 0.4)'
    });
  });

  // === objekt pro export ===
  const patternObj = {
    name: document.getElementById('formulaName').value,
    description: document.getElementById('formulaDesc').value,
    parts: pattern.map(p => ({
      targetPosPercent: p.targetPosPercent,
      speedPercent: p.speedPercent,
      accelPercent: p.accelPercent,
      randomizePercent: p.randomizePercent,
      aux1: p.aux1,
      aux2: p.aux2,
      partDelay: p.partDelay
    })),
    partCount: pattern.length
  };
  document.getElementById('output').textContent = JSON.stringify(patternObj, null, 2);

  // === vykreslení grafu ===
  if (chart) chart.destroy();
  const ctx = document.getElementById('motorChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        // spodní hranice náhodného rozsahu
        {
          label: 'Min range',
          data: lowerBand,
          borderWidth: 0,
          pointRadius: 0,
          fill: '+1', // vyplň mezi tímto a dalším datasetem
        },
        // horní hranice náhodného rozsahu + průhledná výplň
        {
          label: 'Max range',
          data: upperBand,
          borderWidth: 0,
          pointRadius: 0,
          backgroundColor: 'rgba(255, 0, 106, 0.35)',
          fill: '-1', // vyplň mezi horní a spodní křivkou
        },
        // hlavní trajektorie polohy motoru
        {
          label: 'Poloha motoru (%)',
          data: dataset,
          fill: false,
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 0,
          clip: false,
          segment: {
            borderColor: ctx => ctx.p0.parsed.stepIdx === activeIndex ? 'blue' : 'gray'
          }
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      parsing: false,
      normalized: true,
      clip: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Time' }, ticks: { display: false } },
        y: { min: 0, max: 100, title: { display: true, text: 'Position (%)' } }
      },
      plugins: {
        legend: { display: false },
        // AUX vrstvy – nezávislé překryvy mimo random oblast
        annotation: {
          annotations: auxLayers.reduce((acc, a, i) => {
            acc['aux' + i] = {
              type: 'box',
              xMin: a.x0,
              xMax: a.x1,
              yMin: a.y0,
              yMax: a.y1,
              backgroundColor: a.backgroundColor,
              borderWidth: 0
            };
            return acc;
          }, {})
        }
      },
      // klikání / dotyk na graf pro výběr kroku
      onClick: (evt) => {
        // Chart.js správně rozpozná kliknutí i na mobilu
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false);
        if (points.length) {
          const idx = points[0].index;
          const stepIdx = dataset[idx].stepIdx;
          setActiveStep(stepIdx);
        }
      }
    }
  });
}


// načtení vzorce ze sessionStorage nebo fallback init
window.onload = () => {
  const stored = sessionStorage.getItem("currentPattern");
  if (stored) {
    try {
      const obj = JSON.parse(stored);
      document.getElementById("formulaName").value = obj.name || "";
      document.getElementById("formulaDesc").value = obj.description || "";
      pattern = (obj.parts || []).map(p => ({
        targetPosPercent: p.targetPosPercent ?? p.position ?? 0,
        speedPercent: p.speedPercent ?? p.maxSpeed ?? 50,
        accelPercent: p.accelPercent ?? p.acceleration ?? 10,
        randomizePercent: p.randomizePercent ?? p.randomization ?? 0,
        aux1: p.aux1 ?? p.AUX1 ?? false,
        aux2: p.aux2 ?? p.AUX2 ?? false,
        partDelay: p.partDelay ?? p.delay ?? 0
      }));
      renderSteps();
      setActiveStep(0);
      drawGraph();
      return;
    } catch (e) {
      console.error("Chyba při načítání JSON:", e);
    }
  }
  initPattern();
  isDirty = false;
};

// uložení vzorce
async function saveToJson() {
  const name = document.getElementById('formulaName').value.trim();
  if (!name) {
    showStatusModal("Fill in the pattern name.", true, "Save Pattern");
    return;
  }

  const patternObj = {
    name: name,
    description: document.getElementById('formulaDesc').value,
    parts: pattern.map(p => ({
      targetPosPercent: p.targetPosPercent,
      speedPercent: p.speedPercent,
      accelPercent: p.accelPercent,
      randomizePercent: p.randomizePercent,
      aux1: p.aux1,
      aux2: p.aux2,
      partDelay: p.partDelay
    })),
    partCount: pattern.length
  };

  try {
    const res = await fetch("/savePattern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patternObj)
    });

    const text = await res.text();
    showStatusModal(text, false, "Save Pattern"); // potvrzení uživateli
    isDirty = false; // reset sledovače změn
  } catch (err) {
    showStatusModal("⚠️ Save pattern error: " + (err.message || err), true, "Save Pattern");
  }
}

// test vzorce – uloží a spustí na ESP
async function testPattern() {
  if (!pattern.length) return;
  const modal = showStatusModal("🔄 Test pattern: Saving...", false, "Test Pattern");
  const patternObj = {
    name: "!EditorLatestTest",
    description: "Last pattern testing from Pattern Studio",
    parts: pattern.map(p => ({
      targetPosPercent: p.targetPosPercent,
      speedPercent: p.speedPercent,
      accelPercent: p.accelPercent,
      randomizePercent: p.randomizePercent,
      aux1: p.aux1,
      aux2: p.aux2,
      partDelay: p.partDelay
    })),
    partCount: pattern.length
  };

  try {
    // 1️⃣ Uloží pattern
    const res = await fetch("/savePattern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patternObj)
    });
    const text = await res.text();
    modal.update("✅ Pattern saved: " + text);

    // 2️⃣ Spustí pattern na ESP
    modal.update("🔄 Sending pattern to ESP...");
    const resRun = await fetch("/runPattern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "!EditorLatestTest" })
    });

    modal.update("✅ Test pattern uploaded and started.");
  } catch (err) {
    showStatusModal("⚠️ Failed: " + (err.message || err), true);
  }
}

// Export vzorce do souboru
function exportPattern() {
  const name = document.getElementById('formulaName').value.trim();
  if (!name) {
    showStatusModal("Fill the pattern name!", true, "Export Pattern");
    return;
  }

  const patternObj = {
    name: name,
    description: document.getElementById('formulaDesc').value,
    parts: pattern.map(p => ({
      targetPosPercent: p.targetPosPercent,
      speedPercent: p.speedPercent,
      accelPercent: p.accelPercent,
      randomizePercent: p.randomizePercent,
      aux1: p.aux1,
      aux2: p.aux2,
      partDelay: p.partDelay
    })),
    partCount: pattern.length
  };

  const jsonStr = JSON.stringify(patternObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/[^a-z0-9_\-]/gi, '_') + ".json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// === Pomocná funkce pro zobrazení modální zprávy ===
function showStatusModal(message, isError = false, title = "Status") {
  // odstranění starého modalu
  const oldModal = document.querySelector('.status-modal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.className = 'login-modal status-modal';
  modal.innerHTML = `
    <div class="login-box ${isError ? 'error' : ''}">
      <h3>${title}</h3>
      <p id="statusMessage">${message}</p>
      <div class="login-buttons">
        <button id="statusOk">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.classList.remove('hidden');

  modal.querySelector('#statusOk').addEventListener('click', () => modal.remove());

  return {
    update: (newMessage) => {
      const msgEl = modal.querySelector('#statusMessage');
      if (msgEl) msgEl.textContent = newMessage;
    },
    close: () => modal.remove()
  };
}
