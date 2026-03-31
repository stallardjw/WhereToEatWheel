/* ============================================================
   WHERE WE EATING? — Application Logic
   ============================================================ */

// ── Wheel colour palette ──
const COLORS = [
  '#1a8fe8', '#ff6b3d', '#20c472', '#f7c948', '#e040a0',
  '#00bcd4', '#8bc34a', '#ff9800', '#9c27b0', '#e91e63',
  '#3f51b5', '#4caf50',
];

let restaurants = ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Thai', 'Italian'];
let spinning     = false;
let currentAngle = 0;

const canvas  = document.getElementById('wheelCanvas');
const ctx     = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('resultText');

// ── Helpers ──────────────────────────────────────────────────

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ── Wheel drawing ────────────────────────────────────────────

function drawWheel(angle) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const r  = cx - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (restaurants.length === 0) {
    ctx.fillStyle = getCSSVar('--canvas-empty');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle    = getCSSVar('--canvas-empty-text');
    ctx.font         = '500 16px DM Sans';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add restaurants →', cx, cy);
    return;
  }

  const slice       = (2 * Math.PI) / restaurants.length;
  const strokeColor = getCSSVar('--canvas-stroke');
  const labelColor  = getCSSVar('--canvas-label');
  const capColor    = getCSSVar('--canvas-cap');
  const capStroke   = getCSSVar('--canvas-cap-stroke');

  restaurants.forEach((name, i) => {
    const start = angle + i * slice;
    const end   = start + slice;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle   = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = labelColor;
    ctx.font         = `600 ${Math.min(14, 100 / restaurants.length + 8)}px DM Sans`;

    const maxW = r * 0.72;
    let label  = name;
    ctx.save();
    while (ctx.measureText(label).width > maxW && label.length > 3) {
      label = label.slice(0, -1);
    }
    if (label !== name) label = label.slice(0, -1) + '…';
    ctx.restore();

    ctx.fillText(label, r - 12, 0);
    ctx.restore();
  });

  // Centre cap
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle   = capColor;
  ctx.fill();
  ctx.strokeStyle = capStroke;
  ctx.lineWidth   = 3;
  ctx.stroke();
}

// ── Spin animation ───────────────────────────────────────────

function spin() {
  if (spinning || restaurants.length < 2) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.classList.remove('show');

  const extraSpins = 6 + Math.random() * 6;
  const stopAngle  = Math.random() * Math.PI * 2;
  const totalRad   = extraSpins * Math.PI * 2 + stopAngle;
  const duration   = 3500 + Math.random() * 1500;
  const startTime  = performance.now();
  const startAngle = currentAngle;

  const easeOut = t => 1 - Math.pow(1 - t, 4);

  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    currentAngle = startAngle + totalRad * easeOut(t);
    drawWheel(currentAngle);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      showResult();
    }
  }

  requestAnimationFrame(frame);
}

function showResult() {
  const slice = (2 * Math.PI) / restaurants.length;
  const norm  = ((-currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const idx   = Math.floor(norm / slice) % restaurants.length;
  resultEl.textContent = '🎉 ' + restaurants[idx] + '!';
  resultEl.classList.add('show');
}

// ── Restaurant list management ───────────────────────────────

function renderList() {
  const list = document.getElementById('list');
  if (restaurants.length === 0) {
    list.innerHTML = '<p class="empty-hint">No restaurants yet — add some above!</p>';
  } else {
    list.innerHTML = restaurants.map((r, i) => `
      <div class="item">
        <span class="item-dot" style="background:${COLORS[i % COLORS.length]}"></span>
        <span class="item-name" title="${r}">${r}</span>
        <button class="del-btn" onclick="removeItem(${i})" title="Remove">✕</button>
      </div>
    `).join('');
  }
  drawWheel(currentAngle);
}

function addItem() {
  const input = document.getElementById('nameInput');
  const val   = input.value.trim();
  if (!val) return;
  restaurants.push(val);
  input.value = '';
  renderList();
  resultEl.classList.remove('show');
}

function removeItem(i) {
  restaurants.splice(i, 1);
  renderList();
  resultEl.classList.remove('show');
}

// ── Theme toggle ─────────────────────────────────────────────

let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  document.getElementById('themeIcon').textContent  = isDark ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = isDark ? 'Light mode' : 'Dark mode';
  // Small delay so CSS variables update before the canvas redraws
  setTimeout(() => drawWheel(currentAngle), 20);
}

// ── Nearby finder ────────────────────────────────────────────

let nearbyPlaces = [];

function switchTab(tab) {
  const isGps = tab === 'gps';
  document.getElementById('panelGps').style.display = isGps ? '' : 'none';
  document.getElementById('panelZip').style.display = isGps ? 'none' : '';
  document.getElementById('tabGps').classList.toggle('active',  isGps);
  document.getElementById('tabZip').classList.toggle('active', !isGps);
  document.getElementById('nearbyStatus').textContent  = '';
  document.getElementById('nearbyResults').innerHTML   = '';
  document.getElementById('addAllRow').style.display   = 'none';
  nearbyPlaces = [];
}

function findNearbyGps() {
  const statusEl = document.getElementById('nearbyStatus');
  const btn      = document.getElementById('findBtn');

  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation not supported — try the ZIP code tab.';
    statusEl.className   = 'nearby-status error';
    return;
  }

  btn.disabled         = true;
  statusEl.textContent = 'Getting your location…';
  statusEl.className   = 'nearby-status loading';

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const miles = parseFloat(document.getElementById('milesInput').value) || 5;
      await searchNearCoords(pos.coords.latitude, pos.coords.longitude, miles);
      btn.disabled = false;
    },
    err => {
      statusEl.textContent = err.code === 1
        ? 'Location access denied. Try the ZIP code tab instead.'
        : 'Could not get your location. Try the ZIP code tab.';
      statusEl.className = 'nearby-status error';
      btn.disabled = false;
    },
    { timeout: 10000 },
  );
}

