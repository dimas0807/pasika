// Cloudflare Pages Functions serverless edge API for М'ясний рай у Галинки
// Handles all /api/* routes on Cloudflare Pages deployment
// Supports optional reverse proxy to standalone backend via env.BACKEND_URL or env.API_URL,
// and provides a complete standalone edge API with full Galinka store functionality.

const DEFAULT_SECRET = "galinka_edge_secret_key_prod_2026_secured";

const SEED_CATEGORIES = [
  {
    "slug": "domashni-kovbasy",
    "name": "Домашні ковбаси",
    "icon": "🌭",
    "sort_order": 1
  },
  {
    "slug": "kopchene-myaso",
    "name": "Копчене м’ясо",
    "icon": "🥩",
    "sort_order": 2
  },
  {
    "slug": "kuryache-kopchene",
    "name": "Куряче копчене",
    "icon": "🍗",
    "sort_order": 3
  },
  {
    "slug": "vareni-kovbasy",
    "name": "Варені ковбаси",
    "icon": "🥓",
    "sort_order": 4
  },
  {
    "slug": "sardelky-ta-kovbasky",
    "name": "Сардельки та ковбаски",
    "icon": "🌭",
    "sort_order": 5
  },
  {
    "slug": "inshe",
    "name": "Інше",
    "icon": "🍲",
    "sort_order": 6
  },
  {
    "slug": "pashtetky",
    "name": "Паштетки",
    "icon": "🥫",
    "sort_order": 7
  },
  {
    "slug": "domashnye",
    "name": "Домашнє",
    "icon": "🧂",
    "sort_order": 8
  },
  {
    "slug": "podarunkovi-boksy",
    "name": "Подарункові бокси",
    "icon": "🎁",
    "sort_order": 9
  }
];

