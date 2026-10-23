const $ = (id) => document.getElementById(id);
const SLIDERS = ['invert', 'contrast', 'brightness'];
const BUILTIN_SITES = ['gsc', 'ga', 'adsense', 'blogger', 'maps'];
// Eklentinin zaten desteklediği sayfalar özel site olarak eklenemez
const BUILTIN_HOSTS = [
  'search.google.com', 'analytics.google.com', 'adsense.google.com',
  'www.blogger.com', 'www.google.com'
];

let currentTab = null;
let currentHost = null;

function render(s) {
  $('enabled').checked = s.enabled;
  for (const site of BUILTIN_SITES) {
    $(`site-${site}`).checked = s.sites[site] !== false;
  }
  $('details').classList.toggle('disabled', !s.enabled);
  for (const key of SLIDERS) {
    $(key).value = s[key];
    $(`${key}-val`).textContent = `${s[key]}%`;
  }
  renderCustom(s);
}

function renderCustom(s) {
  const list = $('custom-list');
  list.replaceChildren();
  for (const host of s.customSites) {
    const row = document.createElement('div');
    row.className = 'row sub';

    const name = document.createElement('span');
    name.className = 'host';
    name.textContent = host;
    name.title = host;

    const toggle = document.createElement('label');
    toggle.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = s.sites[host] !== false;
    input.addEventListener('change', () => setSite(host, input.checked));
    toggle.append(input, document.createElement('i'));

    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.textContent = '×';
    remove.title = 'Kaldır';
    remove.addEventListener('click', () => removeSite(host));

    const actions = document.createElement('span');
    actions.className = 'actions';
    actions.append(toggle, remove);
    row.append(name, actions);
    list.append(row);
  }

  const canAddCurrent = currentHost && !s.customSites.includes(currentHost);
  $('add-current').hidden = !canAddCurrent;
  if (canAddCurrent) $('add-current').textContent = `+ ${currentHost} sitesini ekle`;
}

async function load() {
  const s = { ...GDM_DEFAULTS, ...(await chrome.storage.local.get(GDM_DEFAULTS)) };
  // İzni reddedilmiş veya chrome://extensions'tan geri alınmış siteleri listeden çıkar
  for (const host of s.customSites) {
    if (!(await chrome.permissions.contains({ origins: [`*://${host}/*`] }))) {
      await forgetSite(host);
      return load();
    }
  }
  render(s);
}

async function setSite(site, on) {
  const { sites } = await chrome.storage.local.get({ sites: GDM_DEFAULTS.sites });
  await chrome.storage.local.set({ sites: { ...sites, [site]: on } });
}

// "https://Ornek.com/yol" veya "ornek.com" -> "ornek.com"
function normalizeHost(input) {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(text) ? text : `https://${text}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    // Basit doğrulama: en az bir nokta veya localhost, boşluk/joker yok
    if (!/^([a-z0-9-]+\.)+[a-z0-9-]+$|^localhost$/.test(url.hostname)) return null;
    return url.hostname;
  } catch {
    return null;
  }
}

function showMessage(text) {
  $('msg').textContent = text;
}

// chrome.permissions.request kullanıcı hareketi içinde, herhangi bir await'ten
// önce çağrılmalı; bu yüzden bu fonksiyon senkron başlar.
function addSite(rawInput) {
  showMessage('');
  const host = normalizeHost(rawInput);
  if (!host) return showMessage('Geçersiz alan adı.');
  if (BUILTIN_HOSTS.includes(host)) return showMessage('Bu site zaten destekleniyor.');

  const request = chrome.permissions.request({ origins: [`*://${host}/*`] });
  // İzin penceresi açılınca popup kapanabilir ve request hiç dönmeyebilir. Bu yüzden
  // site hemen kaydedilir; background.js izin verildiğinde (permissions.onAdded)
  // script'leri kaydeder, izni olmayan siteleri ise atlar.
  const saved = saveSite(host);
  request.then(async (granted) => {
    await saved;
    if (!granted) {
      await forgetSite(host);
      return showMessage('İzin verilmedi, site eklenmedi.');
    }
    $('new-site').value = '';
    // Content script kaydı bitince, açık sekme bu siteyse yenile
    await chrome.runtime.sendMessage({ type: 'gdm-sync' });
    if (currentTab && currentHost === host) chrome.tabs.reload(currentTab.id);
    load();
  });
}

async function saveSite(host) {
  const { customSites, sites } = await chrome.storage.local.get({
    customSites: [],
    sites: GDM_DEFAULTS.sites
  });
  if (!customSites.includes(host)) customSites.push(host);
  await chrome.storage.local.set({ customSites, sites: { ...sites, [host]: true } });
}

async function forgetSite(host) {
  const { customSites, sites } = await chrome.storage.local.get({
    customSites: [],
    sites: GDM_DEFAULTS.sites
  });
  const { [host]: _, ...rest } = sites;
  await chrome.storage.local.set({ customSites: customSites.filter((h) => h !== host), sites: rest });
}

async function removeSite(host) {
  await forgetSite(host);
  await chrome.permissions.remove({ origins: [`*://${host}/*`] });
  load();
}

$('enabled').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  load();
});

for (const site of BUILTIN_SITES) {
  $(`site-${site}`).addEventListener('change', (e) => setSite(site, e.target.checked));
}

for (const key of SLIDERS) {
  $(key).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    $(`${key}-val`).textContent = `${value}%`;
    chrome.storage.local.set({ [key]: value }); // canlı önizleme
  });
}

$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  addSite($('new-site').value);
});

$('add-current').addEventListener('click', () => addSite(currentHost));

$('reset').addEventListener('click', async () => {
  // Eklenen siteler korunur, sadece görünüm ayarları sıfırlanır
  const { customSites, ...defaults } = GDM_DEFAULTS;
  await chrome.storage.local.set(defaults);
  load();
});

// activeTab sayesinde popup açıldığında aktif sekmenin adresi okunabilir
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  currentTab = tab || null;
  const host = tab?.url ? normalizeHost(tab.url) : null;
  currentHost = host && !BUILTIN_HOSTS.includes(host) ? host : null;
  load();
});

load();