async function findNearbyZip() {
  const zip      = document.getElementById('zipInput').value.trim();
  const miles    = parseFloat(document.getElementById('milesInput2').value) || 5;
  const statusEl = document.getElementById('nearbyStatus');
  const btn      = document.getElementById('findBtnZip');

  if (!zip) {
    statusEl.textContent = 'Please enter a ZIP code.';
    statusEl.className   = 'nearby-status error';
    return;
  }

  btn.disabled         = true;
  statusEl.textContent = `Looking up ZIP code ${zip}…`;
  statusEl.className   = 'nearby-status loading';
  document.getElementById('nearbyResults').innerHTML  = '';
  document.getElementById('addAllRow').style.display  = 'none';
  nearbyPlaces = [];

  try {
    // Nominatim geocoding — free, no API key required
    const geoRes  = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&countrycodes=us&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const geoData = await geoRes.json();

    if (!geoData.length) {
      statusEl.textContent = `ZIP code "${zip}" not found. Double-check and try again.`;
      statusEl.className   = 'nearby-status error';
      btn.disabled = false;
      return;
    }

    const lat   = parseFloat(geoData[0].lat);
    const lon   = parseFloat(geoData[0].lon);
    const place = geoData[0].display_name.split(',').slice(0, 2).join(',');
    statusEl.textContent = `Searching near ${place}…`;

    await searchNearCoords(lat, lon, miles);
  } catch {
    statusEl.textContent = 'Could not look up ZIP code. Check your connection.';
    statusEl.className   = 'nearby-status error';
  }

  btn.disabled = false;
}

async function searchNearCoords(lat, lon, miles) {
  const statusEl    = document.getElementById('nearbyStatus');
  const addAllRow   = document.getElementById('addAllRow');
  const radiusMeters = Math.round(miles * 1609.34);

  try {
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
        node["amenity"="fast_food"](around:${radiusMeters},${lat},${lon});
        node["amenity"="cafe"]["cuisine"](around:${radiusMeters},${lat},${lon});
      );
      out body;
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!res.ok) throw new Error('Overpass API error');

    const data = await res.json();
    nearbyPlaces = (data.elements || [])
      .filter(e => e.tags && e.tags.name)
      .map(e => ({
        name:    e.tags.name,
        cuisine: e.tags.cuisine || '',
        dist:    haversine(lat, lon, e.lat, e.lon),
      }))
      .filter((v, i, arr) => arr.findIndex(x => x.name === v.name) === i) // dedupe
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 40);

    if (nearbyPlaces.length === 0) {
      statusEl.textContent = `No restaurants found within ${miles} miles. Try a larger radius.`;
      statusEl.className   = 'nearby-status error';
    } else {
      statusEl.textContent = `Found ${nearbyPlaces.length} restaurant${nearbyPlaces.length !== 1 ? 's' : ''} within ${miles} miles`;
      statusEl.className   = 'nearby-status';
      renderNearby();
      addAllRow.style.display = 'flex';
    }
  } catch {
    statusEl.textContent = 'Could not fetch restaurants. Check your internet connection.';
    statusEl.className   = 'nearby-status error';
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R    = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderNearby() {
  document.getElementById('nearbyResults').innerHTML = nearbyPlaces.map((p, i) => {
    const alreadyOn = restaurants.includes(p.name);
    return `
      <div class="nearby-item" id="nearby-item-${i}">
        <div class="nearby-item-info">
          <div class="nearby-item-name" title="${p.name}">${p.name}</div>
          <div class="nearby-item-dist">${p.dist.toFixed(1)} mi${p.cuisine ? ' · ' + p.cuisine.replace(/_/g, ' ') : ''}</div>
        </div>
        <button class="add-nearby-btn ${alreadyOn ? 'added' : ''}"
                id="nearby-btn-${i}"
                onclick="addNearbyOne(${i})"
                ${alreadyOn ? 'disabled' : ''}>
          ${alreadyOn ? '✓ Added' : '+ Add'}
        </button>
      </div>
    `;
  }).join('');
}

function addNearbyOne(i) {
  const place = nearbyPlaces[i];
  if (!place || restaurants.includes(place.name)) return;
  restaurants.push(place.name);
  renderList();
  resultEl.classList.remove('show');
  const btn = document.getElementById(`nearby-btn-${i}`);
  if (btn) { btn.textContent = '✓ Added'; btn.classList.add('added'); btn.disabled = true; }
}

function addAllNearby() {
  nearbyPlaces.forEach((p, i) => {
    if (!restaurants.includes(p.name)) {
      restaurants.push(p.name);
      const btn = document.getElementById(`nearby-btn-${i}`);
      if (btn) { btn.textContent = '✓ Added'; btn.classList.add('added'); btn.disabled = true; }
    }
  });
  renderList();
  resultEl.classList.remove('show');
}

// ── Canvas resize observer ───────────────────────────────────

const resizeObserver = new ResizeObserver(() => {
  const size = canvas.getBoundingClientRect();
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width  = size.width;
    canvas.height = size.height;
    drawWheel(currentAngle);
  }
});
resizeObserver.observe(canvas);

// ── Init ─────────────────────────────────────────────────────
renderList();
