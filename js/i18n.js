// ÉTRAVE – translations (English, French, Arabic) and language switching.
//
// Static text is marked in the HTML with:
//   data-i18n="key"        → textContent
//   data-i18n-html="key"   → innerHTML (trusted strings from this file only)
//   data-i18n-attr="attr:key;attr:key" → attributes (aria-label, title, …)
// The document title uses <html data-title-key="key">.

export const LANGS = {
  en: { label: 'EN', name: 'English', dir: 'ltr', locale: 'en-GB' },
  fr: { label: 'FR', name: 'Français', dir: 'ltr', locale: 'fr-FR' },
  ar: { label: 'ع', name: 'العربية', dir: 'rtl', locale: 'en-GB' }, // Western digits, as in Algerian technical documents
};

const STORAGE_KEY = 'etrave.lang';

// key: [English, French, Arabic]
const D = {
  // ---- Common ----
  'brand.home': ['ÉTRAVE home', 'Accueil ÉTRAVE', 'الصفحة الرئيسية لـ ÉTRAVE'],
  'brand.tag': ['PRELIMINARY SHIP DESIGN', 'AVANT-PROJET NAVAL', 'التصميم الأولي للسفن'],
  'nav.aria': ['Main', 'Navigation principale', 'القائمة الرئيسية'],
  'nav.platform': ['Platform', 'Plateforme', 'المنصة'],
  'nav.workflow': ['Workflow', 'Fonctionnement', 'طريقة العمل'],
  'nav.mcp': ['MCP', 'MCP', 'MCP'],
  'nav.roadmap': ['Roadmap', 'Feuille de route', 'خارطة الطريق'],
  'cta.suggest': ['Suggest a feature', 'Proposer une fonctionnalité', 'اقترح ميزة'],
  'lang.aria': ['Language', 'Langue', 'اللغة'],
  'footer.note': ['Preliminary results only. Not valid for construction or approval.', 'Résultats préliminaires uniquement. Non valables pour la construction ni pour l’approbation.', 'نتائج أولية فقط، لا تصلح للبناء ولا للمصادقة.'],

  // ---- Home ----
  'home.title': ['ÉTRAVE – Preliminary Ship Design', 'ÉTRAVE – Avant-projet naval', 'ÉTRAVE – التصميم الأولي للسفن'],
  'home.eyebrow': ['In development', 'En développement', 'قيد التطوير'],
  'home.h1': ['From the client’s brief to a <span class="accent">preliminary design</span>, in minutes.', 'Du cahier des charges du client à l’<span class="accent">avant-projet</span>, en quelques minutes.', 'من طلب العميل إلى <span class="accent">التصميم الأولي</span> في دقائق.'],
  'home.lead': ['Describe the vessel in plain language. ÉTRAVE generates the hull form, hydrostatics, preliminary scantlings and a construction cost estimate, through the Model Context Protocol.', 'Décrivez le navire en langage courant : ÉTRAVE génère la carène, l’hydrostatique, l’échantillonnage préliminaire et une estimation du coût de construction, via le Model Context Protocol.', 'صِف القارب بلغة عادية، فتولّد ÉTRAVE شكل البدن والحسابات الهيدروستاتيكية والأبعاد الإنشائية الأولية وتقديرًا لتكلفة البناء، عبر بروتوكول Model Context Protocol.'],
  'home.how': ['See how it works', 'Voir le fonctionnement', 'كيف تعمل المنصة'],
  'spec.rules': ['Rules', 'Règlement', 'القواعد'],
  'spec.resistance': ['Resistance', 'Résistance', 'المقاومة'],
  'spec.savitsky': ['Savitsky method', 'Méthode de Savitsky', 'طريقة Savitsky'],
  'spec.costing': ['Costing', 'Coûts', 'التكلفة'],
  'spec.dzd': ['Estimates in DZD', 'Estimation en DZD', 'تقدير بالدينار الجزائري'],
  'app.sample': ['Sample output', 'Exemple de résultat', 'مثال على النتائج'],
  'app.title': ['Preliminary design <span class="sep">/</span> <span class="muted">12 m trawler</span>', 'Avant-projet <span class="sep">/</span> <span class="muted">chalutier de 12 m</span>', 'التصميم الأولي <span class="sep">/</span> <span class="muted">سفينة صيد بالجر 12 م</span>'],
  'app.prompt': ['Trawler, 12 m, design category B, GRP, 10 knots', 'Chalutier, 12 m, catégorie de conception B, CVR, 10 nœuds', 'سفينة صيد بالجر، 12 م، فئة التصميم B، ألياف زجاجية، 10 عقد'],
  'tabs.aria': ['Drawing views', 'Vues du plan', 'عروض المخطط'],
  'tab.profile': ['Profile', 'Profil', 'المقطع الجانبي'],
  'tab.body': ['Body plan', 'Plan des couples', 'مخطط المقاطع'],
  'tab.3d': ['3D view', 'Vue 3D', 'عرض ثلاثي الأبعاد'],
  'tab.soon': ['Coming soon', 'Bientôt disponible', 'قريبًا'],
  'cap.profile': ['Lines plan · Profile', 'Plan des formes · Profil', 'مخطط الخطوط · المقطع الجانبي'],
  'cap.scale': ['Scale 1:50 · Rev. A', 'Échelle 1:50 · Rév. A', 'المقياس 1:50 · المراجعة A'],
  'cap.body': ['Body plan · Aft (left) / Fwd (right)', 'Plan des couples · AR (gauche) / AV (droite)', 'مخطط المقاطع · الخلف (يسار) / الأمام (يمين)'],
  'm.lwl': ['LWL', 'LWL', 'LWL'],
  'm.beam': ['Beam', 'Bau', 'العرض'],
  'm.draught': ['Draught', 'Tirant d’eau', 'الغاطس'],
  'm.disp': ['Displacement', 'Déplacement', 'الإزاحة'],
  'm.froude': ['Froude no.', 'Nombre de Froude', 'عدد فرود'],
  'm.power': ['Power', 'Puissance', 'القدرة'],
  'm.bottom': ['Bottom plating', 'Bordé de fond', 'ألواح القاع'],
  'm.cost': ['Est. cost', 'Coût estimé', 'التكلفة التقديرية'],
  'features.aria': ['Capabilities', 'Fonctionnalités', 'القدرات'],
  'f1.h': ['Parametric hull form', 'Carène paramétrique', 'بدن بارامتري'],
  'f1.p': ['Hard chine or round bilge, with a lines plan and a 3D view.', 'Bouchain vif ou forme ronde, avec plan des formes et vue 3D.', 'بزاوية حادة أو قاع مستدير، مع مخطط الخطوط وعرض ثلاثي الأبعاد.'],
  'f2.h': ['Hydrostatics', 'Hydrostatique', 'الحسابات الهيدروستاتيكية'],
  'f2.p': ['Displacement, LCB, KB, BM and an initial GM estimate.', 'Déplacement, LCB, KB, BM et une première estimation du GM.', 'الإزاحة وLCB وKB وBM وتقدير أولي لـ GM.'],
  'f3.h': ['Preliminary scantlings', 'Échantillonnage préliminaire', 'الأبعاد الإنشائية الأولية'],
  'f3.p': ['Design loads, plating and stiffeners in accordance with Bureau Veritas rules.', 'Charges de calcul, bordés et raidisseurs selon les règles du Bureau Veritas.', 'أحمال التصميم والألواح والمقويات وفق قواعد Bureau Veritas.'],
  'f4.h': ['Weight and cost', 'Masse et coût', 'الوزن والتكلفة'],
  'f4.p': ['Weight estimate, cost in DZD and a PDF report for the client.', 'Devis de masse, coût en DZD et rapport PDF pour le client.', 'تقدير الوزن والتكلفة بالدينار الجزائري وتقرير PDF للعميل.'],
  'mcp.h': ['Your AI assistant, connected to real naval architecture tools.', 'Votre assistant IA, connecté à de vrais outils d’architecture navale.', 'مساعدك الذكي متصل بأدوات حقيقية للهندسة البحرية.'],
  'mcp.lead': ['ÉTRAVE exposes its calculations as MCP tools. An assistant reads the brief, calls the hull generator, the hydrostatics solver and the scantling module, and returns a consistent preliminary design that the engineer reviews and validates.', 'ÉTRAVE expose ses calculs sous forme d’outils MCP. L’assistant lit le cahier des charges, appelle le générateur de carène, le calcul hydrostatique et le module d’échantillonnage, puis restitue un avant-projet cohérent que l’ingénieur vérifie et valide.', 'تتيح ÉTRAVE حساباتها في شكل أدوات MCP. يقرأ المساعد طلب العميل، ويستدعي مولّد البدن وحاسب الهيدروستاتيك ووحدة الأبعاد الإنشائية، ثم يقدّم تصميمًا أوليًا متناسقًا يراجعه المهندس ويصادق عليه.'],
  's1.h': ['Brief', 'Cahier des charges', 'الطلب'],
  's1.p': ['The client’s requirements, in plain language.', 'Les exigences du client, en langage courant.', 'متطلبات العميل بلغة عادية.'],
  's2.h': ['Generate', 'Génération', 'التوليد'],
  's2.p': ['Hull form, hydrostatics and propulsion power.', 'Carène, hydrostatique et puissance propulsive.', 'شكل البدن والهيدروستاتيك وقدرة الدفع.'],
  's3.h': ['Check', 'Vérification', 'التحقق'],
  's3.p': ['Preliminary scantlings and weight estimate.', 'Échantillonnage préliminaire et devis de masse.', 'الأبعاد الإنشائية الأولية وتقدير الوزن.'],
  's4.h': ['Report', 'Rapport', 'التقرير'],
  's4.p': ['A PDF with drawings, results and cost.', 'Un PDF avec plans, résultats et coût.', 'ملف PDF يضم المخططات والنتائج والتكلفة.'],
  'road.eyebrow': ['Roadmap', 'Feuille de route', 'خارطة الطريق'],
  'road.h': ['Built with the naval architects who will use it.', 'Conçu avec les architectes navals qui l’utiliseront.', 'نبنيه مع المهندسين البحريين الذين سيستخدمونه.'],
  'road.lead': ['The platform is in development. Suggestions from practising engineers shape what comes next; contributors are credited on the project page.', 'La plateforme est en développement. Les suggestions des ingénieurs en exercice orientent la suite ; les contributeurs sont cités sur la page du projet.', 'المنصة قيد التطوير، واقتراحات المهندسين الممارسين هي التي تحدد خطواتها القادمة، مع ذكر أسماء المساهمين في صفحة المشروع.'],

};

let current = detect();
const listeners = new Set();

function detect() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q && LANGS[q]) return q;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGS[nav] ? nav : 'en';
}

const index = (lang) => ({ en: 0, fr: 1, ar: 2 }[lang] ?? 0);

export const getLang = () => current;

/** Translate a key, with {placeholders}. Falls back to English, then to the key. */
export function t(key, vars = {}) {
  const row = D[key];
  let s = row ? row[index(current)] ?? row[0] : key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Number formatting for the current language. */
export function fmt(n, d = 1) {
  if (!Number.isFinite(n)) return '–';
  return n.toLocaleString(LANGS[current].locale, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function applyStatic(root = document) {
  const html = document.documentElement;
  html.lang = current;
  html.dir = LANGS[current].dir;
  if (html.dataset.titleKey) document.title = t(html.dataset.titleKey);
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  root.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === current)));
}

export function setLang(lang) {
  if (!LANGS[lang] || lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

export const onLangChange = (fn) => listeners.add(fn);

function initSwitcher() {
  document.querySelectorAll('.lang-switch [data-lang]').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
}

applyStatic();
initSwitcher();
