// ********************************************************** js pro editor vzorců **************************

let pattern = [];
let chart;
let activeIndex = -1; // index aktivního kroku

// inicializace patternu
function initPattern() {
  pattern = [
    { targetPosPercent: Math.floor(Math.random()*101), speedPercent: 50, accelPercent: 10, aux1: false, aux2: false, partDelay: 0 },
    { targetPosPercent: Math.floor(Math.random()*101), speedPercent: 50, accelPercent: 10, aux1: false, aux2: false, partDelay: 0 }
  ];
  renderSteps();
  setActiveStep(0);
  drawGraph();
}

// vykreslení kroků do UI
function renderSteps() {
  const container = document.getElementById('patternContainer');
  container.innerHTML = "";
  pattern.forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = 'step';
    div.textContent = "Krok " + (idx+1);
    div.onclick = () => setActiveStep(idx);
    container.appendChild(div);
  });
}

// přidání kroku s random pozicí
function addStep() {
  if (activeIndex < 0) activeIndex = 0;

  const newStep = {
    targetPosPercent: Math.floor(Math.random() * 101),
    speedPercent: 50,
    accelPercent: 10,
    aux1: false,
    aux2: false,
    partDelay: 0
  };

  pattern.splice(activeIndex + 1, 0, newStep);
  renderSteps();
  setActiveStep(activeIndex + 1);
  drawGraph();
}

// odebrání aktivního kroku
function removeStep() {
  if (pattern.length <= 2 || activeIndex < 0) return;
  pattern.splice(activeIndex, 1);
  if (activeIndex >= pattern.length) activeIndex = pattern.length - 1;
  renderSteps();
  setActiveStep(activeIndex);
  drawGraph();
}

// nastavení aktivního kroku
function setActiveStep(idx) {
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
  document.getElementById('aux1Box').checked = step.aux1;
  document.getElementById('aux2Box').checked = step.aux2;
  document.getElementById('delayInput').value = step.partDelay;

  drawGraph();
}

// aktualizace aktivního kroku při změně sliderů/checkboxů
function updateActiveStep() {
  if (activeIndex < 0) return;
  const step = pattern[activeIndex];
  step.targetPosPercent = parseInt(document.getElementById('posSlider').value);
  step.speedPercent = parseInt(document.getElementById('speedSlider').value);
  step.accelPercent = parseInt(document.getElementById('accelSlider').value);
  step.aux1 = document.getElementById('aux1Box').checked;
  step.aux2 = document.getElementById('aux2Box').checked;
  step.partDelay = parseInt(document.getElementById('delayInput').value);
  document.getElementById('posVal').textContent = step.targetPosPercent;
  document.getElementById('speedVal').textContent = step.speedPercent;
  document.getElementById('accelVal').textContent = step.accelPercent;
  drawGraph();
}

// eventy sliderů a checkboxů
document.getElementById('posSlider').addEventListener('input', updateActiveStep);
document.getElementById('speedSlider').addEventListener('input', updateActiveStep);
document.getElementById('accelSlider').addEventListener('input', updateActiveStep);
document.getElementById('aux1Box').addEventListener('change', updateActiveStep);
document.getElementById('aux2Box').addEventListener('change', updateActiveStep);
document.getElementById('delayInput').addEventListener('input', updateActiveStep);

// simulace trapezoidního profilu s jemným zastavením
function simulateMotion(startPos, targetPos, maxSpeed, accel, stepTime=0.01) {
  let points = [];
  let pos = startPos;
  let vel = 0;
  let time = 0;
  let dir = Math.sign(targetPos - startPos);
  if (dir === 0) return [{x:0, y:startPos}];

  let maxSteps = 10000;
  for (let i=0; i<maxSteps; i++) {
    let distance = targetPos - pos;
    if (Math.abs(distance) < 0.1) {
      pos = targetPos;
      vel = 0;
      points.push({x:time, y:pos});
      break;
    }

    let brakeDist = (vel*vel)/(2*accel);
    if (Math.abs(distance) <= brakeDist) {
      vel -= accel*stepTime;
      if (vel < 0) vel = 0;
    } else {
      if (vel < maxSpeed) {
        vel += accel*stepTime;
        if (vel > maxSpeed) vel = maxSpeed;
      }
    }

    pos += dir * vel * stepTime;
    time += stepTime;
    points.push({x:time, y:parseFloat(pos.toFixed(4))});
  }
  return points;
}

