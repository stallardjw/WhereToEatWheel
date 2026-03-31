/* ============================================================
   WHERE WE EATING? — Storage
   Cookie consent is required before any data is persisted.
   If declined, the app works but nothing is saved.
   ============================================================ */

const CONSENT_KEY = 'weating_consent';

// ── Consent state ─────────────────────────────────────────────

function hasConsent() {
  return document.cookie.split(';').some(c => c.trim() === `${CONSENT_KEY}=yes`);
}

function hasDeclined() {
  return document.cookie.split(';').some(c => c.trim() === `${CONSENT_KEY}=no`);
}

function setConsent(granted) {
  const val     = granted ? 'yes' : 'no';
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CONSENT_KEY}=${val}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── UID cookie ────────────────────────────────────────────────

function getOrCreateUid() {
  const existing = document.cookie.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('weating_uid='));

  if (existing) return existing.split('=')[1];

  const uid     = crypto.randomUUID();
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `weating_uid=${uid}; expires=${expires}; path=/; SameSite=Lax`;
  return uid;
}

// Only create a UID if consent has been given
const UID = hasConsent() ? getOrCreateUid() : null;

// ── Storage keys ──────────────────────────────────────────────

function keys() {
  const id = UID || getOrCreateUid();
  return {
    restaurants: `weating_${id}_restaurants`,
    theme:       `weating_${id}_theme`,
  };
}

// ── Save ──────────────────────────────────────────────────────

function saveRestaurants(list) {
  if (!hasConsent()) return;
  try { localStorage.setItem(keys().restaurants, JSON.stringify(list)); }
  catch (e) { console.warn('Could not save restaurants:', e); }
}

function saveTheme(isDark) {
  if (!hasConsent()) return;
  try { localStorage.setItem(keys().theme, isDark ? 'dark' : 'light'); }
  catch (e) { console.warn('Could not save theme:', e); }
}

// ── Load ──────────────────────────────────────────────────────

const DEFAULT_RESTAURANTS = ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Thai', 'Italian'];

function loadRestaurants() {
  if (!hasConsent()) return [...DEFAULT_RESTAURANTS];
  try {
    const raw = localStorage.getItem(keys().restaurants);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.warn('Could not load restaurants:', e); }
  return [...DEFAULT_RESTAURANTS];
}

function loadTheme() {
  if (!hasConsent()) return 'dark';
  try { return localStorage.getItem(keys().theme) || 'dark'; }
  catch (e) { return 'dark'; }
}

// ── Clear all stored data ─────────────────────────────────────

function clearAllData() {
  try {
    const k = keys();
    localStorage.removeItem(k.restaurants);
    localStorage.removeItem(k.theme);
  } catch (e) { console.warn('Could not clear data:', e); }
}

// ── Cookie banner logic ───────────────────────────────────────

function initCookieBanner() {
  if (hasConsent() || hasDeclined()) return; // already decided
  document.getElementById('cookieBanner').classList.add('visible');
}

function acceptCookies() {
  setConsent(true);
  document.getElementById('cookieBanner').classList.remove('visible');
  // Now that consent is given, save current state
  if (typeof restaurants !== 'undefined') saveRestaurants(restaurants);
  if (typeof isDark !== 'undefined') saveTheme(isDark);
}

function declineCookies() {
  setConsent(false);
  document.getElementById('cookieBanner').classList.remove('visible');
}

function showCookiePolicy() {
  document.getElementById('cookieModal').style.display = 'flex';
}

function closeCookiePolicy() {
  document.getElementById('cookieModal').style.display = 'none';
}

function openCookieSettings() {
  // Re-show the banner so they can change their choice
  document.getElementById('cookieBanner').classList.add('visible');
  // Reset consent cookie so they can re-decide
  document.cookie = `${CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ── Expose functions to global scope for inline onclick handlers ──
window.acceptCookies      = acceptCookies;
window.declineCookies     = declineCookies;
window.showCookiePolicy   = showCookiePolicy;
window.closeCookiePolicy  = closeCookiePolicy;
window.openCookieSettings = openCookieSettings;

window.loadRestaurants  = loadRestaurants;
window.loadTheme        = loadTheme;
window.saveRestaurants  = saveRestaurants;
window.saveTheme        = saveTheme;
window.clearAllData     = clearAllData;
window.initCookieBanner = initCookieBanner;
