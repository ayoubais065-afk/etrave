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
  'nav.scantlings': ['Scantlings', 'Échantillonnage', 'الأبعاد الإنشائية'],
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
  'home.tryCalc': ['Try the scantling calculator', 'Essayer le calcul d’échantillonnage', 'جرّب حاسبة الأبعاد الإنشائية'],
  'spec.scantlings': ['Scantlings', 'Échantillonnage', 'الأبعاد الإنشائية'],
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
  'f3.p': ['Design pressures, plating and stiffeners per ISO 12215-5. <a href="scantlings.html">Open the calculator</a>', 'Pressions de calcul, bordés et raidisseurs selon l’ISO 12215-5. <a href="scantlings.html">Ouvrir le calcul</a>', 'ضغوط التصميم والألواح والمقويات وفق ISO 12215-5. <a href="scantlings.html">افتح الحاسبة</a>'],
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

  // ---- Calculator: static ----
  'calc.title': ['Scantlings – ÉTRAVE', 'Échantillonnage – ÉTRAVE', 'الأبعاد الإنشائية – ÉTRAVE'],
  'calc.eyebrow': ['Module 03 · Beta', 'Module 03 · Bêta', 'الوحدة 03 · نسخة تجريبية'],
  'calc.h1': ['Preliminary scantlings', 'Échantillonnage préliminaire', 'الأبعاد الإنشائية الأولية'],
  'calc.lead': ['Design pressures, plating and stiffeners in accordance with ISO 12215-5, and a ply-by-ply check of the actual laminate following the BV NR546 methodology.', 'Pressions de calcul, bordés et raidisseurs selon l’ISO 12215-5, et vérification pli par pli du stratifié réel selon la méthodologie BV NR546.', 'ضغوط التصميم والألواح والمقويات وفق ISO 12215-5، مع تحقق طبقة بطبقة من التصفيح الفعلي وفق منهجية BV NR546.'],
  'calc.reset': ['Reset example', 'Réinitialiser l’exemple', 'إعادة المثال'],
  'calc.print': ['Print / PDF', 'Imprimer / PDF', 'طباعة / PDF'],
  'method.aria': ['Method', 'Méthode', 'الطريقة'],
  'm1.sub': ['Pressures, plating, stiffeners', 'Pressions, bordés, raidisseurs', 'الضغوط والألواح والمقويات'],
  'm2.sub': ['Ply-by-ply laminate check', 'Vérification pli par pli du stratifié', 'تحقق التصفيح طبقة بطبقة'],
  'craft.h': ['Craft data', 'Données du navire', 'بيانات القارب'],
  'craft.note': ['Fully loaded condition, ISO 8666 dimensions', 'Pleine charge, dimensions selon l’ISO 8666', 'حالة الحمولة الكاملة، الأبعاد وفق ISO 8666'],
  'f.type': ['Type', 'Type', 'النوع'],
  'opt.motor': ['Motor craft', 'Bateau à moteur', 'قارب بمحرك'],
  'opt.sail': ['Sailing craft', 'Voilier', 'قارب شراعي'],
  'f.category': ['Design category', 'Catégorie de conception', 'فئة التصميم'],
  'f.LH': ['Hull length L<sub>H</sub>', 'Longueur de coque L<sub>H</sub>', 'طول البدن L<sub>H</sub>'],
  'f.LWL': ['Waterline length L<sub>WL</sub>', 'Longueur de flottaison L<sub>WL</sub>', 'طول خط الماء L<sub>WL</sub>'],
  'f.BWL': ['Waterline beam B<sub>WL</sub>', 'Largeur de flottaison B<sub>WL</sub>', 'عرض خط الماء B<sub>WL</sub>'],
  'f.BC': ['Chine beam B<sub>C</sub> at 0.4 L<sub>WL</sub>', 'Largeur au bouchain B<sub>C</sub> à 0,4 L<sub>WL</sub>', 'العرض عند الزاوية B<sub>C</sub> عند 0.4 L<sub>WL</sub>'],
  'f.beta': ['Deadrise β<sub>0.4</sub>', 'Relevé de varangue β<sub>0,4</sub>', 'زاوية ميل القاع β<sub>0.4</sub>'],
  'f.V': ['Max. speed V', 'Vitesse max. V', 'السرعة القصوى V'],
  'f.m': ['Loaded mass m<sub>LDC</sub>', 'Masse en charge m<sub>LDC</sub>', 'الكتلة بالحمولة m<sub>LDC</sub>'],
  'mat.h': ['Material', 'Matériau', 'المادة'],
  'mat.note': ['Annex C (FRP), Annex D (cores), Annex F (metals)', 'Annexe C (CVR), annexe D (âmes), annexe F (métaux)', 'الملحق C (الألياف)، الملحق D (مواد القلب)، الملحق F (المعادن)'],
  'f.family': ['Construction', 'Construction', 'طريقة البناء'],
  'opt.frp': ['FRP single skin (E glass)', 'CVR monolithique (verre E)', 'ألياف زجاجية بقشرة واحدة (زجاج E)'],
  'opt.sandwich': ['FRP sandwich', 'CVR sandwich', 'ألياف زجاجية بنظام السندويتش'],
  'opt.aluminium': ['Aluminium alloy', 'Alliage d’aluminium', 'سبيكة ألمنيوم'],
  'opt.steel': ['Steel', 'Acier', 'فولاذ'],
  'opt.wood': ['Plywood / laminated wood', 'Contreplaqué / bois lamellé', 'خشب رقائقي / خشب مصفّح'],
  'f.eval': ['Evaluation level', 'Niveau d’évaluation', 'مستوى التقييم'],
  'opt.elc': ['EL-c: nominal content (× 0.8)', 'EL-c : taux nominal (× 0,8)', 'EL-c: نسبة اسمية (× 0.8)'],
  'opt.elb': ['EL-b: measured glass content', 'EL-b : taux de verre mesuré', 'EL-b: نسبة زجاج مُقاسة'],
  'f.psi': ['Glass content ψ', 'Taux de verre ψ', 'نسبة الزجاج ψ'],
  'f.kind': ['Laminate type', 'Type de stratifié', 'نوع التصفيح'],
  'opt.mixed': ['Hand-laid CSM / WR / 0-90', 'Mat / roving / 0-90 au contact', 'Mat / Roving / 0-90 بالتصفيح اليدوي'],
  'opt.sprayed': ['Sprayed CSM', 'Mat projeté', 'Mat بالرش'],
  'f.skinPsi': ['Skin ψ', 'ψ des peaux', 'ψ للقشرتين'],
  'f.to': ['Outer skin t<sub>o</sub>', 'Peau extérieure t<sub>o</sub>', 'القشرة الخارجية t<sub>o</sub>'],
  'f.ti': ['Inner skin t<sub>i</sub>', 'Peau intérieure t<sub>i</sub>', 'القشرة الداخلية t<sub>i</sub>'],
  'f.tc': ['Core t<sub>c</sub>', 'Âme t<sub>c</sub>', 'القلب t<sub>c</sub>'],
  'f.core': ['Core', 'Âme', 'مادة القلب'],
  'f.coreDensity': ['Core density', 'Masse volumique de l’âme', 'كثافة القلب'],
  'f.metal': ['Grade', 'Nuance', 'الدرجة'],
  'f.welded': ['Welded', 'Soudé', 'ملحوم'],
  'opt.yes': ['Yes (welded properties)', 'Oui (propriétés à l’état soudé)', 'نعم (خصائص الحالة الملحومة)'],
  'opt.no': ['No (riveted / bonded)', 'Non (riveté / collé)', 'لا (مبرشم / ملصق)'],
  'f.woodSigma': ['σ<sub>uf</sub> parallel to b', 'σ<sub>uf</sub> parallèle à b', 'σ<sub>uf</sub> الموازي لـ b'],
  'f.woodTau': ['Frame τ<sub>u</sub>', 'τ<sub>u</sub> des membrures', 'τ<sub>u</sub> للأضلاع'],
  'f.stiffPsi': ['Stiffener laminate ψ', 'ψ du stratifié des raidisseurs', 'ψ لتصفيح المقويات'],
  'plates.h': ['Plating', 'Bordés', 'الألواح'],
  'plates.add': ['Add panel', 'Ajouter un panneau', 'إضافة لوح'],
  'th.panel': ['Panel', 'Panneau', 'اللوح'],
  'th.zone': ['Zone', 'Zone', 'المنطقة'],
  'th.crown': ['Crown c', 'Flèche c', 'التقوس c'],
  'th.crownU': ['Crown c<sub>u</sub>', 'Flèche c<sub>u</sub>', 'التقوس c<sub>u</sub>'],
  'th.hzTitle': ['Height of panel centre above WL / top of hull above WL (side panels)', 'Hauteur du centre du panneau au-dessus de la flottaison / du livet au-dessus de la flottaison (muraille)', 'ارتفاع مركز اللوح فوق خط الماء / ارتفاع حافة البدن فوق خط الماء (ألواح الجانب)'],
  'th.req': ['Requirement', 'Exigence', 'المتطلب'],
  'th.actions': ['Actions', 'Actions', 'إجراءات'],
  'stiff.h': ['Stiffeners', 'Raidisseurs', 'المقويات'],
  'stiff.add': ['Add stiffener', 'Ajouter un raidisseur', 'إضافة مقوٍّ'],
  'th.stiff': ['Stiffener', 'Raidisseur', 'المقوي'],
  'th.reqStiff': ['Requirement (incl. effective plating)', 'Exigence (bordé associé inclus)', 'المتطلب (مع اللوح المشارك)'],
  'bvp.h': ['Panel and load', 'Panneau et chargement', 'اللوح والحمل'],
  'bvp.note': ['Design pressure from ISO 12215-5 (NR546 takes its loads from NR600 / NR500)', 'Pression de calcul selon l’ISO 12215-5 (le NR546 renvoie au NR600 / NR500 pour les charges)', 'ضغط التصميم من ISO 12215-5 (يحيل NR546 الأحمال إلى NR600 / NR500)'],
  'f.plate': ['Panel from plating list', 'Panneau de la liste des bordés', 'لوح من قائمة الألواح'],
  'f.a': ['Side a (along X)', 'Côté a (selon X)', 'الضلع a (على محور X)'],
  'f.b': ['Side b (along Y)', 'Côté b (selon Y)', 'الضلع b (على محور Y)'],
  'f.p': ['Pressure p', 'Pression p', 'الضغط p'],
  'f.resin': ['Resin', 'Résine', 'الراتنج'],
  'opt.polyester': ['Polyester', 'Polyester', 'بوليستر'],
  'opt.vinylester': ['Vinylester', 'Vinylester', 'فينيل إستر'],
  'opt.epoxy': ['Epoxy', 'Époxy', 'إيبوكسي'],
  'f.process': ['Process', 'Procédé', 'طريقة التصنيع'],
  'opt.handLayUp': ['Hand lay-up', 'Moulage au contact', 'تصفيح يدوي'],
  'opt.infusion': ['Infusion', 'Infusion', 'الحقن بالتفريغ'],
  'opt.prepreg': ['Pre-preg', 'Préimprégné', 'ألياف مشرّبة مسبقًا'],
  'lam.h': ['Laminate stack', 'Séquence de stratification', 'ترتيب طبقات التصفيح'],
  'lam.note': ['outer face (wetted side) first', 'face extérieure (côté mouillé) en premier', 'الوجه الخارجي (الملامس للماء) أولًا'],
  'lam.addLayer': ['Add layer', 'Ajouter un pli', 'إضافة طبقة'],
  'lam.addCore': ['Add core', 'Ajouter une âme', 'إضافة قلب'],
  'th.fabric': ['Fabric', 'Renfort', 'نوع النسيج'],
  'th.fibre': ['Fibre / core', 'Fibre / âme', 'الألياف / القلب'],
  'th.mass': ['Mass <span class="unit">g/m²</span> · Density <span class="unit">kg/m³</span>', 'Grammage <span class="unit">g/m²</span> · Masse vol. <span class="unit">kg/m³</span>', 'الكتلة <span class="unit">g/m²</span> · الكثافة <span class="unit">kg/m³</span>'],
  'th.mf': ['M<sub>f</sub> · Thickness', 'M<sub>f</sub> · Épaisseur', 'M<sub>f</sub> · السماكة'],
  'th.angle': ['Angle', 'Angle', 'الزاوية'],
  'th.util': ['Utilisation', 'Taux d’utilisation', 'نسبة الاستخدام'],
  'sf.h': ['Partial safety factors', 'Coefficients partiels de sécurité', 'معاملات الأمان الجزئية'],
  'sf.note': ['Provisional defaults: verify against BV NR600 / NR500', 'Valeurs provisoires : à vérifier selon BV NR600 / NR500', 'قيم مؤقتة: يجب التحقق منها وفق BV NR600 / NR500'],
  'sf.CV': ['C<sub>V</sub> ageing', 'C<sub>V</sub> vieillissement', 'C<sub>V</sub> التقادم'],
  'sf.CF': ['C<sub>F</sub> fabrication', 'C<sub>F</sub> fabrication', 'C<sub>F</sub> التصنيع'],
  'sf.CRf': ['C<sub>R</sub> fibre direction', 'C<sub>R</sub> sens des fibres', 'C<sub>R</sub> اتجاه الألياف'],
  'sf.CRt': ['C<sub>R</sub> transverse', 'C<sub>R</sub> transverse', 'C<sub>R</sub> الاتجاه العرضي'],
  'sf.CRs': ['C<sub>R</sub> in-plane shear', 'C<sub>R</sub> cisaillement plan', 'C<sub>R</sub> القص في المستوى'],
  'sf.CRi': ['C<sub>R</sub> interlaminar', 'C<sub>R</sub> interlaminaire', 'C<sub>R</sub> القص بين الطبقات'],
  'sf.Ci': ['C<sub>i</sub> load type', 'C<sub>i</sub> type de charge', 'C<sub>i</sub> نوع الحمل'],
  'sf.CCS': ['C<sub>CS</sub> combined (Hoffman)', 'C<sub>CS</sub> combiné (Hoffman)', 'C<sub>CS</sub> المركّب (Hoffman)'],
  'sf.fine': ['Required safety factor in each layer: SF ≥ C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub>; combined: SF<sub>CS</sub> ≥ C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub> (NR546 Sec 2, [1.3]).', 'Coefficient de sécurité requis dans chaque pli : SF ≥ C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub> ; combiné : SF<sub>CS</sub> ≥ C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub> (NR546 Sec 2, [1.3]).', 'معامل الأمان المطلوب في كل طبقة: SF ≥ C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub>، والمركّب: SF<sub>CS</sub> ≥ C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub> (NR546 القسم 2، [1.3]).'],
  'notes.h': ['Scope and limits', 'Domaine d’application et limites', 'نطاق التطبيق والحدود'],
  'notes.1': ['Preliminary results only. Not valid for construction, approval or certification.', 'Résultats préliminaires uniquement. Non valables pour la construction, l’approbation ou la certification.', 'نتائج أولية فقط، لا تصلح للبناء ولا للمصادقة ولا للإشهاد.'],
  'notes.2': ['ISO 12215-5 applies to monohulls with L<sub>H</sub> 2.5–24 m and V ≤ 50 kn; it is written for recreational craft. Professional fishing vessels may fall under national rules or classification society rules.', 'L’ISO 12215-5 s’applique aux monocoques de L<sub>H</sub> 2,5 à 24 m et V ≤ 50 nœuds ; elle vise les bateaux de plaisance. Les navires de pêche professionnels peuvent relever de la réglementation nationale ou des règles d’une société de classification.', 'ينطبق ISO 12215-5 على القوارب أحادية البدن بطول L<sub>H</sub> من 2.5 إلى 24 م وسرعة V ≤ 50 عقدة، وهو موضوع لقوارب النزهة. قد تخضع قوارب الصيد المهنية للتنظيم الوطني أو لقواعد هيئات التصنيف.'],
  'notes.3': ['Method 1 follows ISO 12215-5:2008. Differences introduced by the 2019 edition are not yet included.', 'La méthode 1 suit l’ISO 12215-5:2008. Les modifications de l’édition 2019 ne sont pas encore intégrées.', 'تتبع الطريقة 1 نسخة ISO 12215-5:2008، ولم تُدمج بعد التغييرات التي جاءت بها نسخة 2019.'],
  'notes.4': ['Method 2 follows the NR546 calculation steps (layer properties, laminate theory, clamped-panel moments, ply stresses, Hoffman criterion). Transverse shear uses ISO 12215-5 Eq. (33).', 'La méthode 2 suit les étapes de calcul du NR546 (propriétés des plis, théorie des stratifiés, moments du panneau encastré, contraintes par pli, critère de Hoffman). L’effort tranchant suit l’éq. (33) de l’ISO 12215-5.', 'تتبع الطريقة 2 خطوات الحساب في NR546 (خصائص الطبقات، نظرية التصفيح، عزوم اللوح المثبّت الأطراف، الإجهادات في كل طبقة، معيار Hoffman). ويُحسب القص العرضي وفق المعادلة (33) من ISO 12215-5.'],

  // ---- Calculator: dynamic ----
  'd.mode': ['Mode', 'Mode', 'النمط'],
  'mode.sail': ['Sailing craft', 'Voilier', 'قارب شراعي'],
  'mode.planing': ['Planing', 'Planant', 'انزلاقي'],
  'mode.disp': ['Displacement', 'Déplacement', 'إزاحي'],
  'd.nCGkL': ['n<sub>CG</sub> for k<sub>L</sub>', 'n<sub>CG</sub> pour k<sub>L</sub>', 'n<sub>CG</sub> لحساب k<sub>L</sub>'],
  'd.Vused': ['V used', 'V retenue', 'V المعتمدة'],
  'unit.kn': ['kn', 'nœuds', 'عقدة'],
  'w.LH': ['L<sub>H</sub> is outside the 2.5–24 m scope of ISO 12215-5.', 'L<sub>H</sub> est hors du domaine 2,5–24 m de l’ISO 12215-5.', 'L<sub>H</sub> خارج نطاق ISO 12215-5 (من 2.5 إلى 24 م).'],
  'w.beta': ['Deadrise taken as {v}° (limited to 10°–30°, 6.1).', 'Relevé de varangue pris égal à {v}° (limité à 10°–30°, 6.1).', 'اعتُمدت زاوية ميل القاع {v}° (محدودة بين 10° و30°، البند 6.1).'],
  'w.V': ['Speed taken as {v} kn (not less than 2.36·√L<sub>WL</sub>, 6.1).', 'Vitesse prise égale à {v} nœuds (au moins 2,36·√L<sub>WL</sub>, 6.1).', 'اعتُمدت السرعة {v} عقدة (لا تقل عن 2.36·√L<sub>WL</sub>، البند 6.1).'],
  'w.V50': ['Speed above 50 kn is outside the scope of ISO 12215-5.', 'Une vitesse supérieure à 50 nœuds est hors du domaine de l’ISO 12215-5.', 'السرعة فوق 50 عقدة خارج نطاق ISO 12215-5.'],
  'w.ncg2': ['n<sub>CG</sub>: Eq. (1) gives more than 3; the lower value from Eq. (2) is used.', 'n<sub>CG</sub> : l’éq. (1) dépasse 3 ; la valeur plus faible de l’éq. (2) est retenue.', 'n<sub>CG</sub>: تعطي المعادلة (1) قيمة أكبر من 3، فاعتُمدت القيمة الأصغر من المعادلة (2).'],
  'w.ncg1': ['n<sub>CG</sub>: Eq. (1) gives more than 3 and is kept as the lower value.', 'n<sub>CG</sub> : l’éq. (1) dépasse 3 et reste la valeur la plus faible.', 'n<sub>CG</sub>: تعطي المعادلة (1) قيمة أكبر من 3، وأُبقيت لأنها الأصغر.'],
  'w.ncg7': ['n<sub>CG</sub> limited to 7.', 'n<sub>CG</sub> limité à 7.', 'n<sub>CG</sub> محدود بالقيمة 7.'],
  'd.sigmaPlate': ['σ<sub>d</sub> plating', 'σ<sub>d</sub> bordé', 'σ<sub>d</sub> للألواح'],
  'd.sigmaStiff': ['σ<sub>d</sub> stiffeners', 'σ<sub>d</sub> raidisseurs', 'σ<sub>d</sub> للمقويات'],
  'd.tauStiff': ['τ<sub>d</sub> stiffeners', 'τ<sub>d</sub> raidisseurs', 'τ<sub>d</sub> للمقويات'],
  'd.sigmaFrames': ['σ<sub>d</sub> frames', 'σ<sub>d</sub> membrures', 'σ<sub>d</sub> للأضلاع'],
  'd.skinUt': ['Skin σ<sub>ut</sub>', 'σ<sub>ut</sub> peau', 'σ<sub>ut</sub> للقشرة'],
  'd.skinUc': ['Skin σ<sub>uc</sub>', 'σ<sub>uc</sub> peau', 'σ<sub>uc</sub> للقشرة'],
  'd.coreTu': ['Core τ<sub>u</sub>', 'τ<sub>u</sub> âme', 'τ<sub>u</sub> للقلب'],
  'd.coreTd': ['Core τ<sub>d</sub>', 'τ<sub>d</sub> âme', 'τ<sub>d</sub> للقلب'],
  'd.coreG': ['Core G', 'G âme', 'G للقلب'],
  'd.perKg': ['mm per kg/m²', 'mm par kg/m²', 'مم لكل kg/m²'],
  'zone.bottom': ['Bottom', 'Fond', 'القاع'],
  'zone.side': ['Side', 'Muraille', 'الجانب'],
  'zone.deck': ['Deck', 'Pont', 'السطح'],
  'zone.superstructure': ['Superstructure', 'Superstructure', 'البنية الفوقية'],
  'zone.wtBulkhead': ['WT bulkhead', 'Cloison étanche', 'حاجز مانع للماء'],
  'zone.tank': ['Tank boundary', 'Paroi de réservoir', 'جدار خزان'],
  'sup.front': ['Front, any area', 'Façade, toute zone', 'الواجهة الأمامية، أي منطقة'],
  'sup.sideWalking': ['Side, walking area', 'Côté, zone de circulation', 'الجانب، منطقة مشي'],
  'sup.sideNonWalking': ['Side, non-walking area', 'Côté, hors circulation', 'الجانب، منطقة لا يُمشى عليها'],
  'sup.aft': ['Aft end, any area', 'Face arrière, toute zone', 'الواجهة الخلفية، أي منطقة'],
  'sup.topLow': ['Top ≤ 800 mm above deck, walking area', 'Dessus ≤ 800 mm au-dessus du pont, zone de circulation', 'السقف ≤ 800 مم فوق السطح، منطقة مشي'],
  'sup.topHigh': ['Top > 800 mm above deck and upper tiers, walking area', 'Dessus > 800 mm au-dessus du pont et étages supérieurs, zone de circulation', 'السقف > 800 مم فوق السطح والطوابق العليا، منطقة مشي'],
  'a.name': ['name', 'nom', 'الاسم'],
  'a.remove': ['Remove', 'Supprimer', 'حذف'],
  'a.layer': ['Layer', 'Pli', 'الطبقة'],
  'r.glass': ['{w} kg/m² glass', '{w} kg/m² de verre', '{w} kg/m² زجاج'],
  'r.tAt': ['t ≈ {t} mm at ψ {psi}', 't ≈ {t} mm à ψ {psi}', 't ≈ {t} mm (ψ = {psi})'],
  'r.governed': ['Governed by {x}', 'Dimensionné par : {x}', 'العامل الحاكم: {x}'],
  'r.strengthMin': ['strength {a} mm · minimum {b} mm', 'résistance {a} mm · minimum {b} mm', 'المقاومة {a} مم · الحد الأدنى {b} مم'],
  'r.noCorrosion': ['no corrosion margin', 'sans marge de corrosion', 'دون هامش للتآكل'],
  'r.sandOk': ['Sandwich OK', 'Sandwich conforme', 'السندويتش مطابق'],
  'r.fails': ['Fails: {x}', 'Non conforme : {x}', 'غير مطابق: {x}'],
  'r.smFrp': ['<bdi>SM ≥ {a} cm³</bdi> (crown) · <bdi>{b} cm³</bdi> (plating)', '<bdi>SM ≥ {a} cm³</bdi> (semelle) · <bdi>{b} cm³</bdi> (bordé)', '<bdi>SM ≥ {a} cm³</bdi> للحافة العلوية · <bdi>{b} cm³</bdi> للوح'],
  'r.woodFrames': ['Laminated wood frames', 'Membrures en bois lamellé', 'أضلاع من خشب مصفّح'],
  'chk.SMo': ['Outer skin section modulus', 'Module de flexion, peau extérieure', 'معامل المقطع للقشرة الخارجية'],
  'chk.SMi': ['Inner skin section modulus', 'Module de flexion, peau intérieure', 'معامل المقطع للقشرة الداخلية'],
  'chk.I': ['Second moment', 'Moment quadratique', 'عزم القصور الذاتي'],
  'chk.ts': ['Shear: distance between skins', 'Cisaillement : distance entre peaux', 'القص: المسافة بين القشرتين'],
  'chk.core': ['Core design shear strength', 'Contrainte de cisaillement de calcul de l’âme', 'إجهاد القص التصميمي للقلب'],
  'chk.wo': ['Outer skin fibre mass', 'Masse de fibre, peau extérieure', 'كتلة الألياف في القشرة الخارجية'],
  'chk.wi': ['Inner skin fibre mass', 'Masse de fibre, peau intérieure', 'كتلة الألياف في القشرة الداخلية'],
  'bv.custom': ['Custom panel', 'Panneau personnalisé', 'لوح مخصص'],
  'fab.CSM': ['Chopped strand mat', 'Mat', 'حصيرة ألياف مقطعة (Mat)'],
  'fab.WR': ['Woven roving', 'Roving tissé', 'نسيج روفينغ'],
  'fab.UD': ['Unidirectional', 'Unidirectionnel', 'أحادي الاتجاه (UD)'],
  'fab.BIAX': ['Double bias ±45°', 'Biaxial ±45°', 'ثنائي الاتجاه ±45°'],
  'fab.CORE': ['Core', 'Âme', 'قلب'],
  'fib.E': ['E-glass', 'Verre E', 'زجاج E'],
  'fib.R': ['R-glass', 'Verre R', 'زجاج R'],
  'fib.HS': ['Carbon HS', 'Carbone HS', 'كربون HS'],
  'fib.IM': ['Carbon IM', 'Carbone IM', 'كربون IM'],
  'fib.HM': ['Carbon HM', 'Carbone HM', 'كربون HM'],
  'fib.aramid': ['Para-aramid', 'Para-aramide', 'بارا-أراميد'],
  'core.linearPvc': ['Linear PVC', 'PVC linéaire', 'PVC خطي'],
  'core.crossPvc': ['Cross-linked PVC', 'PVC réticulé', 'PVC متشابك'],
  'core.san': ['SAN', 'SAN', 'SAN'],
  'core.pet': ['PET', 'PET', 'PET'],
  'core.pmi': ['PMI', 'PMI', 'PMI'],
  'core.balsa': ['End-grain balsa', 'Balsa debout', 'بلسا (ألياف عمودية)'],
  'icore.balsa': ['End-grain balsa', 'Balsa debout', 'بلسا (ألياف عمودية)'],
  'icore.pvc1': ['Cross-linked PVC (type I)', 'PVC réticulé (type I)', 'PVC متشابك (النوع I)'],
  'icore.pvc2': ['Cross-linked PVC (type II)', 'PVC réticulé (type II)', 'PVC متشابك (النوع II)'],
  'icore.linearPvc': ['Linear PVC', 'PVC linéaire', 'PVC خطي'],
  'icore.san': ['SAN', 'SAN', 'SAN'],
  'mode.fibre': ['fibre direction', 'sens des fibres', 'اتجاه الألياف'],
  'mode.transverse': ['transverse', 'transverse', 'الاتجاه العرضي'],
  'mode.shear': ['in-plane shear', 'cisaillement plan', 'القص في المستوى'],
  'mode.combined': ['combined (Hoffman)', 'combiné (Hoffman)', 'مركّب (Hoffman)'],
  'mode.il': ['interlaminar shear', 'cisaillement interlaminaire', 'القص بين الطبقات'],
  'mode.sideA': ['side a', 'côté a', 'الضلع a'],
  'mode.sideB': ['side b', 'côté b', 'الضلع b'],
  'mode.outer': ['outer face', 'face extérieure', 'الوجه الخارجي'],
  'mode.inner': ['inner face', 'face intérieure', 'الوجه الداخلي'],
  'bv.ok': ['Laminate OK', 'Stratifié conforme', 'التصفيح مطابق'],
  'bv.ko': ['Laminate not OK', 'Stratifié non conforme', 'التصفيح غير مطابق'],
  'bv.util': ['Maximum utilisation {u} % of the required safety factor', 'Taux d’utilisation maximal : {u} % du coefficient de sécurité requis', 'أقصى نسبة استخدام: {u} % من معامل الأمان المطلوب'],
  'bv.advice': ['Increase the laminate or reduce the panel size.', 'Renforcez le stratifié ou réduisez la taille du panneau.', 'زِد التصفيح أو صغّر أبعاد اللوح.'],
  'bv.check': ['Check input', 'Vérifier les données', 'تحقق من المدخلات'],
  'bv.noLayer': ['Add at least one layer.', 'Ajoutez au moins un pli.', 'أضف طبقة واحدة على الأقل.'],
  'bv.thick': ['Thickness', 'Épaisseur', 'السماكة'],
  'bv.areal': ['Areal mass', 'Masse surfacique', 'الكتلة لكل متر مربع'],
  'bv.shear': ['Shear T', 'Effort tranchant T', 'قوة القص T'],
  'bv.sfReq': ['SF required', 'SF requis', 'SF المطلوب'],
  'bv.sfcsReq': ['SF<sub>CS</sub> required', 'SF<sub>CS</sub> requis', 'SF<sub>CS</sub> المطلوب'],
  'new.panel': ['Panel {n}', 'Panneau {n}', 'لوح {n}'],
  'new.stiff': ['Stiffener {n}', 'Raidisseur {n}', 'مقوٍّ {n}'],
  'ex.bottomAft': ['Bottom aft', 'Fond arrière', 'القاع الخلفي'],
  'ex.bottomFwd': ['Bottom forward', 'Fond avant', 'القاع الأمامي'],
  'ex.side': ['Side', 'Muraille', 'الجانب'],
  'ex.deck': ['Weather deck', 'Pont exposé', 'السطح المكشوف'],
  'ex.wheelhouse': ['Wheelhouse front', 'Façade de la timonerie', 'واجهة غرفة القيادة'],
  'ex.bottomFrame': ['Bottom frame', 'Membrure de fond', 'ضلع القاع'],
  'ex.sideFrame': ['Side frame', 'Membrure de muraille', 'ضلع الجانب'],
  'ex.deckBeam': ['Deck beam', 'Barrot de pont', 'عارضة السطح'],
};