const SEED_PRODUCTS = [
  {
    "id": "prod_dk_1",
    "slug": "kovbasa-lupana-domashnya",
    "name": "Ковбаса лупана (домашня)",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 450,
    "oldPrice": null,
    "stock": 45,
    "featured": true,
    "giftBox": false,
    "description": "Справжня українська домашня ковбаса лупана за родинним рецептом. Натуральна оболонка, свіжа свинина, часник, духмяні прянощі та легке запікання.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_2",
    "slug": "kovbasa-rublena-fileyna",
    "name": "Ковбаса рублена (філейна)",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 420,
    "oldPrice": null,
    "stock": 40,
    "featured": true,
    "giftBox": false,
    "description": "Соковита рублена ковбаса з добірного свинячого філе. Виразна м'ясна фактура, делікатні спеції та виняткова соковитість.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_3",
    "slug": "kovbasa-rublena-klub-fileyka",
    "name": "Ковбаса рублена (клуб + філейка)",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 400,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Апетитна рублена ковбаса з комбінації соковитої стегнової частини та ніжної філейки. Збалансований та гармонійний смак.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_4",
    "slug": "kovbasa-rublena-lopatka",
    "name": "Ковбаса рублена (лопатка)",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 380,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Класична домашня ковбаса з рубаної свинячої лопатки з додаванням часничку та меленого перцю за традиційним народним рецептом.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_5",
    "slug": "kovbasa-melena-z-salom",
    "name": "Ковбаса мелена (з салом)",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 360,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Ніжна домашня мелена ковбаска з апетитними вкрапленнями свіжого сала. Дуже соковита, запашна та ситна.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_6",
    "slug": "kovbasa-melena-bilshe-sala",
    "name": "Ковбаса мелена більше сала",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 280,
    "oldPrice": null,
    "stock": 30,
    "featured": false,
    "giftBox": false,
    "description": "Ситна домашня ковбаса зі щедрим додаванням сала та часнику. Ідеально підходить для смаження на пательні або запікання з картоплею.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_dk_7",
    "slug": "kovbasa-kuryacha-fileyna",
    "name": "Ковбаса куряча філейна",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 380,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Дієтична та ніжна домашня ковбаса з чистих курячих грудок. Соковита, легка, без зайвого жиру, подобається дітям.",
    "image": "kurochka"
  },
  {
    "id": "prod_dk_8",
    "slug": "kovbasa-pechena-kuryacha",
    "name": "Ковбаса печена куряча",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 450,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Печена в печі куряча ковбаса до рум'яної скоринки. Натуральне м'ясо птиці, легкі спеції та вишуканий аромат домашньої випічки.",
    "image": "kurochka"
  },
  {
    "id": "prod_dk_9",
    "slug": "kovbasa-pechena-svynya",
    "name": "Ковбаса печена свиня",
    "category": "domashni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 450,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Святкова печена домашня ковбаса зі свинини. Свіжий часник, сухі прянощі, золотиста оболонка та неперевершений смак свята.",
    "image": "kovbasa-domashnya"
  },
  {
    "id": "prod_km_1",
    "slug": "balychok-kopchenyy",
    "name": "Баличок копчений",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Найніжніший свинячий баличок помірного соління, копчений на сухій вільсі. М'яка волокниста текстура, тонкий аромат натурального димка.",
    "image": "balyk"
  },
  {
    "id": "prod_km_2",
    "slug": "oshyyok-yak-shashlyk",
    "name": "Ошийок (як шашлик)",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Мармуровий свинячий ошийок із насиченим смаком справжнього шашлику на дровах. Надзвичайно соковитий та ніжний.",
    "image": "shynka"
  },
  {
    "id": "prod_km_3",
    "slug": "rulet-z-chornoslyvom",
    "name": "Рулет з чорносливом",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Вишуканий м'ясний рулет гарячого копчення з начинкою із солодкого в'яленого чорносливу. Чудово прикрашає святковий стіл.",
    "image": "shynka"
  },
  {
    "id": "prod_km_4",
    "slug": "rulet-z-kurahoyu",
    "name": "Рулет з курагою",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 25,
    "featured": false,
    "giftBox": false,
    "description": "М'ясний делікатесний рулет із добірною курагою. Ніжне м'ясо з димком та пікантний фруктовий посмак.",
    "image": "shynka"
  },
  {
    "id": "prod_km_5",
    "slug": "pidcherevyna-kopchena",
    "name": "Підчеревина",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 450,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Багаті м'ясні прошарки, тануче сало та рум'яна копчена скоринка. Традиційне українське копчення на фруктових та вільхових дровах.",
    "image": "pidcherevyna"
  },
  {
    "id": "prod_km_6",
    "slug": "salo-kopchene",
    "name": "Сало копчене",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 250,
    "oldPrice": null,
    "stock": 40,
    "featured": false,
    "giftBox": false,
    "description": "Ароматне сало гарячого копчення на дровах. М'яке, як масло, з гарним золотистим кольором та чистим димним запахом.",
    "image": "salo"
  },
  {
    "id": "prod_km_7",
    "slug": "rebertsya-kopcheni",
    "name": "Реберця",
    "category": "kopchene-myaso",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "М'ясисті соковиті свинячі ребра гарячого копчення. Неперевершений аромат, смакують самостійно або до домашнього борщу.",
    "image": "rebertsya"
  },
  {
    "id": "prod_kk_1",
    "slug": "kurka-kopchena",
    "name": "Курка копчена",
    "category": "kuryache-kopchene",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Ціла соковита курочка гарячого копчення на вільсі. Золотава хрумка шкірочка та ніжне, просочене димком м'ясо.",
    "image": "kurochka"
  },
  {
    "id": "prod_kk_2",
    "slug": "okorochok-kopchenyy",
    "name": "Окорочок",
    "category": "kuryache-kopchene",
    "weight": "1 кг",
    "unit": "кг",
    "price": 280,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Апетитний курячий окорочок гарячого копчення. Соковитий, м'який та з насиченим смаком домашнього диму.",
    "image": "kurochka"
  },
  {
    "id": "prod_kk_3",
    "slug": "kryla-kopcheni",
    "name": "Крила",
    "category": "kuryache-kopchene",
    "weight": "1 кг",
    "unit": "кг",
    "price": 280,
    "oldPrice": null,
    "stock": 30,
    "featured": false,
    "giftBox": false,
    "description": "Золотисті курячі крильця з делікатним копченням. Ідеальна закуска для компанії та святкового частування.",
    "image": "kurochka"
  },
  {
    "id": "prod_kk_4",
    "slug": "file-kuryache-kopchene",
    "name": "Філе",
    "category": "kuryache-kopchene",
    "weight": "1 кг",
    "unit": "кг",
    "price": 380,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Добірне копчене куряче філе без кісток та шкіри. М'яке, не сухе, з вишуканими прянощами.",
    "image": "kurochka"
  },
  {
    "id": "prod_kk_5",
    "slug": "rulety-kuryachi",
    "name": "Рулети курячі",
    "category": "kuryache-kopchene",
    "weight": "1 кг",
    "unit": "кг",
    "price": 380,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Ніжні домашні курячі рулети гарячого копчення. Тонко нарізаються для вишуканої м'ясної тарілки.",
    "image": "kurochka"
  },
  {
    "id": "prod_vk_1",
    "slug": "kovbasa-molochna",
    "name": "Молочна",
    "category": "vareni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 250,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Класична домашня молочна варена ковбаса. Ніжна кремова структура, натуральне молоко, свіже м'ясо без фосфатів.",
    "image": "sardelky"
  },
  {
    "id": "prod_vk_2",
    "slug": "kovbasa-nizhna",
    "name": "Ніжна",
    "category": "vareni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 200,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Легка варена ковбаса з помірною пряністю. Створена для легких сніданків, салатів та бутербродів.",
    "image": "sardelky"
  },
  {
    "id": "prod_vk_3",
    "slug": "kovbasa-fileyna-varena",
    "name": "Філейна",
    "category": "vareni-kovbasy",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Преміальна варена ковбаса з чистого філе. Пружна, м'ясна, бездоганна на смак.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_1",
    "slug": "sardelky-molochni",
    "name": "Молочні",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 250,
    "oldPrice": null,
    "stock": 40,
    "featured": true,
    "giftBox": false,
    "description": "Соковиті домашні молочні сардельки у тонкій натуральній оболонці. При варінні лопаються соком.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_2",
    "slug": "sardelky-nizhni",
    "name": "Ніжні",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 200,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "М'які ніжні сардельки з відбірного фермерського м'яса зі свіжими приправами.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_3",
    "slug": "sardelky-fileyni",
    "name": "Філейні",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Сардельки вищого ґатунку з добірного філе. М'ясисті, пружні та надзвичайно смачні.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_4",
    "slug": "pechinkovi-kovbasky",
    "name": "Печінкові ковбаски",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 120,
    "oldPrice": null,
    "stock": 30,
    "featured": false,
    "giftBox": false,
    "description": "Традиційні домашні ковбаски зі свіжої печінки з цибулькою та спеціями за старовинним рецептом.",
    "image": "pashtet"
  },
  {
    "id": "prod_sk_5",
    "slug": "liverna-kovbasa",
    "name": "Ліверна ковбаса",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 120,
    "oldPrice": null,
    "stock": 30,
    "featured": false,
    "giftBox": false,
    "description": "Справжня домашня ліверна ковбаса з чистих натуральних складників. Ніжна текстура та багатий смак.",
    "image": "pashtet"
  },
  {
    "id": "prod_sk_6",
    "slug": "sardelky-kopcheni",
    "name": "Сардельки копчені",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 200,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Ароматні сардельки гарячого копчення на вільхових дровах. Хрумка натуральна оболонка та соковитий м'ясний смак.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_7",
    "slug": "sardelky-tsyharky",
    "name": "Сардельки цигарки",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 200,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Тонкі подовжені домашні ковбаски-цигарки. Зручний формат для швидкого перекусу чи смаження на вогні.",
    "image": "sardelky"
  },
  {
    "id": "prod_sk_8",
    "slug": "myslyvski-kovbasky",
    "name": "Мисливські ковбаски",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 250,
    "oldPrice": null,
    "stock": 40,
    "featured": true,
    "giftBox": false,
    "description": "Пікантні напівкопчені мисливські ковбаски з часником та чорним перцем. Пружні, з димним ароматом.",
    "image": "kovbasa-kopchena"
  },
  {
    "id": "prod_sk_9",
    "slug": "kovbasky-khot-doh",
    "name": "Ковбаски хот-дог",
    "category": "sardelky-ta-kovbasky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 250,
    "oldPrice": null,
    "stock": 35,
    "featured": false,
    "giftBox": false,
    "description": "Спеціальні ніжні м'ясні ковбаски ідеальної форми для домашніх хот-догів та бутербродів.",
    "image": "sardelky"
  },
  {
    "id": "prod_in_1",
    "slug": "shashlyk-kuryachyy-hryl",
    "name": "Шашлик курячий (на грилі)",
    "category": "inshe",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Замаринований за секретним родинним рецептом та обсмажений на грилі соковитий курячий шашлик.",
    "image": "kurochka"
  },
  {
    "id": "prod_in_2",
    "slug": "shynka-svynyna-kurka",
    "name": "Шинка (свинина + курка)",
    "category": "inshe",
    "weight": "1 кг",
    "unit": "кг",
    "price": 400,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Соковита домашня шинка з добірної нежирної свинини та соковитої курки. Прекрасний візерунок на зрізі та делікатний смак.",
    "image": "shynka"
  },
  {
    "id": "prod_pt_1",
    "slug": "pashtet-kuryachyy",
    "name": "Курячий (філе + окорочок)",
    "category": "pashtetky",
    "weight": "350 г",
    "unit": "шт",
    "price": 220,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Ніжний кремовий паштет з курячого філе та окорочка, запечений з морквою, цибулею та вершковим маслом.",
    "image": "pashtet"
  },
  {
    "id": "prod_pt_2",
    "slug": "pashtet-pechinkovyy-svynyachyy",
    "name": "Печінковий свинячий (печінка + м’ясо)",
    "category": "pashtetky",
    "weight": "350 г",
    "unit": "шт",
    "price": 220,
    "oldPrice": null,
    "stock": 35,
    "featured": true,
    "giftBox": false,
    "description": "Традиційний запечений паштет зі свіжої свинячої печінки та м'яса. Справжня домашня класика.",
    "image": "pashtet"
  },
  {
    "id": "prod_pt_3",
    "slug": "saltyson-yazykovyy",
    "name": "Сальтисон язиковий",
    "category": "pashtetky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Шляхетний домашній сальтисон із відвареним свинячим язиком, часничком та духмяним перцем.",
    "image": "shynka"
  },
  {
    "id": "prod_pt_4",
    "slug": "pechene-myaso",
    "name": "Печене м’ясо",
    "category": "pashtetky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Цілісний шматок свинини, запечений за традиційним домашнім рецептом до соковитості та золотої скоринки.",
    "image": "balyk"
  },
  {
    "id": "prod_pt_5",
    "slug": "pechenyy-rulet",
    "name": "Печений рулет",
    "category": "pashtetky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 25,
    "featured": false,
    "giftBox": false,
    "description": "Домашній м'ясний рулет зі спеціями, повільно випечений у печі до ідеальної м'якості.",
    "image": "shynka"
  },
  {
    "id": "prod_pt_6",
    "slug": "oshyyok-pechenyy",
    "name": "Ошийок печений",
    "category": "pashtetky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 480,
    "oldPrice": null,
    "stock": 25,
    "featured": true,
    "giftBox": false,
    "description": "Соковитий свинячий ошийок тривалого запікання з часником та пряними травами.",
    "image": "shynka"
  },
  {
    "id": "prod_pt_7",
    "slug": "kovbasovyy-syr",
    "name": "Ковбасовий сир",
    "category": "pashtetky",
    "weight": "1 кг",
    "unit": "кг",
    "price": 300,
    "oldPrice": null,
    "stock": 30,
    "featured": false,
    "giftBox": false,
    "description": "Натуральний копчений ковбасний сир із золотистою скоринкою та вершково-димним присмаком.",
    "image": "kovbasa-kopchena"
  },
  {
    "id": "prod_dm_1",
    "slug": "salo-domashnye",
    "name": "Сало",
    "category": "domashnye",
    "weight": "1 кг",
    "unit": "кг",
    "price": 350,
    "oldPrice": null,
    "stock": 40,
    "featured": true,
    "giftBox": false,
    "description": "Справжнє добірне українське домашнє сало сухого засолу з часничком, перцем та пряними спеціями.",
    "image": "salo"
  },
  {
    "id": "prod_dm_2",
    "slug": "solonyna",
    "name": "Солонина",
    "category": "domashnye",
    "weight": "1 кг",
    "unit": "кг",
    "price": 350,
    "oldPrice": null,
    "stock": 30,
    "featured": true,
    "giftBox": false,
    "description": "Традиційна українська солонина витриманого сухого посолу. М'яка, пружна, неперевершено смакує з чорним хлібом.",
    "image": "salo"
  },
  {
    "id": "box_myasnyy",
    "slug": "boks-myasnyy",
    "name": "М’ясний бокс",
    "category": "podarunkovi-boksy",
    "weight": "набір (~2.5 кг)",
    "unit": "набір",
    "price": 1200,
    "oldPrice": null,
    "stock": 20,
    "featured": true,
    "giftBox": true,
    "description": "Добірний асорті-бокс кращих м'ясних делікатесів: домашня ковбаса, баличок копчений, рулет та свіже сало у подарунковій крафтовій коробці.",
    "image": "prod-gift-box",
    "boxItems": "[{\"name\":\"Ковбаса лупана (домашня)\",\"qty\":1},{\"name\":\"Баличок копчений\",\"qty\":1},{\"name\":\"Сало копчене\",\"qty\":1}]"
  },
  {
    "id": "box_do_svyata",
    "slug": "boks-do-svyata",
    "name": "Бокс до свята",
    "category": "podarunkovi-boksy",
    "weight": "набір (~3 кг)",
    "unit": "набір",
    "price": 1500,
    "oldPrice": null,
    "stock": 20,
    "featured": true,
    "giftBox": true,
    "description": "Святковий набір до столу: ковбаса рублена філейна, ошийок (як шашлик), рулет з чорносливом та язиковий сальтисон.",
    "image": "prod-gift-box",
    "boxItems": "[{\"name\":\"Ковбаса рублена (філейна)\",\"qty\":1},{\"name\":\"Ошийок (як шашлик)\",\"qty\":1},{\"name\":\"Рулет з чорносливом\",\"qty\":1},{\"name\":\"Сальтисон язиковий\",\"qty\":1}]"
  },
  {
    "id": "box_viyskovy",
    "slug": "boks-dlya-viyskovoho",
    "name": "Бокс для військового",
    "category": "podarunkovi-boksy",
    "weight": "набір (~2.8 кг)",
    "unit": "набір",
    "price": 1350,
    "oldPrice": null,
    "stock": 20,
    "featured": true,
    "giftBox": true,
    "description": "Поживний, ситний та тривалого зберігання набір: домашня ковбаса, солонина, копчене сало, мисливські ковбаски та запечений паштет у вакуумній термоупаковці.",
    "image": "prod-gift-box",
    "boxItems": "[{\"name\":\"Ковбаса лупана (домашня)\",\"qty\":1},{\"name\":\"Солонина\",\"qty\":1},{\"name\":\"Сало копчене\",\"qty\":1},{\"name\":\"Мисливські ковбаски\",\"qty\":1},{\"name\":\"Печінковий свинячий\",\"qty\":1}]"
  },
  {
    "id": "box_simeynyy",
    "slug": "boks-simeynyy",
    "name": "Сімейний бокс",
    "category": "podarunkovi-boksy",
    "weight": "набір (~3.2 кг)",
    "unit": "набір",
    "price": 1400,
    "oldPrice": null,
    "stock": 20,
    "featured": true,
    "giftBox": true,
    "description": "Великий смачний набір для всієї родини: варена молочна ковбаса, курячий рулет, баличок, ніжні сардельки та паштет.",
    "image": "prod-gift-box",
    "boxItems": "[{\"name\":\"Молочна\",\"qty\":1},{\"name\":\"Баличок копчений\",\"qty\":1},{\"name\":\"Рулети курячі\",\"qty\":1},{\"name\":\"Молочні сардельки\",\"qty\":1},{\"name\":\"Курячий паштет\",\"qty\":1}]"
  },
  {
    "id": "box_podarunkovyy",
    "slug": "boks-podarunkovyy",
    "name": "Подарунковий бокс",
    "category": "podarunkovi-boksy",
    "weight": "набір (~3.5 кг)",
    "unit": "набір",
    "price": 1600,
    "oldPrice": null,
    "stock": 20,
    "featured": true,
    "giftBox": true,
    "description": "Преміальний набір делікатесів у святковому крафтовому пакуванні: баличок, печене м'ясо, рулет з курагою, ковбаса печена свиня та ковбасний сир.",
    "image": "prod-gift-box",
    "boxItems": "[{\"name\":\"Баличок копчений\",\"qty\":1},{\"name\":\"Печене м’ясо\",\"qty\":1},{\"name\":\"Рулет з курагою\",\"qty\":1},{\"name\":\"Ковбаса печена свиня\",\"qty\":1},{\"name\":\"Ковбасовий сир\",\"qty\":1}]"
  },
  {
    "id": "custom_box",
    "slug": "vlasnyy-podarunkovyy-boks",
    "name": "Власний подарунковий бокс",
    "category": "podarunkovi-boksy",
    "weight": "набір",
    "unit": "набір",
    "price": 0,
    "oldPrice": null,
    "stock": 9999,
    "featured": false,
    "giftBox": true,
    "description": "Індивідуальний подарунковий бокс, зібраний покупцем у нашому онлайн-конструкторі.",
    "image": "prod-gift-box",
    "boxItems": "[]"
  }
];

