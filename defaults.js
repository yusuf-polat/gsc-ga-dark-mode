// Ortak varsayılan ayarlar (content script, popup ve background tarafından kullanılır).
// `var`: aynı sayfaya iki content script girdisiyle iki kez enjekte edilebilir.
var GDM_DEFAULTS = {
  enabled: true,
  sites: { gsc: true, ga: true, adsense: true, blogger: true, maps: true },
  invert: 92,      // %  — 100 = tam siyah zemin
  contrast: 95,    // %
  brightness: 100, // %
  customSites: []  // kullanıcının eklediği hostname'ler (ör. "example.com")
};
