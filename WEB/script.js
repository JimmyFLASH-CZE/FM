// === SCRIPTY PRO index.html ===

let patternFiles = [];

// zavolání při načtení stránky
window.addEventListener('load', loadPatterns);

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

    for (const f of list) {
      const div = document.createElement('div');
      div.className = "patternItem";

      // název a popis
      const nameSpan = document.createElement('span');
      nameSpan.className = "patternSpan";

      let description = "";
      try {
        const resp = await fetch("/pattern?name=" + encodeURIComponent(f));
        if (resp.ok) {
          const data = await resp.json();
          description = data.description || "";
        }
      } catch {
        description = "";
      }

      const baseName = f.replace(/\.[^/.]+$/, "");
      nameSpan.innerHTML = `<strong>${baseName}</strong><div style="text-align:center; flex: 1;">${description}</div>`;

      // kliknutí na span = otevřít editor
      nameSpan.onclick = async () => {
        try {
          const resp = await fetch("/pattern?name=" + encodeURIComponent(f));
          if (!resp.ok) throw new Error("Vzorec nenalezen");
          const data = await resp.json();
          sessionStorage.setItem("currentPattern", JSON.stringify(data));
          window.location.href = "editor.html";
        } catch(e) {
          alert("Pattern Load error: " + e.message);
        }
      };

      // tlačítko Smazat (vpravo)
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "✖";
      deleteBtn.title = "Delete";
      deleteBtn.className = "deleteBtn";
      deleteBtn.onclick = async (e) => {
        e.stopPropagation(); // aby klik na delete neotevřel pattern
        if (!confirm(`Opravdu chcete smazat "${f}"?`)) return;
        try {
          const resp = await fetch("/deletePattern?name=" + encodeURIComponent(f), { method: "POST" });
          if (!resp.ok) throw new Error(await resp.text());
          loadPatterns(); // obnovit seznam
        } catch(e) {
          alert("Delete pattern error: " + e.message);
        }
      };

      nameSpan.appendChild(deleteBtn);

      div.appendChild(nameSpan);
      container.appendChild(div);
    }
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
    alert("Pattern Saved to ESP!");
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
        alert("Incorrect JSON file format!");
        return;
      }

      // podrobnější kontrola každé části
      const requiredFields = ["speedPercent", "accelPercent"];
      for (const [i, part] of obj.parts.entries()) {
        if (typeof part !== "object" || part === null) {
          alert(`Part #${i + 1} is not an object!`);
          return;
        }
        for (const field of requiredFields) {
          if (!(field in part)) {
            alert(`Part #${i + 1} missing field '${field}'!`);
            return;
          }
          if (typeof part[field] !== "number") {
            alert(`Field '${field}' in part #${i + 1} is not number!`);
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
      alert("Pattern Load error: " + err);
    }
  };

  // otevře dialog
  input.click();
}