// Phrases produced by the calculation engines (English), translated by
// substitution, longest first.
const PHRASES = [
  ['Side, planing mode (bottom governed by planing)', 'Muraille, mode planant (fond gouverné par le planing)', 'الجانب، نمط الانزلاق (القاع محكوم بالانزلاق)'],
  ['limited by 8.4 (very large component)', 'limité par 8.4 (très grand élément)', 'محدود وفق 8.4 (عنصر كبير جدًا)'],
  ['Weather deck, sailing craft', 'Pont exposé, voilier', 'السطح المكشوف، قارب شراعي'],
  ['Superstructure, sailing craft', 'Superstructure, voilier', 'البنية الفوقية، قارب شراعي'],
  ['Bottom, displacement mode', 'Fond, mode déplacement', 'القاع، نمط الإزاحة'],
  ['Side, displacement mode', 'Muraille, mode déplacement', 'الجانب، نمط الإزاحة'],
  ['Bottom, planing mode', 'Fond, mode planant', 'القاع، نمط الانزلاق'],
  ['Side, planing mode', 'Muraille, mode planant', 'الجانب، نمط الانزلاق'],
  ['Bottom, sailing craft', 'Fond, voilier', 'القاع، قارب شراعي'],
  ['Side, sailing craft', 'Muraille, voilier', 'الجانب، قارب شراعي'],
  ['Watertight bulkhead', 'Cloison étanche', 'حاجز مانع للماء'],
  ['Integral tank', 'Réservoir intégré', 'خزان مدمج'],
  ['Weather deck', 'Pont exposé', 'السطح المكشوف'],
  ['Superstructure', 'Superstructure', 'البنية الفوقية'],
  ['side/transom', 'muraille/tableau', 'الجانب/المرآة'],
  ['no minimum', 'pas de minimum', 'لا يوجد حد أدنى'],
  ['bottom part', 'partie fond', 'جزء القاع'],
  ['Mild steel', 'Acier doux', 'فولاذ طري'],
  ['(profiles)', '(profilés)', '(مقاطع)'],
  ['Aluminium', 'Aluminium', 'ألمنيوم'],
  ['Steel', 'Acier', 'فولاذ'],
  ['strength', 'résistance', 'المقاومة'],
  ['minimum', 'minimum', 'الحد الأدنى'],
  ['bottom', 'fond', 'القاع'],
  ['side', 'muraille', 'الجانب'],
  ['deck', 'pont', 'السطح'],
  ['Table', 'Tableau', 'الجدول'],
  ['Eq.', 'Éq.', 'المعادلة'],
];

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

/** Translate an English phrase produced by the calculation engines. */
export function tr(text) {
  if (current === 'en' || !text) return text;
  const i = index(current);
  let out = text;
  const tokens = [];
  for (const row of PHRASES) {
    if (!out.includes(row[0])) continue;
    tokens.push(row[i]);
    out = out.split(row[0]).join(`\u0000${tokens.length - 1}\u0000`);
  }
  out = out.replace(/\u0000(\d+)\u0000/g, (_, n) => tokens[Number(n)]);
  if (current === 'ar') out = out.replace(/, /g, '، ').replace(/; /g, '؛ ');
  return out;
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
