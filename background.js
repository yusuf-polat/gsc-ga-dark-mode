importScripts('defaults.js');

// Alt+Shift+D: genel karanlık mod anahtarını değiştir
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-dark-mode') return;
  const { enabled } = await chrome.storage.local.get({ enabled: GDM_DEFAULTS.enabled });
  await chrome.storage.local.set({ enabled: !enabled });
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') await chrome.storage.local.set(GDM_DEFAULTS);
  await syncCustomSites();
});

chrome.runtime.onStartup.addListener(syncCustomSites);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.customSites) syncCustomSites();
});

// Popup site ekledikten sonra sekmeyi yenilemeden önce kaydın bitmesini bekler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'gdm-sync') return;
  syncCustomSites().then(() => sendResponse(true), () => sendResponse(false));
  return true;
});

// İzin chrome://extensions üzerinden geri alınırsa kayıtları da temizle
chrome.permissions.onRemoved.addListener(syncCustomSites);
chrome.permissions.onAdded.addListener(syncCustomSites);

const originFor = (host) => `*://${host}/*`;

// Kullanıcının eklediği siteler için content script'leri dinamik olarak kaydet.
// Her seferinde hepsini silip izni olan siteleri yeniden kaydeder; liste küçük olduğu için yeterli.
let syncing = Promise.resolve();
function syncCustomSites() {
  syncing = syncing.then(doSync, doSync);
  return syncing;
}

async function doSync() {
  const { customSites } = await chrome.storage.local.get({ customSites: [] });
  const old = await chrome.scripting.getRegisteredContentScripts();
  if (old.length) {
    await chrome.scripting.unregisterContentScripts({ ids: old.map((s) => s.id) });
  }

  const allowed = [];
  for (const host of customSites) {
    if (await chrome.permissions.contains({ origins: [originFor(host)] })) allowed.push(host);
  }
  if (!allowed.length) return;

  const matches = allowed.map(originFor);
  await chrome.scripting.registerContentScripts([
    {
      id: 'gdm-custom-top',
      matches,
      css: ['dark.css'],
      js: ['defaults.js', 'content.js'],
      runAt: 'document_start',
      allFrames: false
    },
    {
      id: 'gdm-custom-frames',
      matches,
      js: ['defaults.js', 'frame.js'],
      runAt: 'document_start',
      allFrames: true,
      matchOriginAsFallback: true
    }
  ]);
}