const DEFAULT_SETTINGS = {
  store: {
    name: "М'ясний рай у Галинки",
    tagline: "Домашні ковбаси та копченості",
    phone: "+380 68 025 78 77",
    viber: "+380680257877",
    tiktok: "@kopchonosti777",
    telegram: "",
    instagram: "",
    facebook: "",
    youtube: "",
    workingHours: "Пн-Сб 09:00 - 19:00, Нд 10:00 - 16:00",
    description: "Справжні домашні ковбаси, копченості, курочка, сало та паштети від Галинки. Натуральне копчення на дровах, перевірені домашні рецепти та швидка доставка Новою Поштою по всій Україні.",
  },
  about: {
    title: "Домашні копченості з душею від Галинки",
    shortText: "Мене звати Галина, і я готую для вас справжні домашні ковбаси та копченості. Тільки свіже добірне м'ясо, натуральні спеції та традиційне копчення на дровах.",
    fullDescription: "Кожен шматочок маринується за перевіреними родинними рецептами без штучних барвників та консервантів. Наше копчення — виключно на дровах вільхи та фруктових дерев, що дає неповторний аромат та золотисту скоринку. Дякуємо нашій великій аудиторії в TikTok (понад 110 тисяч підписників) за довіру!",
    followersCount: "110K+",
    likesCount: "700K+",
    foundationYear: "2020",
    location: "Україна",
  },
  contacts: {
    phone: "+380 68 025 78 77",
    viber: "+380680257877",
    tiktok: "@kopchonosti777",
    telegram: "",
    instagram: "",
    facebook: "",
    youtube: "",
    email: "",
    pickupAddress: "",
  },
  payment: {
    bank: "monobank",
    card: "",
    holder: "Галина",
    purpose: "Оплата замовлення",
    instruction: "Після оформлення замовлення на сайті Галинка зв'яжеться з вами у Viber або за телефоном для узгодження деталей.",
  },
  delivery: {
    novaPoshtaEnabled: true,
    ukrposhtaEnabled: false,
    international: {
        "enabled": true,
        "countries": "Польща, Німеччина, Чехія, Італія, Іспанія, Молдова, Литва, Латвія, Естонія, Румунія та інші країни Європи",
        "deliveryMethod": "Міжнародний перевізник (Нова Пошта Global / Meest / адресний бус)",
        "cost": "За тарифами міжнародного перевізника",
        "terms": "5–10 робочих днів у вакуумній термоупаковці з холодоелементами",
        "minOrderAmount": 1000,
        "infoText": "Доставка за кордон здійснюється перевізниками (Нова Пошта Global, Meest або пряма адресна доставка). Усі м'ясні вироби герметично вакуюються та пакуються у термобокси з акумуляторами холоду, що гарантує збереження свіжості. Після оформлення замовлення наш менеджер зв'яжеться з вами у Viber або за телефоном для узгодження адреси, тарифу та найзручнішого способу відправки."
    },
  },
  telegram: {
    botToken: "",
    chatId: "",
  },
};

const SEED_ORDERS = [
  {
    id: "ord_10001",
    number: 10001,
    orderCode: "GAL-10001",
    order_code: "GAL-10001",
    status: "CONFIRMED",
    total: 990,
    preferredContact: "viber",
    preferred_contact: "viber",
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000,
    customer: {
      firstName: "Олена",
      lastName: "Коваленко",
      phone: "+380680257877",
      email: "",
    },
    delivery: {
      provider: "Нова пошта",
      providerKey: "np",
      deliveryService: "Нова пошта",
      city: "Київ",
      branch: "Відділення №1 (вул. Пирогівський шлях, 135)",
      trackingNumber: null,
      trackingUrl: null,
    },
    payment: {
      method: "cod",
      paymentMethod: "cash_on_delivery",
      methodLabel: "Оплата при отриманні",
      paymentStatus: "Очікує оплати",
      status: "pending",
      receiptStatus: "Не потрібен",
      receipt: "not_required",
      receiptRequired: false,
    },
    receipt: null,
    items: [
      { id: "p1", name: "Ковбаса домашня запечена", weight: "1 кг", price: 450, qty: 1 },
      { id: "p3", name: "Шинка домашня копчена", weight: "1 кг", price: 540, qty: 1 },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "CONFIRMED", comment: "Підтверджено у Viber", changedBy: "admin", createdAt: Date.now() - 3600000 },
    ],
  },
];

// In-memory cache for edge worker lifetime
let memoryOrders = [...SEED_ORDERS];
let memorySettings = { ...DEFAULT_SETTINGS };
let memoryProducts = [...SEED_PRODUCTS];
let memoryCategories = [...SEED_CATEGORIES];
let memoryTelegramRecipients = [];
let memoryTelegramInteractions = [];
let memoryDeliveryAccounts = [
  {
    id: "da_default_np",
    name: "Нова Пошта (Основний акаунт)",
    provider: "np",
    apiKey: "",
    senderName: "М'ясний рай у Галинки",
    phone: "+380680257877",
    cityName: "Київ",
    warehouseName: "Відділення №1",
    isDefault: true,
    isActive: true,
    createdAt: Date.now(),
  },
];
const memoryProductImages = new Map();
const memoryReceipts = new Map();

const UKR_TO_LAT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
  "’": "", "'": "", "`": "", "ʼ": "",
};

function transliterateUa(text = "") {
  return String(text)
    .toLowerCase()
    .split("")
    .map((char) => (UKR_TO_LAT[char] !== undefined ? UKR_TO_LAT[char] : char))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveEdgeUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug || "product";
  let count = 2;
  while (true) {
    const existing = memoryProducts.find((p) => p.slug === slug && p.id !== productId);
    if (!existing) return slug;
    slug = `${baseSlug}-${count}`;
    count++;
  }
}

// ---------------- Nova Poshta Edge Delivery ----------------
const NP_DEFAULT_API_KEY = "286247cbd5b482b2f611332789acdeb0";
const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

