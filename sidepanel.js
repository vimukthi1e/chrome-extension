const HOME_URL = "https://your-site.com";
const LOAD_TIMEOUT_MS = 12000;

const frame = document.getElementById("main-frame");
const loader = document.getElementById("loader");
const errorScreen = document.getElementById("error-screen");
const urlDisplay = document.getElementById("url-display");

const btnBack = document.getElementById("btn-back");
const btnForward = document.getElementById("btn-forward");
const btnRefresh = document.getElementById("btn-refresh");
const btnHome = document.getElementById("btn-home");
const btnNewTab = document.getElementById("btn-newtab");
const btnRetry = document.getElementById("btn-retry");
const btnOpenTab = document.getElementById("btn-open-tab");

let loadTimer = null;
const historyStack = [HOME_URL];
let historyIndex = 0;

function normalizeUrl(url) {
  try {
    return new URL(url).toString();
  } catch {
    return HOME_URL;
  }
}

function currentUrl() {
  return historyStack[historyIndex] || HOME_URL;
}

function updateUrlDisplay(url) {
  urlDisplay.textContent = url;
  urlDisplay.title = url;
}

function updateNavState() {
  btnBack.disabled = historyIndex <= 0;
  btnForward.disabled = historyIndex >= historyStack.length - 1;
}

function showLoader() {
  clearTimeout(loadTimer);
  loader.classList.remove("hidden");
  errorScreen.classList.add("hidden");
  loadTimer = setTimeout(() => {
    showError();
  }, LOAD_TIMEOUT_MS);
}

function hideLoader() {
  clearTimeout(loadTimer);
  loader.classList.add("hidden");
}

function showError() {
  hideLoader();
  errorScreen.classList.remove("hidden");
}

function openInNewTab(url = currentUrl()) {
  chrome.tabs.create({ url });
}

function navigate(url, { pushHistory = true } = {}) {
  const normalized = normalizeUrl(url);

  if (pushHistory) {
    historyStack.splice(historyIndex + 1);
    historyStack.push(normalized);
    historyIndex = historyStack.length - 1;
  }

  updateNavState();
  updateUrlDisplay(normalized);
  showLoader();
  frame.src = normalized;
}

frame.addEventListener("load", () => {
  hideLoader();
  errorScreen.classList.add("hidden");
});

frame.addEventListener("error", () => {
  showError();
});

btnBack.addEventListener("click", () => {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  navigate(currentUrl(), { pushHistory: false });
});

btnForward.addEventListener("click", () => {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  navigate(currentUrl(), { pushHistory: false });
});

btnRefresh.addEventListener("click", () => {
  navigate(currentUrl(), { pushHistory: false });
});

btnHome.addEventListener("click", () => {
  navigate(HOME_URL);
});

btnNewTab.addEventListener("click", () => {
  openInNewTab();
});

btnRetry.addEventListener("click", () => {
  navigate(currentUrl(), { pushHistory: false });
});

btnOpenTab.addEventListener("click", () => {
  openInNewTab();
});

document.addEventListener("keydown", (event) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const mod = isMac ? event.metaKey : event.ctrlKey;

  if (event.altKey && event.key === "ArrowLeft") {
    event.preventDefault();
    btnBack.click();
    return;
  }

  if (event.altKey && event.key === "ArrowRight") {
    event.preventDefault();
    btnForward.click();
    return;
  }

  if (mod && (event.key === "r" || event.key === "R")) {
    event.preventDefault();
    btnRefresh.click();
    return;
  }

  if (mod && (event.key === "h" || event.key === "H")) {
    event.preventDefault();
    btnHome.click();
  }
});

updateNavState();
navigate(HOME_URL, { pushHistory: false });