// vykreslení grafu
function drawGraph() {
  let dataset = [];
  let auxLayers = [];

  let timeOffset = 0;
  pattern.forEach((step, idx) => {
    let startPos = idx===0 ? pattern[pattern.length-1].targetPosPercent : pattern[idx-1].targetPosPercent;
    let segment = simulateMotion(startPos, step.targetPosPercent, step.speedPercent, step.accelPercent);

    segment.forEach(p => dataset.push({x:p.x+timeOffset, y:p.y, stepIdx:idx}));
    if (segment.length>0) timeOffset = dataset[dataset.length-1].x;

    if(step.partDelay>0){
      dataset.push({x:timeOffset, y:step.targetPosPercent, stepIdx:idx});
      timeOffset += step.partDelay/1000.0;
      dataset.push({x:timeOffset, y:step.targetPosPercent, stepIdx:idx});
    }

    // AUX vrstvy
    if(step.aux1) auxLayers.push({x0:timeOffset, x1:timeOffset+0.001, color:'rgba(255,255,0,0.4)'});
    if(step.aux2) auxLayers.push({x0:timeOffset, x1:timeOffset+0.001, color:'rgba(255,192,203,0.4)'});
  });

  document.getElementById('output').textContent = JSON.stringify(pattern,null,2);

  if(chart) chart.destroy();
  const ctx = document.getElementById('motorChart').getContext('2d');

  chart = new Chart(ctx, {
  type:'line',
  data:{
    datasets:[{
      label:'Poloha motoru (%)',
      data:dataset,
      fill:false,
      tension:0.3,
      borderWidth:3,
      pointRadius:0,
      clip:false,
      segment:{
        borderColor: ctx => ctx.p0.parsed.stepIdx===activeIndex ? 'red' : 'blue'
      }
    }]
  },
  options:{
    responsive:false,
    animation:false,
    parsing:false,
    normalized:true,
    clip:false,
    scales:{
      x:{ type:'linear', title:{display:true,text:'Čas (s)'} },
      y:{ min:0, max:100, title:{display:true,text:'Poloha (%)'} }
    },
    plugins:{
      legend:{ display:false }, // ✅ zde vypnuto
      annotation:{
        annotations: auxLayers.reduce((acc,a,i)=>{acc['aux'+i]={type:'box',xMin:a.x0,xMax:a.x1,yMin:0,yMax:10,color:a.color}; return acc;},{})
      }
    }
  }
});
}

// uložení vzorce
function saveToJson() {
  const name = document.getElementById('formulaName').value.trim();
  if(!name){alert("Zadejte název vzorce!");return;}

  const safeName = name.replace(/[^A-Za-z0-9_-]/g,"_");
  const parts = pattern.map(p=>({
    targetPosPercent:p.targetPosPercent,
    speedPercent:p.speedPercent,
    accelPercent:p.accelPercent,
    aux1:p.aux1,
    aux2:p.aux2,
    partDelay:p.partDelay
  }));

  const jsonObj = {name,description:document.getElementById('formulaDesc').value,parts,partCount:parts.length};
  const jsonStr = JSON.stringify(jsonObj,null,2);

  sessionStorage.setItem("currentPattern",jsonStr); // uložení do paměti
  const blob = new Blob([jsonStr],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download=`PATTERNS/${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert(`Vzorec "${name}" byl uložen.`);
}

// načtení vzorce ze sessionStorage nebo fallback init
window.onload = () => {
  const stored = sessionStorage.getItem("currentPattern");
  if(stored){
    try{
      const obj = JSON.parse(stored);
      document.getElementById("formulaName").value = obj.name || "";
      document.getElementById("formulaDesc").value = obj.description || "";
      pattern = (obj.parts||[]).map(p=>({
        targetPosPercent: p.targetPosPercent ?? p.position ?? 0,
        speedPercent: p.speedPercent ?? p.maxSpeed ?? 50,
        accelPercent: p.accelPercent ?? p.acceleration ?? 10,
        aux1: p.aux1 ?? p.AUX1 ?? false,
        aux2: p.aux2 ?? p.AUX2 ?? false,
        partDelay: p.partDelay ?? p.delay ?? 0
      }));
      renderSteps();
      setActiveStep(0);
      drawGraph();
      return;
    }catch(e){
      console.error("Chyba při načítání JSON:",e);
    }
  }
  initPattern();
};