const NP_FALLBACK_CITIES = [
  { id: "8d5a980d-391c-11dd-90d9-001a92567626", name: "Київ", fullName: "м. Київ, Київська обл.", area: "Київська область", region: "Київський р-н" },
  { id: "1ec09d88-e1c2-11e3-8c4a-0050568002cf", name: "Львів", fullName: "м. Львів, Львівська обл.", area: "Львівська область", region: "Львівський р-н" },
  { id: "db5c88f5-391c-11dd-90d9-001a92567626", name: "Одеса", fullName: "м. Одеса, Одеська обл.", area: "Одеська область", region: "Одеський р-н" },
  { id: "db5c88e0-391c-11dd-90d9-001a92567626", name: "Дніпро", fullName: "м. Дніпро, Дніпропетровська обл.", area: "Дніпропетровська область", region: "Дніпровський р-н" },
  { id: "db5c88c0-391c-11dd-90d9-001a92567626", name: "Харків", fullName: "м. Харків, Харківська обл.", area: "Харківська область", region: "Харківський р-н" },
  { id: "db5c8892-391c-11dd-90d9-001a92567626", name: "Івано-Франківськ", fullName: "м. Івано-Франківськ, Івано-Франківська обл.", area: "Івано-Франківська область", region: "Івано-Франківський р-н" },
  { id: "db5c8901-391c-11dd-90d9-001a92567626", name: "Тернопіль", fullName: "м. Тернопіль, Тернопільська обл.", area: "Тернопільська область", region: "Тернопільський р-н" },
  { id: "db5c890a-391c-11dd-90d9-001a92567626", name: "Рівне", fullName: "м. Рівне, Рівненська обл.", area: "Рівненська область", region: "Рівненський р-н" },
  { id: "db5c891b-391c-11dd-90d9-001a92567626", name: "Луцьк", fullName: "м. Луцьк, Волинська обл.", area: "Волинська область", region: "Луцький р-н" },
  { id: "db5c8942-391c-11dd-90d9-001a92567626", name: "Ужгород", fullName: "м. Ужгород, Закарпатська обл.", area: "Закарпатська область", region: "Ужгородський р-н" },
  { id: "db5c88ac-391c-11dd-90d9-001a92567626", name: "Чернівці", fullName: "м. Чернівці, Чернівецька обл.", area: "Чернівецька область", region: "Чернівецький р-н" },
  { id: "db5c888c-391c-11dd-90d9-001a92567626", name: "Вінниця", fullName: "м. Вінниця, Вінницька обл.", area: "Вінницька область", region: "Вінницький р-н" },
  { id: "db5c88f0-391c-11dd-90d9-001a92567626", name: "Житомир", fullName: "м. Житомир, Житомирська обл.", area: "Житомирська область", region: "Житомирський р-н" },
  { id: "db5c8938-391c-11dd-90d9-001a92567626", name: "Черкаси", fullName: "м. Черкаси, Черкаська обл.", area: "Черкаська область", region: "Черкаський р-н" },
  { id: "db5c88b7-391c-11dd-90d9-001a92567626", name: "Полтава", fullName: "м. Полтава, Полтавська обл.", area: "Полтавська область", region: "Полтавський р-н" },
];

async function callNovaPoshtaApi(modelName, calledMethod, methodProperties = {}, apiKey = NP_DEFAULT_API_KEY) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(NP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "GalinkaShop/1.0",
      },
      body: JSON.stringify({
        apiKey,
        modelName,
        calledMethod,
        methodProperties,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------- Edge Order Cache ----------------
async function saveOrderToEdgeCache(order) {
  try {
    const cache = caches.default;
    const resp = new Response(JSON.stringify(order), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=86400",
      },
    });
    if (order.id) await cache.put(`https://cache.internal/orders/${order.id}`, resp.clone());
    if (order.orderCode) await cache.put(`https://cache.internal/orders/${order.orderCode.toLowerCase()}`, resp.clone());
    if (order.number) await cache.put(`https://cache.internal/orders/gal-${order.number}`, resp.clone());
    const trackingNum = order.delivery?.trackingNumber || order.tracking_number;
    if (trackingNum) await cache.put(`https://cache.internal/orders/${String(trackingNum).trim().toLowerCase()}`, resp.clone());
  } catch {}
}

async function getOrderFromEdgeCache(query) {
  try {
    const cache = caches.default;
    const lower = String(query).toLowerCase().trim();
    let res = await cache.match(`https://cache.internal/orders/${lower}`);
    if (!res && !lower.startsWith("gal-") && Number(lower)) {
      res = await cache.match(`https://cache.internal/orders/gal-${lower}`);
    }
    if (res) return await res.json();
  } catch {}
  return null;
}

// ---------------- Crypto & Security Helpers ----------------
async function getHmacKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(bufferOrStr) {
  let binary = "";
  if (typeof bufferOrStr === "string") {
    binary = btoa(unescape(encodeURIComponent(bufferOrStr)));
  } else {
    const bytes = new Uint8Array(bufferOrStr);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    binary = btoa(binary);
  }
  return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let m = str.replace(/-/g, "+").replace(/_/g, "/");
  while (m.length % 4) m += "=";
  return decodeURIComponent(escape(atob(m)));
}

async function signData(data, secret) {
  const dataStr = base64UrlEncode(JSON.stringify(data));
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(dataStr));
  const sigStr = base64UrlEncode(sigBuf);
  return `${dataStr}.${sigStr}`;
}

async function verifySignedData(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [dataStr, sigStr] = token.split(".");
  if (!dataStr || !sigStr) return null;
  try {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(dataStr));
    const expectedSigStr = base64UrlEncode(expectedSigBuf);
    if (sigStr !== expectedSigStr) return null;
    const jsonStr = base64UrlDecode(dataStr);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 50000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k] = decodeURIComponent(v.join("="));
  }
  return cookies;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

