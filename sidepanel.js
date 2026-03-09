const TOP_HOME_URL = 'https://site-one.com';
const BOTTOM_HOME_URL = 'https://site-two.com';
const TIMEOUT_MS = 12000;
const MIN_PANEL_HEIGHT = 100;

function createPanel(ids, homeUrl) {
  const frame = document.getElementById(ids.frame);
  const loader = document.getElementById(ids.loader);
  const loaderText = loader.querySelector('p');
  const error = document.getElementById(ids.error);
  const urlDisplay = document.getElementById(ids.url);

  const backBtn = document.getElementById(ids.back);
  const forwardBtn = document.getElementById(ids.forward);
  const refreshBtn = document.getElementById(ids.refresh);
  const homeBtn = document.getElementById(ids.home);
  const tabBtn = document.getElementById(ids.tab);
  const retryBtn = document.getElementById(ids.retry);
  const errorHomeBtn = document.getElementById(ids.errorHome);
  const errorTabBtn = document.getElementById(ids.errorTab);

  let currentUrl = homeUrl;
  let pendingUrl = homeUrl;
  let timeoutId = null;

  function clearLoadTimer() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function showLoader(text = 'Loading…') {
    loaderText.textContent = text;
    loader.classList.remove('hidden');
    error.classList.add('hidden');
  }

  function hideLoader() {
    loader.classList.add('hidden');
    clearLoadTimer();
  }

  function showError(message = 'Unable to load this page') {
    hideLoader();
    error.classList.remove('hidden');
    urlDisplay.textContent = `${message} (${currentUrl})`;
  }

  function startLoadTimer() {
    clearLoadTimer();
    timeoutId = setTimeout(() => {
      showError('Timed out after 12s');
    }, TIMEOUT_MS);
  }

  function normalizeUrl(url) {
    return new URL(url, currentUrl).toString();
  }

  function loadUrl(url, loaderMessage = 'Loading…') {
    try {
      currentUrl = normalizeUrl(url);
    } catch {
      showError('Invalid URL');
      return;
    }

    pendingUrl = currentUrl;
    urlDisplay.textContent = currentUrl;
    showLoader(loaderMessage);
    startLoadTimer();
    frame.src = currentUrl;
  }

  function openInTab() {
    chrome.tabs.create({ url: currentUrl });
  }

  frame.addEventListener('load', () => {
    hideLoader();
    try {
      const loadedHref = frame.contentWindow.location.href;
      if (loadedHref) {
        currentUrl = loadedHref;
      }
    } catch {
      currentUrl = pendingUrl || currentUrl;
    }
    urlDisplay.textContent = currentUrl;
    pendingUrl = null;
  });

  frame.addEventListener('error', () => {
    showError('Failed to load');
  });

  backBtn.addEventListener('click', () => {
    try {
      showLoader('Navigating back…');
      startLoadTimer();
      frame.contentWindow.history.back();
    } catch {
      showError('Cannot go back');
    }
  });

  forwardBtn.addEventListener('click', () => {
    try {
      showLoader('Navigating forward…');
      startLoadTimer();
      frame.contentWindow.history.forward();
    } catch {
      showError('Cannot go forward');
    }
  });

  refreshBtn.addEventListener('click', () => {
    loadUrl(currentUrl, 'Refreshing…');
  });

  homeBtn.addEventListener('click', () => {
    loadUrl(homeUrl, 'Opening home…');
  });

  tabBtn.addEventListener('click', openInTab);
  retryBtn.addEventListener('click', () => loadUrl(currentUrl, 'Retrying…'));
  errorHomeBtn.addEventListener('click', () => loadUrl(homeUrl, 'Opening home…'));
  errorTabBtn.addEventListener('click', openInTab);

  return {
    loadInitial() {
      loadUrl(homeUrl, 'Opening home…');
    },
  };
}

function setupResizer() {
  const resizer = document.getElementById('resizer');
  const topPanel = document.getElementById('panel-top');
  const bottomPanel = document.getElementById('panel-bottom');

  let isDragging = false;
  let startY = 0;
  let startTopHeight = 0;

  function onMouseMove(event) {
    if (!isDragging) {
      return;
    }

    const deltaY = event.clientY - startY;
    const totalHeight = document.body.clientHeight - resizer.offsetHeight;
    const proposedTopHeight = startTopHeight + deltaY;

    const nextTopHeight = Math.min(
      totalHeight - MIN_PANEL_HEIGHT,
      Math.max(MIN_PANEL_HEIGHT, proposedTopHeight)
    );

    topPanel.style.flex = 'none';
    topPanel.style.height = `${nextTopHeight}px`;
    bottomPanel.style.flex = '1';
  }

  function stopDragging() {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    resizer.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    document.body.style.cursor = '';

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopDragging);
  }

  resizer.addEventListener('mousedown', (event) => {
    isDragging = true;
    startY = event.clientY;
    startTopHeight = topPanel.getBoundingClientRect().height;

    resizer.classList.add('dragging');
    document.body.classList.add('is-dragging');
    document.body.style.cursor = 'ns-resize';

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDragging);
  });
}

const topPanel = createPanel(
  {
    frame: 'frame-top',
    loader: 'loader-top',
    error: 'error-top',
    url: 'url-top',
    back: 'back-top',
    forward: 'forward-top',
    refresh: 'refresh-top',
    home: 'home-top',
    tab: 'tab-top',
    retry: 'retry-top',
    errorHome: 'ehome-top',
    errorTab: 'etab-top',
  },
  TOP_HOME_URL
);

const bottomPanel = createPanel(
  {
    frame: 'frame-bottom',
    loader: 'loader-bottom',
    error: 'error-bottom',
    url: 'url-bottom',
    back: 'back-bottom',
    forward: 'forward-bottom',
    refresh: 'refresh-bottom',
    home: 'home-bottom',
    tab: 'tab-bottom',
    retry: 'retry-bottom',
    errorHome: 'ehome-bottom',
    errorTab: 'etab-bottom',
  },
  BOTTOM_HOME_URL
);

topPanel.loadInitial();
bottomPanel.loadInitial();
setupResizer();
