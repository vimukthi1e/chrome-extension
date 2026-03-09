const HOME_URL = 'https://your-site.com';
const LOAD_TIMEOUT_MS = 12000;

const frame = document.getElementById('main-frame');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const errorScreen = document.getElementById('error-screen');
const urlDisplay = document.getElementById('url-display');

const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnRefresh = document.getElementById('btn-refresh');
const btnHome = document.getElementById('btn-home');
const btnOpenTab = document.getElementById('btn-open-tab');
const btnRetry = document.getElementById('btn-retry');
const btnErrorHome = document.getElementById('btn-error-home');
const btnErrorOpenTab = document.getElementById('btn-error-open-tab');

let currentUrl = HOME_URL;
let timeoutId = null;
let pendingUrl = null;

function setLoadingState(isLoading, text = 'Loading…') {
  loaderText.textContent = text;
  loader.classList.toggle('hidden', !isLoading);
}

function clearLoadTimeout() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function showError(message = 'Unable to load this page.') {
  setLoadingState(false);
  errorScreen.classList.remove('hidden');
  urlDisplay.textContent = `${message} (${currentUrl})`;
}

function hideError() {
  errorScreen.classList.add('hidden');
}

function scheduleLoadTimeout() {
  clearLoadTimeout();
  timeoutId = setTimeout(() => {
    showError('Load timed out after 12s');
  }, LOAD_TIMEOUT_MS);
}

function updateControls() {
  btnBack.disabled = errorScreen.classList.contains('hidden') === false;
  btnForward.disabled = errorScreen.classList.contains('hidden') === false;
}

function normalizeUrl(url) {
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, currentUrl).toString();
  }
}

function loadUrl(url, reason = 'Loading…') {
  const safeUrl = normalizeUrl(url);
  pendingUrl = safeUrl;
  currentUrl = safeUrl;
  urlDisplay.textContent = safeUrl;
  hideError();
  setLoadingState(true, reason);
  scheduleLoadTimeout();
  frame.src = safeUrl;
}

function openCurrentInTab() {
  chrome.tabs.create({ url: currentUrl });
}

frame.addEventListener('load', () => {
  clearLoadTimeout();
  setLoadingState(false);

  try {
    const loadedUrl = frame.contentWindow.location.href;
    if (loadedUrl) {
      currentUrl = loadedUrl;
      urlDisplay.textContent = loadedUrl;
    }
  } catch {
    if (pendingUrl) {
      urlDisplay.textContent = pendingUrl;
    }
  }

  pendingUrl = null;
  updateControls();
});

frame.addEventListener('error', () => {
  clearLoadTimeout();
  showError('Page failed to load');
  updateControls();
});

btnBack.addEventListener('click', () => {
  try {
    setLoadingState(true, 'Navigating back…');
    scheduleLoadTimeout();
    frame.contentWindow.history.back();
  } catch {
    showError('Cannot navigate back for this page');
  }
});

btnForward.addEventListener('click', () => {
  try {
    setLoadingState(true, 'Navigating forward…');
    scheduleLoadTimeout();
    frame.contentWindow.history.forward();
  } catch {
    showError('Cannot navigate forward for this page');
  }
});

btnRefresh.addEventListener('click', () => {
  loadUrl(currentUrl, 'Refreshing…');
});

btnHome.addEventListener('click', () => {
  loadUrl(HOME_URL, 'Opening home…');
});

btnOpenTab.addEventListener('click', openCurrentInTab);
btnRetry.addEventListener('click', () => loadUrl(currentUrl, 'Retrying…'));
btnErrorHome.addEventListener('click', () => loadUrl(HOME_URL, 'Opening home…'));
btnErrorOpenTab.addEventListener('click', openCurrentInTab);

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    btnBack.click();
    return;
  }

  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault();
    btnForward.click();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    btnRefresh.click();
    return;
  }

  if (event.altKey && event.key.toLowerCase() === 'h') {
    event.preventDefault();
    btnHome.click();
  }
});

loadUrl(HOME_URL, 'Opening home…');
