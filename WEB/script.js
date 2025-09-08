let patternFiles = [];

// při načtení stránky zkontrolujeme sessionStorage
window.addEventListener('load', async () => {
  const storedFiles = sessionStorage.getItem("patternFilesData");
  if (storedFiles) {
    patternFiles = JSON.parse(storedFiles);
    await loadPatterns();
  }
});

document.getElementById('folderPicker').addEventListener('change', async (event) => {
  const files = event.target.files;
  patternFiles = [];

  for (let f of files) {
    if (f.name.endsWith(".json")) {
      // ulož do patternFiles jako objekt { name, content }
      const content = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsText(f);
      });
      patternFiles.push({ name: f.name, content });
    }
  }

  // uložíme do sessionStorage
  sessionStorage.setItem("patternFilesData", JSON.stringify(patternFiles));

  await loadPatterns();
});

// loadPatterns zůstává asynchronní
async function loadPatterns() {
  const container = document.getElementById('patternList');
  container.innerHTML = "";

  if (patternFiles.length === 0) {
    container.innerHTML = "<p>Žádné JSON soubory ve složce.</p>";
    return;
  }

  patternFiles.forEach((data, idx) => {
    const div = document.createElement('div');
    div.className = "patternItem";

    let obj;
    try {
      obj = JSON.parse(data.content);
    } catch (err) {
      div.textContent = `Chybný JSON: ${data.name}`;
      container.appendChild(div);
      return;
    }

    const openBtn = document.createElement('button');
    openBtn.textContent = "Otevřít";
    openBtn.addEventListener('click', () => {
      sessionStorage.setItem("currentPattern", data.content);
      window.location.href = "editor.html";
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Smazat";
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Opravdu chcete odebrat "${data.name}" ze seznamu?`)) {
        patternFiles.splice(idx, 1);
        // aktualizujeme sessionStorage
        sessionStorage.setItem("patternFilesData", JSON.stringify(patternFiles));
        loadPatterns();
      }
    });

    const textSpan = document.createElement('span');
    textSpan.style.marginLeft = "10px";
    textSpan.innerHTML = `<strong>${obj.name || data.name}</strong> – ${obj.description || "Bez popisu"}`;

    div.appendChild(openBtn);
    div.appendChild(deleteBtn);
    div.appendChild(textSpan);
    container.appendChild(div);
  });
}
