let patternFiles = [];

// zavolání při načtení stránky
window.addEventListener('load', loadPatterns);

// Dark mode
const darkMode = localStorage.getItem('darkMode') === 'true';
document.body.classList.toggle('dark-mode', darkMode);
document.getElementById('darkModeCheckbox').checked = darkMode;
document.getElementById('darkModeCheckbox').addEventListener('change', e => {
  const enabled = e.target.checked;
  document.body.classList.toggle('dark-mode', enabled);
  localStorage.setItem('darkMode', enabled);
});

// načtení vzorců
async function loadPatterns() {
  const container = document.getElementById('patternList');
  container.innerHTML = "<p>Načítám seznam vzorců...</p>";

  try {
    const res = await fetch("/patterns");
    if (!res.ok) throw new Error("Chyba při načítání vzorců");

    const list = await res.json();
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = "<p>Žádné vzorce ve složce PATTERNS.</p>";
      return;
    }

    list.forEach(f => {
      const div = document.createElement('div');
      div.className = "patternItem";

      // název vzorce
      const nameSpan = document.createElement('span');
      nameSpan.textContent = f;
      nameSpan.style.marginLeft = "10px";

      // tlačítko Otevřít
      const openBtn = document.createElement('button');
      openBtn.textContent = "Otevřít";
      openBtn.onclick = async () => {
        try {
          const resp = await fetch("/pattern?name=" + encodeURIComponent(f));
          if (!resp.ok) throw new Error("Vzorec nenalezen");
          const data = await resp.json();
          sessionStorage.setItem("currentPattern", JSON.stringify(data));
          window.location.href = "editor.html";
        } catch(e) {
          alert("Chyba při načítání vzorce: " + e.message);
        }
      };

      // tlačítko Smazat
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Smazat";
      deleteBtn.onclick = async () => {
        if (!confirm(`Opravdu chcete smazat "${f}"?`)) return;
        try {
          const resp = await fetch("/deletePattern?name=" + encodeURIComponent(f), { method: "POST" });
          if (!resp.ok) throw new Error(await resp.text());
          loadPatterns(); // obnovit seznam
        } catch(e) {
          alert("Chyba při mazání vzorce: " + e.message);
        }
      };

      div.appendChild(openBtn);
      div.appendChild(deleteBtn);
      div.appendChild(nameSpan);

      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<p>Chyba při načítání vzorců: ${err}</p>`;
  }
}

// uložení vzorce do ESP
async function savePatternToESP(patternObj) {
  const res = await fetch("/savePattern", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(patternObj)
  });

  if(res.ok){
    alert("Vzorec uložen do ESP!");
  } else {
    const text = await res.text();
    alert("Chyba při ukládání: " + text);
  }
}

// vytvoření nového vzorce
function createNewPattern() {
  // Vyčistit sessionStorage, aby editor načetl prázdný vzorec
  sessionStorage.removeItem("currentPattern");
  // Přesměrovat na editor
  window.location.href = "editor.html";
}

// import vzorce z JSON souboru
async function ImportPattern() {
  // vytvoření inputu pro výběr souboru
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const obj = JSON.parse(text);

      // základní kontrola
      if (!obj.name || !Array.isArray(obj.parts)) {
        alert("Neplatný formát JSON souboru!");
        return;
      }

      // podrobnější kontrola každé části
      const requiredFields = ["speedPercent", "accelPercent"];
      for (const [i, part] of obj.parts.entries()) {
        if (typeof part !== "object" || part === null) {
          alert(`Část #${i + 1} není objekt!`);
          return;
        }
        for (const field of requiredFields) {
          if (!(field in part)) {
            alert(`Část #${i + 1} postrádá pole '${field}'!`);
            return;
          }
          if (typeof part[field] !== "number") {
            alert(`Pole '${field}' v části #${i + 1} není číslo!`);
            return;
          }
        }
      }

      // uložení na server (LittleFS)
      const res = await fetch("/savePattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj)
      });

      const msg = await res.text();
      alert(msg);

      // znovunačtení seznamu
      if (typeof loadPatternList === "function") {
        loadPatternList();
      } else {
        location.reload();
      }
    } catch (err) {
      alert("Chyba při načítání souboru: " + err);
    }
  };

  // otevře dialog
  input.click();
}