// ---------------- Main Edge Request Handler ----------------
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const secret = env.SESSION_SECRET || DEFAULT_SECRET;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 1. OPTIONAL REVERSE PROXY TO STANDALONE BACKEND
  // If BACKEND_URL is configured in Cloudflare Pages environment variables,
  // proxy the request seamlessly to the Node.js backend
  const backendUrl = env.BACKEND_URL || env.API_URL;
  if (backendUrl && typeof backendUrl === "string" && backendUrl.startsWith("http")) {
    try {
      const target = new URL(backendUrl.replace(/\/$/, ""));
      const forwardUrl = new URL(url.pathname + url.search, target.origin);
      const reqHeaders = new Headers(request.headers);
      reqHeaders.set("X-Forwarded-Host", url.host);
      reqHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

      const forwardReq = new Request(forwardUrl.toString(), {
        method: request.method,
        headers: reqHeaders,
        body: ["GET", "HEAD"].includes(method) ? undefined : request.body,
        redirect: "follow",
      });

      const backendRes = await fetch(forwardReq);
      const resHeaders = new Headers(backendRes.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(backendRes.body, {
        status: backendRes.status,
        statusText: backendRes.statusText,
        headers: resHeaders,
      });
    } catch (proxyErr) {
      console.warn("[Cloudflare Pages Proxy Warning]:", proxyErr.message);
      // Fall through to native edge handler if proxy fails
    }
  }

  // Parse path segments
  const catchall = params.catchall || [];
  const path = "/" + (Array.isArray(catchall) ? catchall.join("/") : String(catchall));

  // Parse cookies & authentication
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies["galinka_session"] || cookies["pasika_session"];
  const credToken = cookies["galinka_cred"] || cookies["pasika_cred"];

  // Verify session if token exists
  let session = null;
  if (sessionToken) {
    const payload = await verifySignedData(sessionToken, secret);
    if (payload && payload.exp && payload.exp > Date.now()) {
      session = payload;
    }
  }

  // Check Bearer token header fallback
  const authHeader = request.headers.get("authorization") || "";
  if (!session && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const payload = await verifySignedData(bearerToken, secret);
    if (payload && payload.exp && payload.exp > Date.now()) {
      session = payload;
    }
  }

  // Determine current active credentials
  let activeUsername = env.ADMIN_LOGIN || "admin";
  let activeSalt = null;
  let activeHash = null;

  if (credToken) {
    const credPayload = await verifySignedData(credToken, secret);
    if (credPayload && credPayload.username && credPayload.hash && credPayload.salt) {
      activeUsername = credPayload.username;
      activeSalt = credPayload.salt;
      activeHash = credPayload.hash;
    }
  }

  async function checkPassword(user, pass) {
    if (activeHash && activeSalt) {
      if (user !== activeUsername) return false;
      const hash = await hashPassword(pass, activeSalt);
      return hash === activeHash;
    }
    const expectedUser = env.ADMIN_LOGIN || "admin";
    const expectedPass = env.ADMIN_PASSWORD;
    if (!expectedPass) return false;
    return user === expectedUser && pass === expectedPass;
  }

  // ---------------- Public Endpoints ----------------

  // Health
  if (path === "/health") {
    return jsonResponse({
      ok: true,
      store: "М'ясний рай у Галинки",
      timestamp: Date.now(),
      runtime: "cloudflare-pages-edge",
    });
  }

  // Auth: Login
  if (path === "/auth/login" && method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { login, password } = body;
      if (!login || !password) {
        return jsonResponse({ error: "Вкажіть логін і пароль" }, 400);
      }

      const isValid = await checkPassword(login.trim(), password);
      if (!isValid) {
        return jsonResponse({ error: "Невірний логін або пароль" }, 401);
      }

      const username = login.trim();
      const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const token = await signData({ username, exp, iat: Date.now() }, secret);

      const cookieVal = `galinka_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
      return jsonResponse({ success: true, username, token }, 200, {
        "Set-Cookie": cookieVal,
      });
    } catch (err) {
      return jsonResponse({ error: err.message || "Помилка авторизації" }, 500);
    }
  }

  // Auth: Check Session (Me)
  if (path === "/auth/me" && method === "GET") {
    if (!session) {
      return jsonResponse({ authenticated: false }, 401);
    }
    return jsonResponse({ authenticated: true, username: session.username });
  }

  // Auth: Logout
  if (path === "/auth/logout" && method === "POST") {
    const clearCookie = `galinka_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
    return jsonResponse({ success: true }, 200, {
      "Set-Cookie": clearCookie,
    });
  }

  // Products
  if (path === "/products" && method === "GET") {
    return jsonResponse(memoryProducts);
  }

  if (path === "/products/validate-stock" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    let valid = true;
    const errors = [];
    const adjustments = [];

    for (const item of items) {
      if (item.id === "custom_box" || item.isCustomBox || String(item.id || "").startsWith("custom_box")) continue;
      const prod = memoryProducts.find((p) => p.id === (item.productId || item.id) || p.slug === item.slug);
      if (!prod) {
        valid = false;
        errors.push({ productId: item.productId || item.id, message: `Товар "${item.name}" не знайдено` });
        continue;
      }
      const available = Math.max(0, (prod.stock || 0) - (prod.reserved_stock || 0));
      if (item.quantity > available) {
        valid = false;
        errors.push({
          productId: prod.id,
          name: prod.name,
          requested: item.quantity,
          available,
          message: `Недостатньо залишку для "${prod.name}". Доступно: ${available} шт.`,
        });
        adjustments.push({
          productId: prod.id,
          maxAllowed: available,
        });
      }
    }
    return jsonResponse({ valid, errors, adjustments });
  }

  if (path.startsWith("/products/id/") && method === "GET") {
    const id = path.replace("/products/id/", "");
    const prod = memoryProducts.find((p) => p.id === id);
    if (!prod) return jsonResponse({ error: "Товар не знайдено" }, 404);
    return jsonResponse(prod);
  }

  if (path.startsWith("/products/") && method === "GET") {
    const slug = path.replace("/products/", "");
    const prod = memoryProducts.find((p) => p.slug === slug);
    if (!prod) return jsonResponse({ error: "Товар не знайдено" }, 404);
    return jsonResponse(prod);
  }

  // Categories
  if (path === "/categories" && method === "GET") {
    return jsonResponse(memoryCategories);
  }

  // Settings (Public)
  if (path === "/settings" && method === "GET") {
    const publicSettings = { ...memorySettings };
    if (publicSettings.telegram) {
      publicSettings.telegram = {
        configured: Boolean(publicSettings.telegram.chatId),
      };
    }
    return jsonResponse(publicSettings);
  }

  // Delivery Search
  if (path === "/delivery/cities" && method === "GET") {
    const q = (url.searchParams.get("query") || url.searchParams.get("search") || "").trim();
    if (!q) return jsonResponse([]);

    const apiKey = env?.NOVA_POSHTA_API_KEY || NP_DEFAULT_API_KEY;
    try {
      const data = await callNovaPoshtaApi("Address", "searchSettlements", {
        CityName: q,
        Limit: "25",
      }, apiKey);

      if (data && data.success && Array.isArray(data.data) && data.data[0]?.Addresses) {
        const list = data.data[0].Addresses.map((a) => {
          const area = a.Area ? `${a.Area} область` : "";
          const reg = a.Region ? `${a.Region} р-н` : "";
          return {
            id: a.DeliveryCity || a.Ref,
            ref: a.Ref,
            deliveryCity: a.DeliveryCity,
            name: a.MainDescription || a.Present,
            description: a.Present || a.MainDescription,
            area: area || a.Area,
            region: [area, reg].filter(Boolean).join(", ") || area,
          };
        });
        if (list.length > 0) return jsonResponse(list);
      }
    } catch {}

    const lower = q.toLowerCase();
    const filtered = NP_FALLBACK_CITIES.filter((c) =>
      c.name.toLowerCase().includes(lower) ||
      (c.fullName && c.fullName.toLowerCase().includes(lower))
    ).map((c) => ({
      id: c.id,
      ref: c.id,
      name: c.name,
      description: c.fullName,
      area: c.area,
      region: c.area,
    }));
    return jsonResponse(filtered);
  }

  if ((path === "/delivery/branches" || path === "/delivery/warehouses") && method === "GET") {
    const cityId = (url.searchParams.get("cityId") || url.searchParams.get("cityRef") || "").trim();
    const cityName = (url.searchParams.get("cityName") || "").trim();
    const search = (url.searchParams.get("search") || url.searchParams.get("query") || "").trim();

    if (!cityId && !cityName) return jsonResponse([]);

    const apiKey = env?.NOVA_POSHTA_API_KEY || NP_DEFAULT_API_KEY;
    try {
      const methodProps = { Limit: "100" };
      if (cityId) methodProps.CityRef = cityId;
      if (cityName && !methodProps.CityRef) methodProps.CityName = cityName;
      if (search) methodProps.FindByString = search;

      const data = await callNovaPoshtaApi("AddressGeneral", "getWarehouses", methodProps, apiKey);
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const list = data.data.map((w) => ({
          id: w.Ref,
          ref: w.Ref,
          number: String(w.Number),
          name: w.Description,
          shortAddress: w.ShortAddress || "",
          address: w.ShortAddress ? `${w.SettlementDescription || ""}, ${w.ShortAddress}` : w.Description,
          category: w.CategoryOfWarehouse || (w.Description?.toLowerCase()?.includes("поштомат") ? "Postomat" : "Branch"),
          type: w.TypeOfWarehouse,
          cityName: w.SettlementDescription || "",
          areaName: w.SettlementAreaDescription || "",
        }));
        return jsonResponse(list);
      }
    } catch {}

    return jsonResponse([
      { id: `np_${cityId || "c"}_1`, ref: `np_${cityId || "c"}_1`, number: "1", name: "Відділення №1: вул. Центральна, 1", shortAddress: "вул. Центральна, 1", address: "вул. Центральна, 1", category: "Branch" },
      { id: `np_${cityId || "c"}_2`, ref: `np_${cityId || "c"}_2`, number: "2", name: "Відділення №2: вул. Соборна, 15", shortAddress: "вул. Соборна, 15", address: "вул. Соборна, 15", category: "Branch" },
      { id: `np_${cityId || "c"}_pm1`, ref: `np_${cityId || "c"}_pm1`, number: "1001", name: "Поштомат №1001: вул. Шевченка, 20", shortAddress: "вул. Шевченка, 20", address: "вул. Шевченка, 20", category: "Postomat" },
    ]);
  }

  // Public Order Creation
  if (path === "/orders" && method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));

      const rawCustomer = body.customer || {};
      const rawDelivery = body.delivery || {};
      const rawPayment = body.payment || {};

      const nameParts = (body.customerName || body.name || rawCustomer.name || body.fullName || rawCustomer.fullName || "").trim().split(/\s+/);
      const firstName = (body.firstName || rawCustomer.firstName || nameParts[0] || "").trim();
      const lastName = (body.lastName || rawCustomer.lastName || nameParts.slice(1).join(" ") || "").trim();
      const rawPhone = body.phone || rawCustomer.phone || "";
      const email = (body.email || rawCustomer.email || "").trim();
      const preferredContact = body.preferredContact || rawCustomer.preferredContact || "viber";

      const providerKey = body.providerKey || rawDelivery.providerKey || "np";
      const city = body.city || body.deliveryCity || rawDelivery.city || "";
      const branch = body.branch || body.warehouse || body.deliveryBranch || rawDelivery.branch || "";
      const region = (body.region || body.deliveryRegion || rawDelivery.region || (typeof city === "object" ? (city.area || city.region) : "") || "").trim();
      const warehouseAddress = (body.warehouseAddress || body.deliveryWarehouseAddress || rawDelivery.warehouseAddress || (typeof branch === "object" ? (branch.address || branch.shortAddress) : "") || "").trim();
      const warehouseRef = (body.warehouseRef || body.deliveryWarehouseRef || rawDelivery.warehouseRef || body.branchRef || rawDelivery.branchId || (typeof branch === "object" ? (branch.ref || branch.id) : "") || "").trim();
      const branchNumber = (body.branchNumber || body.deliveryBranchNumber || rawDelivery.branchNumber || (typeof branch === "object" ? branch.number : "") || "").trim();

      const paymentMethod = body.paymentMethod || rawPayment.method || "cod";
      const isCard = paymentMethod === "card" || paymentMethod === "card_prepay";
      const cleanPayment = isCard ? "card" : "cod";

      const receiptUrl = body.receiptUrl || body.receipt?.fileUrl || null;
      const receiptName = body.receiptName || body.receipt?.name || "Чек";

      // 1. Idempotency Check
      if (body.idempotencyKey) {
        const existing = memoryOrders.find((o) => o.idempotencyKey === body.idempotencyKey);
        if (existing) {
          return jsonResponse({
            success: true,
            order: existing,
            customerToken: existing.customerToken,
            duplicate: true,
          }, 200);
        }
      }

      // 2. Validate Customer Details
      if (!firstName || !lastName) {
        return jsonResponse({ error: "Вкажіть ім'я та прізвище" }, 400);
      }

      const digits = String(rawPhone).replace(/\D/g, "");
      let normalizedPhone = null;
      if (digits.length === 10 && digits.startsWith("0")) normalizedPhone = "+38" + digits;
      else if (digits.length === 11 && digits.startsWith("80")) normalizedPhone = "+3" + digits;
      else if (digits.length === 12 && digits.startsWith("380")) normalizedPhone = "+" + digits;

      if (!normalizedPhone) {
        return jsonResponse({
          error: "Введіть коректний номер телефону України (наприклад, +380 67 123 45 67)",
        }, 400);
      }

      // 3. Validate Delivery
      const cityName = typeof city === "object" ? city.name : String(city).trim();
      const branchName = typeof branch === "object" ? branch.name : String(branch).trim();
      if (!cityName || !branchName) {
        return jsonResponse({ error: "Оберіть місто та відділення доставки" }, 400);
      }

      // 4. Validate Payment
      if (isCard && !receiptUrl) {
        return jsonResponse({
          error: "Для способу «Оплатити зараз» обов'язково завантажте чек про оплату",
        }, 400);
      }

      // 5. Validate Items & Stock Check
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse({ error: "Кошик порожній" }, 400);
      }

      let calculatedTotal = 0;
      const orderItems = [];

      for (const item of items) {
        const itemId = item.id || item.productId;
        const qty = Number(item.qty != null ? item.qty : item.quantity);
        if (!itemId || !Number.isInteger(qty) || qty <= 0) {
          return jsonResponse({ error: "Некоректні товари у кошику" }, 400);
        }
        const prod = memoryProducts.find((p) => p.id === itemId);
        if (!prod) {
          return jsonResponse({ error: `Товар не знайдено` }, 400);
        }
        if (prod.stock < qty) {
          return jsonResponse({
            error: `Недостатньо товару «${prod.name}» на складі. Доступно: ${prod.stock} шт.`,
          }, 400);
        }

        prod.stock -= qty;
        calculatedTotal += prod.price * qty;
        orderItems.push({
          id: prod.id,
          name: prod.name,
          weight: prod.weight,
          price: prod.price,
          qty,
        });
      }

      const orderNumber = 10000 + memoryOrders.length + 1;
      const orderCode = `GAL-${orderNumber}`;
      const orderId = "ord_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
      const customerToken = "ctk_" + Math.random().toString(36).substring(2, 14);

      const newOrder = {
        id: orderId,
        number: orderNumber,
        orderCode,
        order_code: orderCode,
        status: isCard ? "AWAITING_PAYMENT" : "NEW",
        total: calculatedTotal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preferredContact,
        preferred_contact: preferredContact,
        idempotencyKey: body.idempotencyKey || null,
        customer: {
          firstName,
          lastName,
          phone: normalizedPhone,
          email: email || "",
        },
        delivery: {
          provider: "Нова пошта",
          providerKey,
          deliveryService: "Нова пошта",
          city: cityName,
          cityId: body.cityRef || body.deliveryCityId || rawDelivery.cityId || null,
          region: region || null,
          branch: branchName,
          branchId: warehouseRef || null,
          branchNumber: branchNumber || null,
          warehouseAddress: warehouseAddress || null,
          warehouseRef: warehouseRef || null,
          trackingNumber: null,
          trackingUrl: null,
          shippedAt: null,
          completedAt: null,
        },
        payment: {
          method: cleanPayment,
          paymentMethod: isCard ? "card" : "cash_on_delivery",
          methodLabel: isCard ? "Оплачено наперед" : "Оплата при отриманні",
          paymentStatus: isCard ? "Чек на перевірці" : "Очікує оплати",
          status: isCard ? "receipt_review" : "pending",
          receiptStatus: isCard ? "Прикріплено" : "Не потрібен",
          receipt: isCard ? "attached" : "not_required",
          receiptRequired: isCard,
        },
        comment: body.comment ? String(body.comment).trim() : "",
        receipt: isCard && receiptUrl
          ? {
              fileUrl: receiptUrl,
              name: receiptName || "Чек",
            }
          : null,
        items: orderItems,
        customerToken,
      };

      memoryOrders.unshift(newOrder);
      await saveOrderToEdgeCache(newOrder);

      return jsonResponse({ success: true, order: newOrder, customerToken }, 201);
    } catch (err) {
      return jsonResponse({ error: err.message || "Помилка створення замовлення" }, 500);
    }
  }

  // Public Order Tracking
  if (path.startsWith("/orders/track/") && method === "GET") {
    const rawQuery = decodeURIComponent(path.replace("/orders/track/", "")).trim();
    const cleanNum = Number(rawQuery.replace(/^(gal|pas)-/i, ""));
    const matchOrder = (o) =>
      String(o.id) === rawQuery ||
      (cleanNum && o.number === cleanNum) ||
      (o.orderCode && o.orderCode.toLowerCase() === rawQuery.toLowerCase()) ||
      (o.order_code && o.order_code.toLowerCase() === rawQuery.toLowerCase()) ||
      (o.delivery?.trackingNumber && o.delivery.trackingNumber === rawQuery) ||
      (o.tracking_number && o.tracking_number === rawQuery);

    let order = memoryOrders.find(matchOrder) || SEED_ORDERS.find(matchOrder);
    if (!order) {
      order = await getOrderFromEdgeCache(rawQuery);
      if (order) memoryOrders.unshift(order);
    }
    if (!order) {
      return jsonResponse({ found: false, error: "Замовлення з таким номером або ТТН не знайдено" }, 404);
    }

    const deliveryService = order.delivery?.deliveryService || order.delivery?.provider || "Нова пошта";
    const trackingNumber = order.delivery?.trackingNumber || order.tracking_number || null;
    let trackingUrl = order.delivery?.trackingUrl || null;
    if (trackingNumber && !trackingUrl) {
      trackingUrl = `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(trackingNumber)}`;
    }

    const deliveryObj = {
      service: deliveryService,
      provider: order.delivery?.provider || deliveryService,
      city: order.delivery?.city || "",
      region: order.delivery?.region || "",
      branch: order.delivery?.branch || "",
      branchNumber: order.delivery?.branchNumber || null,
      warehouseAddress: order.delivery?.warehouseAddress || "",
      warehouseRef: order.delivery?.warehouseRef || order.delivery?.branchId || "",
      trackingNumber,
      trackingUrl,
      shippedAt: order.delivery?.shippedAt || order.shipped_at || null,
      completedAt: order.delivery?.completedAt || order.completed_at || null,
    };

    return jsonResponse({
      found: true,
      id: order.id,
      number: order.number,
      orderCode: order.orderCode || `GAL-${order.number}`,
      order_code: order.orderCode || `GAL-${order.number}`,
      status: order.status,
      statusLabel: order.status === "DELIVERED" ? "Доставлено" : (order.status === "SHIPPED" ? "Відправлено" : "В обробці"),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      total: order.total,
      delivery: deliveryObj,
      items: (order.items || []).map((i) => ({
        name: i.name,
        weight: i.weight,
        qty: i.qty,
        price: i.price,
      })),
      order: {
        id: order.id,
        number: order.number,
        orderCode: order.orderCode || `GAL-${order.number}`,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        delivery: deliveryObj,
        customerFirstName: order.customer?.firstName ? `${order.customer.firstName[0]}***` : "",
      },
    });
  }

  // Public Order Lookup by ID
  if (path.startsWith("/orders/") && method === "GET") {
    const id = path.replace("/orders/", "");
    const matchOrder = (o) => o.id === id || o.orderCode === id || o.order_code === id;
    let order = memoryOrders.find(matchOrder) || SEED_ORDERS.find(matchOrder);
    if (!order) {
      order = await getOrderFromEdgeCache(id);
      if (order) memoryOrders.unshift(order);
    }
    if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    return jsonResponse(order);
  }

  // File Upload (Receipts)
  if (path === "/upload-receipt" && method === "POST") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return jsonResponse({ error: "Очікується multipart/form-data запит" }, 400);
      }
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("receipt");
      if (!file || typeof file === "string") {
        return jsonResponse({ error: "Файл чека не надано" }, 400);
      }

      const lowerName = file.name.toLowerCase();
      const ext = lowerName.match(/\.[a-z0-9]+$/)?.[0] || ".jpg";
      const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const fileUrl = `/uploads/receipts/${filename}`;

      const bytes = await file.arrayBuffer();
      const mimeType = file.type || "application/octet-stream";

      const record = {
        bytes,
        type: mimeType,
        originalName: file.name,
        filename,
        size: file.size,
        createdAt: Date.now(),
      };
      memoryReceipts.set(filename, record);
      memoryReceipts.set(file.name, record);

      return jsonResponse({
        fileUrl,
        originalName: file.name,
        filename,
      }, 200);
    } catch (err) {
      return jsonResponse({ error: err.message || "Не вдалося завантажити чек" }, 500);
    }
  }

  // Secure Receipt File Access
  if (
    (path.startsWith("/receipts/") ||
      path.startsWith("/uploads/receipts/") ||
      path.startsWith("/api/receipts/")) &&
    method === "GET"
  ) {
    let filename = path
      .replace(/^\/api\//, "/")
      .replace(/^\/uploads\/receipts\//, "")
      .replace(/^\/receipts\//, "")
      .replace(/^\//, "");
    if (filename.includes("/")) filename = filename.split("/")[0];
    const decodedFilename = decodeURIComponent(filename);

    const token = (
      url.searchParams.get("token") ||
      request.headers.get("x-customer-token") ||
      request.headers.get("x-checkout-token") ||
      ""
    ).trim();

    let isAuthorized = !!session;
    if (!isAuthorized && token) {
      const matchOrder = memoryOrders.find(
        (o) =>
          o.customerToken === token &&
          (o.receipt?.fileUrl?.includes(filename) || o.receipt?.name === decodedFilename)
      );
      if (matchOrder) isAuthorized = true;
    }

    if (!isAuthorized) {
      return jsonResponse({ error: "Доступ до чека заборонено: необхідна авторизація" }, 403);
    }

    const receiptItem = memoryReceipts.get(filename) || memoryReceipts.get(decodedFilename);
    if (receiptItem && receiptItem.bytes) {
      return new Response(receiptItem.bytes, {
        status: 200,
        headers: {
          "Content-Type": receiptItem.type,
          "Content-Disposition": `inline; filename="${encodeURIComponent(receiptItem.originalName || filename)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return jsonResponse({ error: "Файл чека недоступний" }, 404);
  }

  // Product Image Upload
  if (path === "/upload-product-image" && method === "POST") {
    try {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("image");
      if (!file || typeof file === "string") {
        return jsonResponse({ error: "Файл зображення не надано" }, 400);
      }

      const lowerName = file.name.toLowerCase();
      const ext = lowerName.match(/\.[a-z0-9]+$/)?.[0] || ".jpg";
      const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const fileUrl = `/uploads/products/${filename}`;

      const bytes = await file.arrayBuffer();
      memoryProductImages.set(filename, { bytes, type: file.type || "image/jpeg" });

      return jsonResponse({
        success: true,
        fileUrl,
        originalName: file.name,
        filename,
      }, 200);
    } catch (err) {
      return jsonResponse({ error: err.message || "Не вдалося завантажити фото" }, 500);
    }
  }

  // Serve Product Images
  if (path.startsWith("/uploads/products/") && method === "GET") {
    const filename = path.replace("/uploads/products/", "");
    const item = memoryProductImages.get(filename);
    if (item) {
      return new Response(item.bytes, {
        status: 200,
        headers: {
          "Content-Type": item.type,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="#1F1D1B"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#E5A93C">🥩 М'ясний рай у Галинки</text></svg>`,
      { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } }
    );
  }

  // ---------------- Protected Admin Endpoints ----------------
  if (path.startsWith("/admin")) {
    if (!session) {
      return jsonResponse({ error: "Необхідна авторизація" }, 401);
    }

    async function findOrder(targetId) {
      if (!targetId) return null;
      let found = memoryOrders.find((o) => o.id === targetId || o.orderCode === targetId || o.order_code === targetId);
      if (!found) {
        found = SEED_ORDERS.find((o) => o.id === targetId || o.orderCode === targetId || o.order_code === targetId);
      }
      if (!found) {
        found = await getOrderFromEdgeCache(targetId);
        if (found && !memoryOrders.some((o) => o.id === found.id)) {
          memoryOrders.unshift(found);
        }
      }
      return found;
    }

    // Admin Security Settings Update (Username & Password)
    if (path === "/admin/security" && method === "PUT") {
      try {
        const body = await request.json().catch(() => ({}));
        const { currentPassword, newLogin, newPassword, confirmPassword } = body;

        if (!currentPassword) {
          return jsonResponse({ error: "Введіть поточний пароль для підтвердження змін" }, 400);
        }

        const isCurrentValid = await checkPassword(session.username, currentPassword);
        if (!isCurrentValid) {
          return jsonResponse({ error: "Невірний поточний пароль" }, 401);
        }

        let updatedUsername = session.username;
        if (newLogin && newLogin.trim()) {
          updatedUsername = newLogin.trim();
        }

        let newHash = activeHash;
        let newSalt = activeSalt;

        if (newPassword) {
          if (newPassword.length < 6) {
            return jsonResponse({ error: "Новий пароль має містити щонайменше 6 символів" }, 400);
          }
          if (newPassword !== confirmPassword) {
            return jsonResponse({ error: "Новий пароль та підтвердження не співпадають" }, 400);
          }
          newSalt = Math.random().toString(36).substring(2) + Date.now().toString(36);
          newHash = await hashPassword(newPassword, newSalt);
        }

        const credTokenUpdated = await signData(
          {
            username: updatedUsername,
            hash: newHash,
            salt: newSalt,
            updatedAt: Date.now(),
          },
          secret
        );

        const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const sessionTokenUpdated = await signData(
          { username: updatedUsername, exp, iat: Date.now() },
          secret
        );

        const cookieSession = `galinka_session=${sessionTokenUpdated}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
        const cookieCred = `galinka_cred=${credTokenUpdated}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`;

        return new Response(
          JSON.stringify({
            success: true,
            message: "Пароль та налаштування безпеки успішно оновлено.",
            username: updatedUsername,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Set-Cookie": `${cookieSession}, ${cookieCred}`,
            },
          }
        );
      } catch (err) {
        return jsonResponse({ error: err.message || "Помилка зміни безпеки" }, 500);
      }
    }

    // Admin Dashboard
    if (path === "/admin/dashboard" && method === "GET") {
      const totalOrders = memoryOrders.length;
      const totalRevenue = memoryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const ordersToday = memoryOrders.length;
      const ordersThisWeek = memoryOrders.length;
      const ordersThisMonth = memoryOrders.length;
      const newOrders = memoryOrders.filter((o) => o.status === "NEW").length;
      const processingOrders = memoryOrders.filter((o) => o.status === "PROCESSING" || o.status === "CONFIRMED" || o.status === "COOKING").length;
      const packedOrders = memoryOrders.filter((o) => o.status === "PACKED").length;
      const shippedOrders = memoryOrders.filter((o) => o.status === "SHIPPED").length;
      const completedOrders = memoryOrders.filter((o) => o.status === "COMPLETED").length;
      const cancelledOrders = memoryOrders.filter((o) => o.status === "CANCELLED").length;
      const completedRevenue = memoryOrders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const activeOrdersCount = Math.max(totalOrders - cancelledOrders, 0);
      const averageCheck = activeOrdersCount > 0 ? Math.round(totalRevenue / activeOrdersCount) : 0;

      const customerPhones = new Set();
      memoryOrders.forEach((o) => {
        if (o.customer?.phone) customerPhones.add(o.customer.phone);
      });
      const totalCustomers = customerPhones.size;
      const newCustomers = customerPhones.size > 0 ? 1 : 0;
      const repeatCustomers = Math.max(0, totalCustomers - newCustomers);

      return jsonResponse({
        kpis: {
          totalOrders,
          ordersToday,
          ordersThisWeek,
          ordersThisMonth,
          newOrders,
          processingOrders,
          packedOrders,
          shippedOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          completedRevenue,
          averageCheck,
          totalCustomers,
          newCustomers,
          repeatCustomers,
        },
        recentOrders: memoryOrders.slice(0, 10),
        topProducts: memoryProducts.slice(0, 5).map((p) => ({ name: p.name, qty: p.stock })),
        telegramLogs: [],
        salesOrders: memoryOrders.slice(0, 10),
      });
    }

    // Admin Orders
    if (path === "/admin/orders" && method === "GET") {
      const status = url.searchParams.get("status");
      const isDeleted = url.searchParams.get("deleted") === "true";
      let list = memoryOrders.filter((o) => (isDeleted ? Boolean(o.deletedAt) : !o.deletedAt));
      if (status && status !== "all") {
        list = list.filter((o) => o.status === status);
      }
      return jsonResponse(list);
    }

    if (path.startsWith("/admin/orders/") && path.endsWith("/status") && method === "PATCH") {
      const id = path.replace("/admin/orders/", "").replace("/status", "");
      const body = await request.json().catch(() => ({}));
      const nextStatus = body.status;
      const order = await findOrder(id);
      if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);

      const prevStatus = order.status;
      order.status = nextStatus;
      order.updatedAt = Date.now();
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.unshift({
        fromStatus: prevStatus,
        toStatus: nextStatus,
        comment: body.comment || null,
        changedBy: session.username || "admin",
        createdAt: Date.now(),
      });
      await saveOrderToEdgeCache(order);
      return jsonResponse(order);
    }

    if (path.startsWith("/admin/orders/") && path.endsWith("/tracking") && method === "PATCH") {
      const id = path.replace("/admin/orders/", "").replace("/tracking", "");
      const body = await request.json().catch(() => ({}));
      const order = await findOrder(id);
      if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);

      if (!order.delivery) order.delivery = {};
      if (body.trackingNumber !== undefined) order.delivery.trackingNumber = body.trackingNumber;
      if (body.trackingUrl !== undefined) order.delivery.trackingUrl = body.trackingUrl;
      order.updatedAt = Date.now();
      await saveOrderToEdgeCache(order);
      return jsonResponse(order);
    }

    if (path.startsWith("/admin/orders/") && method === "GET") {
      const id = path.replace("/admin/orders/", "");
      const order = await findOrder(id);
      if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
      return jsonResponse(order);
    }

    // Admin Products
    if (path === "/admin/products" && method === "GET") {
      return jsonResponse(memoryProducts);
    }
    if (path === "/admin/products" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || "").trim();
      if (!name) return jsonResponse({ error: "Назва товару обов'язкова" }, 400);
      const image = (body.image || "").trim() || "kovbasa-domashnya";
      const rawSlug = (body.slug || "").trim() || transliterateUa(name);
      const cleanSlug = transliterateUa(rawSlug);
      const slug = resolveEdgeUniqueSlug(cleanSlug);
      const newProd = {
        ...body,
        id: "p_" + Date.now(),
        name,
        slug,
        image,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memoryProducts.unshift(newProd);
      return jsonResponse(newProd, 201);
    }
    if (path.startsWith("/admin/products/") && path.endsWith("/duplicate") && method === "POST") {
      const id = path.replace("/admin/products/", "").replace("/duplicate", "");
      const orig = memoryProducts.find((p) => p.id === id);
      if (!orig) return jsonResponse({ error: "Товар не знайдено" }, 404);
      const dup = {
        ...orig,
        id: "p_" + Date.now(),
        name: orig.name + " (копія)",
        slug: resolveEdgeUniqueSlug(orig.slug + "-2"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memoryProducts.unshift(dup);
      return jsonResponse(dup, 201);
    }
    if (path.startsWith("/admin/products/") && method === "PUT") {
      const id = path.replace("/admin/products/", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryProducts.findIndex((p) => p.id === id);
      if (idx >= 0) {
        memoryProducts[idx] = { ...memoryProducts[idx], ...body, id, updatedAt: Date.now() };
        return jsonResponse(memoryProducts[idx]);
      }
      return jsonResponse({ error: "Товар не знайдено" }, 404);
    }
    if (path.startsWith("/admin/products/") && method === "DELETE") {
      const id = path.replace("/admin/products/", "");
      memoryProducts = memoryProducts.filter((p) => p.id !== id);
      return jsonResponse({ success: true });
    }

    // Admin Categories
    if (path === "/admin/categories" && method === "GET") {
      return jsonResponse(memoryCategories);
    }
    if (path === "/admin/categories" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || "").trim();
      if (!name) return jsonResponse({ error: "Назва категорії обов'язкова" }, 400);
      let slug = (body.slug || "").trim() || transliterateUa(name);
      slug = transliterateUa(slug);
      const icon = (body.icon || "🥩").trim();
      const sortOrder = Number(body.sortOrder) || 0;

      const idx = memoryCategories.findIndex((c) => c.slug === slug);
      const catObj = { slug, name, icon, sortOrder };
      if (idx >= 0) memoryCategories[idx] = catObj;
      else memoryCategories.push(catObj);
      return jsonResponse(catObj);
    }
    if (path.startsWith("/admin/categories/") && method === "DELETE") {
      const slug = path.replace("/admin/categories/", "");
      const count = memoryProducts.filter((p) => p.category === slug).length;
      if (count > 0) {
        return jsonResponse({
          error: `У цій категорії є ${count} товарів. Спочатку перенесіть товари в іншу категорію.`,
        }, 400);
      }
      memoryCategories = memoryCategories.filter((c) => c.slug !== slug);
      return jsonResponse({ success: true });
    }

    // Admin Settings
    if (path === "/admin/settings" && method === "GET") {
      const masked = {
        ...memorySettings,
        telegram: {
          hasToken: Boolean(memorySettings.telegram?.botToken),
          botToken: memorySettings.telegram?.botToken ? "••••••••••••••••" : "",
          chatId: memorySettings.telegram?.chatId || "",
        },
      };
      return jsonResponse(masked);
    }
    if (path === "/admin/settings" && method === "PUT") {
      const body = await request.json().catch(() => ({}));
      let finalTelegram = { ...(memorySettings.telegram || {}) };
      if (body.telegram) {
        const rawToken = (body.telegram.botToken || "").trim();
        if (rawToken && rawToken !== "••••••••••••••••") {
          finalTelegram.botToken = rawToken;
        }
        if (body.telegram.chatId !== undefined) {
          finalTelegram.chatId = String(body.telegram.chatId).trim();
        }
      }
      memorySettings = {
        ...memorySettings,
        ...body,
        telegram: finalTelegram,
      };
      return jsonResponse({
        ...memorySettings,
        telegram: {
          hasToken: Boolean(finalTelegram.botToken),
          botToken: finalTelegram.botToken ? "••••••••••••••••" : "",
          chatId: finalTelegram.chatId || "",
        },
      });
    }

    // Admin Telegram Config
    if (path === "/admin/telegram/config" && method === "GET") {
      return jsonResponse({
        enabled: memorySettings.telegram?.enabled ?? true,
        hasToken: Boolean(memorySettings.telegram?.botToken),
        botToken: memorySettings.telegram?.botToken ? "••••••••••••••••" : "",
        botUsername: memorySettings.telegram?.botUsername || "",
        status: memorySettings.telegram?.lastStatus || (memorySettings.telegram?.botToken ? "configured" : "unconfigured"),
      });
    }
    if (path === "/admin/telegram/config" && method === "PUT") {
      const body = await request.json().catch(() => ({}));
      if (!memorySettings.telegram) memorySettings.telegram = {};
      if (body.enabled !== undefined) memorySettings.telegram.enabled = Boolean(body.enabled);
      if (body.botToken && body.botToken !== "••••••••••••••••") {
        memorySettings.telegram.botToken = String(body.botToken).trim();
      }
      return jsonResponse({
        enabled: memorySettings.telegram.enabled,
        hasToken: Boolean(memorySettings.telegram.botToken),
        botToken: memorySettings.telegram.botToken ? "••••••••••••••••" : "",
        botUsername: memorySettings.telegram.botUsername || "",
        status: memorySettings.telegram.botToken ? "configured" : "unconfigured",
      });
    }

    // Admin Telegram Recipients
    if (path === "/admin/telegram/recipients" && method === "GET") {
      return jsonResponse(memoryTelegramRecipients);
    }
    if (path === "/admin/telegram/recipients" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const id = "tr_" + Date.now().toString(36);
      const recipient = {
        id,
        name: String(body.name || "").trim(),
        username: String(body.username || "").trim(),
        chat_id: String(body.chat_id || "").trim(),
        role: body.role || "manager",
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      if (!recipient.name || !recipient.chat_id) {
        return jsonResponse({ error: "Вкажіть ім'я та Chat ID" }, 400);
      }
      memoryTelegramRecipients.push(recipient);
      return jsonResponse(recipient, 201);
    }
    if (path.startsWith("/admin/telegram/recipients/") && method === "DELETE") {
      const id = path.replace("/admin/telegram/recipients/", "");
      memoryTelegramRecipients = memoryTelegramRecipients.filter((r) => r.id !== id);
      return jsonResponse({ ok: true, id });
    }
    if (path.startsWith("/admin/telegram/recipients/") && path.endsWith("/toggle") && method === "POST") {
      const id = path.replace("/admin/telegram/recipients/", "").replace("/toggle", "");
      const idx = memoryTelegramRecipients.findIndex((r) => r.id === id);
      if (idx < 0) return jsonResponse({ error: "Отримувача не знайдено" }, 404);
      memoryTelegramRecipients[idx].is_active = !memoryTelegramRecipients[idx].is_active;
      memoryTelegramRecipients[idx].updated_at = Date.now();
      return jsonResponse(memoryTelegramRecipients[idx]);
    }
    if (path.startsWith("/admin/telegram/recipients/") && path.endsWith("/test") && method === "POST") {
      const id = path.replace("/admin/telegram/recipients/", "").replace("/test", "");
      const recipient = memoryTelegramRecipients.find((r) => r.id === id);
      if (!recipient) return jsonResponse({ error: "Отримувача не знайдено" }, 404);
      return jsonResponse({ ok: true, simulated: true, message: `Тестове повідомлення для ${recipient.name} змодельовано успішно` });
    }
    if (path === "/admin/telegram-log" && method === "GET") {
      return jsonResponse([]);
    }
    if (path === "/admin/telegram/recent-chats" && method === "GET") {
      return jsonResponse(memoryTelegramInteractions);
    }

    // Admin Delivery Accounts
    if (path === "/admin/delivery/accounts" && method === "GET") {
      return jsonResponse(memoryDeliveryAccounts);
    }

    // Admin Backups
    if (path === "/admin/backup" && method === "GET") {
      return jsonResponse({ error: "Резервне копіювання файлу SQLite доступне у повному Node.js сервері" }, 400);
    }
  }

  // Not Found
  return jsonResponse({ error: "API endpoint не знайдено" }, 404);
}
