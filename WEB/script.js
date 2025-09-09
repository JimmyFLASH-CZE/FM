let patternFiles = [];

// zavolání při načtení stránky
window.addEventListener('load', loadPatterns);

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
