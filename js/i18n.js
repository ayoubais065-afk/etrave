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

  // ---- Calculator (NR600 / NR546) ----
  'nav.scantlings': ['Scantlings', 'Échantillonnage', 'الأبعاد الإنشائية'],
  'home.tryCalc': ['Open the scantling calculator', 'Ouvrir le calcul d’échantillonnage', 'افتح حاسبة الأبعاد الإنشائية'],
  'calc.title': ['Scantlings – ÉTRAVE', 'Échantillonnage – ÉTRAVE', 'الأبعاد الإنشائية – ÉTRAVE'],
  'calc.eyebrow': ['Bureau Veritas · NR600 · NR546', 'Bureau Veritas · NR600 · NR546', 'Bureau Veritas · NR600 · NR546'],
  'calc.h1': ['Preliminary scantlings', 'Échantillonnage préliminaire', 'الأبعاد الإنشائية الأولية'],
  'calc.lead': ['Local loads and scantlings of plating and secondary stiffeners for ships less than 90 m, in steel, aluminium or composite.', 'Charges locales et échantillonnage des bordés et des raidisseurs secondaires pour les navires de moins de 90 m, en acier, en aluminium ou en composite.', 'الأحمال الموضعية والأبعاد الإنشائية للألواح والمقويات الثانوية للسفن الأقل من 90 م، من الفولاذ أو الألمنيوم أو المواد المركبة.'],
  'calc.reset': ['Reset example', 'Réinitialiser l’exemple', 'إعادة المثال'],
  'calc.print': ['Print / PDF', 'Imprimer / PDF', 'طباعة / PDF'],
  'ship.h': ['Ship data', 'Données du navire', 'بيانات السفينة'],
  'f.group': ['Ship group', 'Groupe de navire', 'فئة السفينة'],
  'opt.nonCargo': ['Non-cargo ship', 'Navire non cargo', 'سفينة غير تجارية'],
  'opt.cargo': ['Cargo ship', 'Navire cargo', 'سفينة شحن'],
  'f.service': ['Type of vessel', 'Type de navire', 'نوع المركب'],
  'svc.tourism': ['Tourist / excursion boat', 'Bateau de tourisme / promenade', 'قارب سياحي / نزهة'],
  'ship.main': ['Main data: enough to start', 'Données principales : suffisantes pour commencer', 'البيانات الأساسية: تكفي للبدء'],
  'ship.auto': ['Estimated automatically: replace any value with your own', 'Estimées automatiquement : remplacez n’importe quelle valeur par la vôtre', 'تُقدَّر تلقائيًا: يمكنك استبدال أي قيمة بقيمتك'],
  'f.Bmax': ['Maximum breadth B', 'Largeur maximale B', 'العرض الأقصى B'],
  'f.BWL': ['Waterline breadth B<sub>WL</sub>', 'Largeur de flottaison B<sub>WL</sub>', 'عرض خط الماء B<sub>WL</sub>'],
  'opt.displacementHull': ['Displacement', 'À déplacement', 'إزاحي'],
  'opt.planingHull': ['Planing', 'Planante', 'انزلاقي'],
  'auto.tag': ['auto', 'auto', 'تلقائي'],
  'auto.reset': ['Back to the estimate', 'Revenir à l’estimation', 'العودة إلى القيمة التقديرية'],
  'auto.hint': ['Empty field = estimated value', 'Champ vide = valeur estimée', 'الحقل الفارغ = القيمة التقديرية'],
  'auto.deckZ': ['empty = deck at D', 'vide = pont à D', 'فارغ = السطح عند D'],
  'svc.fishing': ['Fishing vessel', 'Navire de pêche', 'سفينة صيد'],
  'svc.supply': ['Supply', 'Ravitailleur', 'سفينة إمداد'],
  'svc.passenger': ['Passenger / ferry', 'Passagers / ferry', 'ركاب / عبّارة'],
  'svc.cargo': ['Cargo', 'Cargo', 'شحن'],
  'svc.pilot': ['Pilot / patrol', 'Pilotage / patrouille', 'إرشاد / دورية'],
  'svc.rescue': ['Rescue', 'Sauvetage', 'إنقاذ'],
  'f.navigation': ['Navigation notation', 'Notation de navigation', 'علامة الملاحة'],
  'nav.unrestricted': ['Unrestricted navigation', 'Navigation illimitée', 'ملاحة غير مقيدة'],
  'nav.summer': ['Summer zone', 'Zone d’été', 'منطقة صيفية'],
  'nav.tropical': ['Tropical zone', 'Zone tropicale', 'منطقة استوائية'],
  'nav.coastal': ['Coastal area', 'Zone côtière', 'منطقة ساحلية'],
  'nav.sheltered': ['Sheltered area', 'Zone abritée', 'منطقة محمية'],
  'f.LWL': ['Waterline length L<sub>WL</sub>', 'Longueur de flottaison L<sub>WL</sub>', 'طول خط الماء L<sub>WL</sub>'],
  'f.LHULL': ['Hull length L<sub>HULL</sub>', 'Longueur de coque L<sub>HULL</sub>', 'طول البدن L<sub>HULL</sub>'],
  'f.B': ['Waterline breadth B<sub>WL</sub>', 'Largeur de flottaison B<sub>WL</sub>', 'عرض خط الماء B<sub>WL</sub>'],
  'f.D': ['Depth D', 'Creux D', 'العمق D'],
  'f.T': ['Scantling draught T', 'Tirant d’eau d’échantillonnage T', 'غاطس التصميم T'],
  'f.disp': ['Displacement Δ', 'Déplacement Δ', 'الإزاحة Δ'],
  'f.V': ['Max. service speed V', 'Vitesse max. de service V', 'السرعة القصوى للخدمة V'],
  'f.planing': ['Hull type', 'Type de carène', 'نوع البدن'],
  'opt.no': ['No', 'Non', 'لا'],
  'opt.yes': ['Yes', 'Oui', 'نعم'],
  'f.deadrise': ['Deadrise at L<sub>CG</sub>', 'Relevé de varangue à L<sub>CG</sub>', 'زاوية ميل القاع عند L<sub>CG</sub>'],
  'f.aCG': ['Design acceleration a<sub>CG</sub>', 'Accélération de calcul a<sub>CG</sub>', 'التسارع التصميمي a<sub>CG</sub>'],
  'f.aCGph': ['guidance value', 'valeur indicative', 'قيمة إرشادية'],
  'method.aria': ['Hull material', 'Matériau de coque', 'مادة البدن'],
  'm1.h': ['Steel / aluminium', 'Acier / aluminium', 'فولاذ / ألمنيوم'],
  'm1.sub': ['NR600 Ch 4, Sec 3 and Sec 4', 'NR600 Ch 4, Sec 3 et Sec 4', 'NR600 الفصل 4، القسمان 3 و4'],
  'm2.h': ['Composite', 'Composite', 'مواد مركبة'],
  'm2.sub': ['NR546 ply by ply, NR600 safety factors', 'NR546 pli par pli, coefficients NR600', 'NR546 طبقة بطبقة، معاملات أمان NR600'],
  'mat.h': ['Material', 'Matériau', 'المادة'],
  'f.metal': ['Material', 'Matériau', 'المادة'],
  'opt.steel': ['Steel', 'Acier', 'فولاذ'],
  'opt.aluminium': ['Aluminium alloy', 'Alliage d’aluminium', 'سبيكة ألمنيوم'],
  'f.grade': ['Grade', 'Nuance', 'الدرجة'],
  'mat.aluNote': ['Welded aluminium properties are typical values: check them against NR561 and the supplier’s certificate.', 'Les caractéristiques de l’aluminium soudé sont des valeurs usuelles : à vérifier selon le NR561 et le certificat du fournisseur.', 'خصائص الألمنيوم الملحوم قيم نموذجية: تحقق منها وفق NR561 وشهادة المورّد.'],
  'plates.h': ['Plating', 'Bordés', 'الألواح'],
  'plates.add': ['Add panel', 'Ajouter un panneau', 'إضافة لوح'],
  'th.panel': ['Panel', 'Panneau', 'اللوح'],
  'th.zone': ['Zone', 'Zone', 'المنطقة'],
  'th.zTitle': ['Height above the base line of the lower edge of the panel (deck: height of the deck)', 'Hauteur au-dessus de la ligne de base du bord inférieur du panneau (pont : hauteur du pont)', 'ارتفاع الحافة السفلى للوح فوق خط الأساس (للسطح: ارتفاع السطح)'],
  'th.zStiffTitle': ['Height above the base line at mid-span (vertical frames: lower end)', 'Hauteur au-dessus de la ligne de base à mi-portée (membrures verticales : extrémité basse)', 'الارتفاع فوق خط الأساس عند منتصف الطول (الأضلاع الرأسية: الطرف السفلي)'],
  'th.framing': ['Framing', 'Membrure', 'نظام التقوية'],
  'th.loads': ['Loads', 'Charges', 'الأحمال'],
  'th.thickness': ['Thickness', 'Épaisseur', 'السماكة'],
  'th.actions': ['Actions', 'Actions', 'إجراءات'],
  'plates.fine': ['x from the aft end of L<sub>WL</sub>; z above the base line at the lower edge of the panel (deck: height of the deck). Thickness rounded to the nearest 0.5 mm, corrosion addition included (gross scantling).', 'x depuis l’extrémité arrière de L<sub>WL</sub> ; z au-dessus de la ligne de base au bord inférieur du panneau (pont : hauteur du pont). Épaisseur arrondie au 0,5 mm le plus proche, marge de corrosion incluse (échantillonnage brut).', 'x من الطرف الخلفي لـ L<sub>WL</sub>، و z فوق خط الأساس عند الحافة السفلى للوح (للسطح: ارتفاع السطح). السماكة مقرّبة إلى أقرب 0.5 مم، وتشمل هامش التآكل.'],
  'framing.transverse': ['Transverse', 'Transversale', 'عرضي'],
  'framing.longitudinal': ['Longitudinal', 'Longitudinale', 'طولي'],
  'stiff.h': ['Secondary stiffeners', 'Raidisseurs secondaires', 'المقويات الثانوية'],
  'stiff.add': ['Add stiffener', 'Ajouter un raidisseur', 'إضافة مقوٍّ'],
  'th.stiff': ['Stiffener', 'Raidisseur', 'المقوي'],
  'th.type': ['Type', 'Type', 'النوع'],
  'th.ends': ['Ends', 'Extrémités', 'الأطراف'],
  'th.reqStiff': ['Requirement', 'Exigence', 'المتطلب'],
  'stiff.fine': ['Section modulus Z and shear area A<sub>sh</sub> include the attached plating b<sub>p</sub> = min(0.2 ℓ ; s). Vertical side frames: z at the lower end, upper end at z + ℓ.', 'Le module Z et la section de cisaillement A<sub>sh</sub> incluent le bordé associé b<sub>p</sub> = min(0,2 ℓ ; s). Membrures verticales : z à l’extrémité basse, extrémité haute à z + ℓ.', 'معامل المقطع Z ومساحة القص A<sub>sh</sub> يشملان اللوح المشارك b<sub>p</sub> = min(0.2 ℓ ; s). الأضلاع الرأسية: z عند الطرف السفلي، والطرف العلوي عند z + ℓ.'],
  'type.transverse': ['Transverse (floor, beam)', 'Transversal (varangue, barrot)', 'عرضي (أرضية، عارضة)'],
  'type.longitudinal': ['Longitudinal', 'Longitudinal', 'طولي'],
  'type.frame': ['Vertical side frame', 'Membrure verticale', 'ضلع جانبي رأسي'],
  'ends.fixed': ['Fixed', 'Encastrées', 'مثبّتة'],
  'ends.fixedSupported': ['Fixed / supported', 'Encastrée / appuyée', 'مثبّت / مسنود'],
  'ends.supported': ['Supported', 'Appuyées', 'مسنودة'],
  'zone.bottom': ['Bottom', 'Fond', 'القاع'],
  'zone.side': ['Side shell', 'Bordé de muraille', 'الجانب'],
  'zone.deck': ['Exposed deck', 'Pont exposé', 'سطح مكشوف'],
  'zone.workdeck': ['Working deck (fishing)', 'Pont de travail (pêche)', 'سطح العمل (صيد)'],
  'load.sea': ['Sea', 'Mer', 'البحر'],
  'load.slamming': ['Slamming', 'Tossage', 'ارتطام القاع'],
  'load.sideImpact': ['Side impact', 'Impact latéral', 'ارتطام جانبي'],
  'load.minimum': ['Minimum', 'Minimum', 'الحد الأدنى'],
  'r.fishing': ['incl. +0.5 mm fishing vessel', 'dont +0,5 mm navire de pêche', 'يشمل +0.5 مم لسفن الصيد'],
  'r.min': ['minimum {t} mm', 'minimum {t} mm', 'الحد الأدنى {t} مم'],
  'r.governed': ['Governed by: {x}', 'Dimensionné par : {x}', 'العامل الحاكم: {x}'],
  'r.zmin': ['minimum {z} cm³', 'minimum {z} cm³', 'الحد الأدنى {z} cm³'],
  'd.LW': ['L<sub>W</sub>', 'L<sub>W</sub>', 'L<sub>W</sub>'],
  'd.h1': ['h<sub>1</sub> areas 1 / 2 / 3 / 4', 'h<sub>1</sub> zones 1 / 2 / 3 / 4', 'h<sub>1</sub> المناطق 1 / 2 / 3 / 4'],
  'd.planingGuide': ['Planing guidance', 'Indication planing', 'مؤشر الانزلاق'],
  'd.planingYes': ['V ≥ 7.16 Δ<sup>1/6</sup>: planing possible', 'V ≥ 7,16 Δ<sup>1/6</sup> : planing possible', 'V ≥ 7.16 Δ<sup>1/6</sup>: الانزلاق ممكن'],
  'd.planingNo': ['displacement hull', 'carène à déplacement', 'بدن إزاحي'],
  'd.aCG': ['a<sub>CG</sub>', 'a<sub>CG</sub>', 'a<sub>CG</sub>'],
  'd.aCGdesigner': ['designer', 'concepteur', 'المصمم'],
  'd.aCGguide': ['guidance', 'indicative', 'إرشادية'],
  'd.notPlaning': ['not planing', 'non planant', 'غير انزلاقي'],
  'w.L65': ['Cargo ships of 65 m and above are outside NR600 (use NR467).', 'Les navires cargo de 65 m et plus sont hors du NR600 (appliquer le NR467).', 'سفن الشحن بطول 65 م فأكثر خارج نطاق NR600 (يطبق NR467).'],
  'w.L90': ['Ships of 90 m and above are outside NR600 (use NR467).', 'Les navires de 90 m et plus sont hors du NR600 (appliquer le NR467).', 'السفن بطول 90 م فأكثر خارج نطاق NR600 (يطبق NR467).'],
  'w.V10': ['Planing hulls with V ≥ 10 √L<sub>WL</sub> are considered case by case by the Society.', 'Les carènes planantes avec V ≥ 10 √L<sub>WL</sub> sont examinées au cas par cas par la Société.', 'البدن الانزلاقي بسرعة V ≥ 10 √L<sub>WL</sub> تدرسه هيئة التصنيف حالة بحالة.'],
  'w.HSC': ['High speed craft (HSC, crew transfer vessels) are covered by NR396, not NR600.', 'Les navires à grande vitesse (HSC, navires de transfert d’équipage) relèvent du NR396, pas du NR600.', 'المراكب السريعة (HSC وقوارب نقل الطواقم) يغطيها NR396 وليس NR600.'],
  'cp.h': ['Panel and loads', 'Panneau et charges', 'اللوح والأحمال'],
  'f.plate': ['Panel from plating list', 'Panneau de la liste des bordés', 'لوح من قائمة الألواح'],
  'f.resin': ['Resin', 'Résine', 'الراتنج'],
  'opt.polyester': ['Polyester', 'Polyester', 'بوليستر'],
  'opt.vinylester': ['Vinylester', 'Vinylester', 'فينيل إستر'],
  'opt.epoxy': ['Epoxy', 'Époxy', 'إيبوكسي'],
  'f.process': ['Process', 'Procédé', 'طريقة التصنيع'],
  'opt.handLayUp': ['Hand lay-up', 'Moulage au contact', 'تصفيح يدوي'],
  'opt.infusion': ['Infusion / vacuum', 'Infusion / sous vide', 'حقن / تفريغ'],
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
  'th.sfreq': ['SF required', 'SF requis', 'SF المطلوب'],
  'th.util': ['Utilisation', 'Taux d’utilisation', 'نسبة الاستخدام'],
  'comp.fine': ['Rule safety factors from NR600 Ch 2, Sec 3, [3.2]: SF = C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub> and SF<sub>CS</sub> = C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub>, with C<sub>i</sub> = 1.0 (sea), 0.8 (slamming), 0.6 (side impact).', 'Coefficients de sécurité du NR600 Ch 2, Sec 3, [3.2] : SF = C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub> et SF<sub>CS</sub> = C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub>, avec C<sub>i</sub> = 1,0 (mer), 0,8 (tossage), 0,6 (impact latéral).', 'معاملات الأمان من NR600 الفصل 2، القسم 3، [3.2]: SF = C<sub>V</sub>·C<sub>F</sub>·C<sub>R</sub>·C<sub>i</sub> و SF<sub>CS</sub> = C<sub>CS</sub>·C<sub>V</sub>·C<sub>F</sub>·C<sub>i</sub>، حيث C<sub>i</sub> = 1.0 (البحر)، 0.8 (ارتطام القاع)، 0.6 (الارتطام الجانبي).'],
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
  'mode.fibre': ['fibre direction', 'sens des fibres', 'اتجاه الألياف'],
  'mode.transverse': ['transverse', 'transverse', 'الاتجاه العرضي'],
  'mode.shear': ['in-plane shear', 'cisaillement plan', 'القص في المستوى'],
  'mode.combined': ['combined (Hoffman)', 'combiné (Hoffman)', 'مركّب (Hoffman)'],
  'mode.interlaminar': ['interlaminar shear', 'cisaillement interlaminaire', 'القص بين الطبقات'],
  'comp.ok': ['Laminate OK', 'Stratifié conforme', 'التصفيح مطابق'],
  'comp.ko': ['Laminate not OK', 'Stratifié non conforme', 'التصفيح غير مطابق'],
  'comp.util': ['Maximum utilisation {u} % of the rule safety factor, governing load: {l}', 'Taux d’utilisation maximal {u} % du coefficient de sécurité, charge dimensionnante : {l}', 'أقصى نسبة استخدام {u} % من معامل الأمان، والحمل الحاكم: {l}'],
  'comp.advice': ['Increase the laminate or reduce the panel size.', 'Renforcez le stratifié ou réduisez la taille du panneau.', 'زِد التصفيح أو صغّر أبعاد اللوح.'],
  'comp.check': ['Check input', 'Vérifier les données', 'تحقق من المدخلات'],
  'comp.noLayer': ['Add at least one layer.', 'Ajoutez au moins un pli.', 'أضف طبقة واحدة على الأقل.'],
  'comp.thick': ['Thickness', 'Épaisseur', 'السماكة'],
  'comp.areal': ['Areal mass', 'Masse surfacique', 'الكتلة لكل متر مربع'],
  'comp.panel': ['Panel a × b', 'Panneau a × b', 'اللوح a × b'],
  'comp.loadPoint': ['Load point', 'Point de calcul', 'نقطة حساب الحمل'],
  'comp.lowerEdge': ['lower edge (monolithic)', 'bord inférieur (monolithique)', 'الحافة السفلى (طبقة واحدة)'],
  'comp.middle': ['mid-panel (sandwich)', 'milieu du panneau (sandwich)', 'منتصف اللوح (سندويتش)'],
  'a.name': ['name', 'nom', 'الاسم'],
  'a.remove': ['Remove', 'Supprimer', 'حذف'],
  'a.layer': ['Layer', 'Pli', 'الطبقة'],
  'new.panel': ['Panel {n}', 'Panneau {n}', 'لوح {n}'],
  'new.stiff': ['Stiffener {n}', 'Raidisseur {n}', 'مقوٍّ {n}'],
  'ex.bottomMid': ['Bottom, midship', 'Fond, milieu', 'القاع، الوسط'],
  'ex.bottomFwd': ['Bottom, forward', 'Fond, avant', 'القاع، الأمام'],
  'ex.side': ['Side shell', 'Muraille', 'الجانب'],
  'ex.deck': ['Working deck', 'Pont de travail', 'سطح العمل'],
  'ex.floor': ['Bottom floor', 'Varangue', 'أرضية القاع'],
  'ex.frame': ['Side frame', 'Membrure de muraille', 'ضلع الجانب'],
  'ex.beam': ['Deck beam', 'Barrot de pont', 'عارضة السطح'],
  'notes.h': ['Scope and limits', 'Domaine d’application et limites', 'نطاق التطبيق والحدود'],
  'notes.1': ['Preliminary results only. Not valid for construction, approval or classification.', 'Résultats préliminaires uniquement. Non valables pour la construction, l’approbation ou la classification.', 'نتائج أولية فقط، لا تصلح للبناء ولا للمصادقة ولا للتصنيف.'],
  'notes.2': ['Monohulls only. Primary supporting members, hull girder strength, buckling, internal and wheeled loads are not yet included.', 'Monocoques uniquement. Les membrures principales, la résistance de la poutre navire, le flambement, les charges internes et roulantes ne sont pas encore intégrés.', 'القوارب أحادية البدن فقط. لم تُدمج بعد المقويات الرئيسية، ومقاومة جسم السفينة ككل، والانبعاج، والأحمال الداخلية وأحمال العجلات.'],
  'notes.3': ['Composite side impact is applied as a uniform pressure over the panel and the dynamic amplification factor K_DA is taken as 1; both are conservative simplifications for monolithic panels and must be reviewed for sandwich panels.', 'L’impact latéral sur composite est appliqué comme une pression uniforme sur le panneau et le facteur d’amplification dynamique K_DA est pris égal à 1 ; ces simplifications sont prudentes pour le monolithique et sont à revoir pour le sandwich.', 'يُطبَّق الارتطام الجانبي على المواد المركبة كضغط منتظم على اللوح، ويؤخذ معامل التضخيم الديناميكي K_DA مساويًا لـ 1. هذان تبسيطان محافظان للألواح أحادية الطبقة، ويجب مراجعتهما لألواح السندويتش.'],
  'notes.4': ['Calculations follow Bureau Veritas NR600 (March 2026) and NR546 (November 2022). The rule texts are not reproduced; consult them for the complete requirements.', 'Les calculs suivent le NR600 (mars 2026) et le NR546 (novembre 2022) du Bureau Veritas. Les textes ne sont pas reproduits ; s’y référer pour l’ensemble des exigences.', 'تتبع الحسابات NR600 (مارس 2026) و NR546 (نوفمبر 2022) من Bureau Veritas. لا تُنسخ نصوص القواعد هنا، ويجب الرجوع إليها لكامل المتطلبات.'],
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
