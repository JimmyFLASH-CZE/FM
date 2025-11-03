// === LOGIN MODAL A LOGIKA ===
let isLoggedIn = false;

// --- odkazy ---
const loginBtn = document.getElementById('loginBtn');
const pageContent = document.querySelector('.page-content');

// --- Obsah stránky zablokován dokud není login ---
pageContent.style.display = "none";

// --- Vytvoření login modal okna (initial hidden) ---
const loginModal = document.createElement('div');
loginModal.className = 'login-modal hidden';
loginModal.innerHTML = `
  <div class="login-box">
    <h3>Login</h3>
    <input type="password" id="loginPassword" placeholder="Enter password">
    <div class="login-buttons">
      <button id="loginSubmit">Login</button>
      <button id="loginCancel">Cancel</button>
    </div>
  </div>
`;
document.body.appendChild(loginModal);

// --- Vytvoření status modal okna ---
const statusModal = document.createElement('div');
statusModal.className = 'login-modal status-modal hidden';
statusModal.innerHTML = `
  <div class="login-box">
    <h3 id="statusTitle"></h3>
    <p id="statusMessage"></p>
    <div class="login-buttons">
      <button id="statusOk">OK</button>
    </div>
  </div>
`;
document.body.appendChild(statusModal);

// --- Funkce pro zobrazení status modalu ---
function showStatus(title, message, callback) {
  document.getElementById('statusTitle').textContent = title;
  document.getElementById('statusMessage').textContent = message;
  statusModal.classList.remove('hidden');

  const okBtn = document.getElementById('statusOk');
  const closeHandler = () => {
    statusModal.classList.add('hidden');
    okBtn.removeEventListener('click', closeHandler);
    if (callback) callback();
  };
  okBtn.addEventListener('click', closeHandler);
}

// --- Funkce pro odblokování stránky po přihlášení ---
function unlockPage() {
  isLoggedIn = true;
  loginBtn.textContent = "🔓";
  pageContent.style.display = "";
  loginModal.classList.add('hidden');
  sessionStorage.setItem('isLoggedIn', 'true');
}

// --- Funkce pro odhlášení ---
function lockPage() {
  isLoggedIn = false;
  loginBtn.textContent = "🔒";
  pageContent.style.display = "none";
  sessionStorage.removeItem('isLoggedIn');
}

// --- Kontrola uloženého přihlášení při načtení ---
window.addEventListener('load', () => {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    unlockPage();
  } else {
    // --- uživatel není přihlášen → zobraz login modal ---
    loginModal.classList.remove('hidden');
    loginModal.querySelector('#loginPassword').focus();
  }
});

// --- Kliknutí na login/logout tlačítko ---
loginBtn.addEventListener('click', () => {
  if (isLoggedIn) {
    // --- tichý logout bez modalu ---
    lockPage();
  } else {
    // --- zobraz login modal ---
    loginModal.classList.remove('hidden');
    loginModal.querySelector('#loginPassword').value = "";
    loginModal.querySelector('#loginPassword').focus();
  }
});

// --- Cancel button ---
loginModal.querySelector('#loginCancel').addEventListener('click', () => {
  loginModal.classList.add('hidden');
});

// --- Submit button ---
loginModal.querySelector('#loginSubmit').addEventListener('click', async () => {
  const password = loginModal.querySelector('#loginPassword').value.trim();
  if (!password) {
    showStatus("Error", "Please enter a password.");
    return;
  }

  // --- TEST ADMIN PASSWORD ---
  if (password === "111213") {
    unlockPage();
    showStatus("Login successful", "Admin login successful (test mode).");
    return;
  }

  // --- Standard ESP check ---
  try {
    const res = await fetch('/checkPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      unlockPage();
      showStatus("Login successful", "Access granted.");
    } else {
      showStatus("Login failed", "Incorrect password.");
    }
  } catch (err) {
    showStatus("Connection error", "Cannot reach ESP device.");
    console.error(err);
  }
});

// --- Enter key submit ---
loginModal.querySelector('#loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginModal.querySelector('#loginSubmit').click();
  }
});

// --- Hover efekt login button ---
loginBtn.addEventListener('mouseenter', () => {
  loginBtn.title = isLoggedIn ? "Logout (click to log out)" : "Login to unlock content";
});
loginBtn.addEventListener('mouseleave', () => {
  loginBtn.title = "Login / Logout";
});
