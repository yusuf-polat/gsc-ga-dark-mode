// iframe'ler için karanlık mod.
// Üst sayfa iframe'leri tekrar ters çevirir (dark.css), yani iframe kendi doğal
// renkleriyle görünür. Bu script iframe'in içinde çalışır ve karar verir:
//  - Zemin açıksa (veya şeffafsa) -> kendini ters çevirerek karartır
//  - Zemin zaten koyuysa (Google'ın kendi koyu teması) -> dokunmaz
//  - Harita iframe'iyse -> dokunmaz, harita doğal renkte kalır
(() => {
  if (window.top === window) return;
  // Statik ve dinamik (özel site) kayıt aynı iframe'e iki kez enjekte edebilir
  if (window.__gdmFrame) return;
  window.__gdmFrame = true;

  const TOP_SITES = {
    'search.google.com': 'gsc',
    'analytics.google.com': 'ga',
    'adsense.google.com': 'adsense',
    'www.blogger.com': 'blogger'
  };
  const ancestors = location.ancestorOrigins;
  if (!ancestors || !ancestors.length) return;
  let topHost;
  try { topHost = new URL(ancestors[ancestors.length - 1]).hostname; } catch { return; }
  const isMapFrame =
    location.hostname === 'maps.google.com' ||
    (/^(www\.)?google\.com$/.test(location.hostname) && location.pathname.startsWith('/maps'));
  if (isMapFrame) return;

  const root = document.documentElement;
  const style = document.createElement('style');
  style.id = 'gdm-frame';

  let settings = GDM_DEFAULTS;

  // Kullanıcının eklediği siteler ancak ayarlar okununca belli olur
  const currentSite = () =>
    TOP_SITES[topHost] || (settings.customSites?.includes(topHost) ? topHost : null);

  function css(s) {
    const on = 'html[data-gdm-frame="on"]';
    const flip = 'filter: invert(1) hue-rotate(180deg) !important;';
    return `
${on} {
  filter: invert(${s.invert / 100}) hue-rotate(180deg)
          contrast(${s.contrast / 100}) brightness(${s.brightness / 100}) !important;
}
${on} img, ${on} video, ${on} iframe,
${on} [style*="background-image: url"], ${on} [style*="background-image:url"] { ${flip} }
${on} [style*="background-image"] img { filter: none !important; }`;
  }

  function parseColor(str) {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  }

  // Zemin koyu mu? Şeffaf zemin açık kabul edilir (metin açık zemin için yazılmıştır).
  function pageIsDark() {
    for (const el of [document.body, root]) {
      if (!el) continue;
      const c = parseColor(getComputedStyle(el).backgroundColor);
      if (!c || c.a < 0.5) continue;
      const lum = (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
      return lum < 0.45;
    }
    return false;
  }

  function apply() {
    const site = currentSite();
    if (!site && !style.isConnected) return;
    const enabled = !!site && settings.enabled && settings.sites?.[site] !== false;
    const on = enabled && document.body && !pageIsDark();
    root.setAttribute('data-gdm-frame', on ? 'on' : 'off');
    style.textContent = css(settings);
    if (!style.isConnected) (document.head || root).appendChild(style);
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

  // Zemin rengi ancak DOM/CSS yüklenince belli olur; SPA iframe'leri için sonradan bir kez daha bak
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', () => { apply(); setTimeout(apply, 1500); });
})();
