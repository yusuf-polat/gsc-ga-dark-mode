(() => {
  // Statik ve dinamik (özel site) kayıt aynı sayfaya iki kez enjekte edebilir
  if (window.__gdmContent) return;
  window.__gdmContent = true;

  const BUILTIN = {
    'search.google.com': 'gsc',
    'analytics.google.com': 'ga',
    'adsense.google.com': 'adsense',
    'www.blogger.com': 'blogger',
    'www.google.com': 'maps'
  }[location.hostname];
  // Ayar anahtarı: yerleşik sitelerde kısa ad, kullanıcının eklediği sitelerde hostname
  const SITE = BUILTIN || location.hostname;
  const SITE_ATTR = BUILTIN || 'custom';
  const root = document.documentElement;
  const vars = document.createElement('style');
  vars.id = 'gdm-vars';

  // Siteye özel CSS kuralları için (örn. Maps'te harita canvas'ı) hemen ayarlanır
  root.setAttribute('data-gdm-site', SITE_ATTR);

  let settings = GDM_DEFAULTS;

  const expectedState = () =>
    settings.enabled && settings.sites?.[SITE] !== false ? 'on' : 'off';

  function apply() {
    root.setAttribute('data-gdm', expectedState());
    if (root.getAttribute('data-gdm-site') !== SITE_ATTR) root.setAttribute('data-gdm-site', SITE_ATTR);
    vars.textContent =
      `html{--gdm-invert:${settings.invert / 100};` +
      `--gdm-contrast:${settings.contrast / 100};` +
      `--gdm-brightness:${settings.brightness / 100}}`;
    if (!vars.isConnected) (document.head || root).appendChild(vars);
  }

  chrome.storage.local.get(GDM_DEFAULTS, (stored) => {
    settings = { ...GDM_DEFAULTS, ...stored };
    apply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      settings[key] = newValue ?? GDM_DEFAULTS[key];
    }
    apply();
  });

  // Uygulama <html> özniteliklerini veya <style> etiketimizi silerse geri koy
  new MutationObserver(() => {
    if (root.getAttribute('data-gdm') !== expectedState() ||
        root.getAttribute('data-gdm-site') !== SITE_ATTR ||
        !vars.isConnected) apply();
  }).observe(root, {
    attributes: true,
    attributeFilter: ['data-gdm', 'data-gdm-site'],
    childList: true,
    subtree: true
  });
})();
