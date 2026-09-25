// Demo seed data. Prices/qty are editable via Admin.
export const CATEGORIES = [
  { slug: "honey", name: "Мед", icon: "🍯" },
  { slug: "cream-honey", name: "Крем-мед", icon: "🧈" },
  { slug: "nuts-honey", name: "Горіхи в меді", icon: "🌰" },
  { slug: "pollen", name: "Пилок", icon: "🌼" },
  { slug: "propolis", name: "Прополіс", icon: "🟤" },
  { slug: "perga", name: "Перга", icon: "🟡" },
  { slug: "gift-boxes", name: "Подарункові бокси", icon: "🎁" },
];

export const PRODUCTS = [
  {
    id: "p1", slug: "med-naturalnyi-500g", name: "Мед натуральний", category: "honey",
    weight: "500 г", price: 220, oldPrice: null, stock: 34, featured: true, giftBox: false,
    description: "Натуральний квітковий мед з власної пасіки. Зібраний та розфасований вручну, без додавання цукру та консервантів.",
    image: "honey-jar",
  },
  {
    id: "p2", slug: "med-naturalnyi-1kg", name: "Мед натуральний", category: "honey",
    weight: "1 кг", price: 380, oldPrice: 420, stock: 21, featured: true, giftBox: false,
    description: "Натуральний квітковий мед з власної пасіки у зручній літровій банці — для родини або в подарунок.",
    image: "honey-jar-big",
  },
  {
    id: "p3", slug: "krem-med-250g", name: "Крем-мед", category: "cream-honey",
    weight: "250 г", price: 190, oldPrice: null, stock: 18, featured: true, giftBox: false,
    description: "Ніжний крем-мед збитої текстури. Не кристалізується, легко намазується.",
    image: "cream-honey",
  },
  {
    id: "p4", slug: "horihy-v-medi-250g", name: "Горіхи в меді", category: "nuts-honey",
    weight: "250 г", price: 260, oldPrice: null, stock: 14, featured: true, giftBox: false,
    description: "Волоські горіхи, вимочені у натуральному меді. Смачний та корисний перекус.",
    image: "nuts-honey",
  },
  {
    id: "p5", slug: "kvitkovyi-pylok-100g", name: "Квітковий пилок", category: "pollen",
    weight: "100 г", price: 140, oldPrice: null, stock: 25, featured: false, giftBox: false,
    description: "Натуральні гранули квіткового пилку, зібрані бджолами на власній пасіці.",
    image: "pollen",
  },
  {
    id: "p6", slug: "propolis-20g", name: "Прополіс", category: "propolis",
    weight: "20 г", price: 120, oldPrice: null, stock: 30, featured: false, giftBox: false,
    description: "Натуральний бджолиний прополіс у шматочках.",
    image: "propolis",
  },
  {
    id: "p7", slug: "perga-100g", name: "Перга", category: "perga",
    weight: "100 г", price: 220, oldPrice: null, stock: 12, featured: false, giftBox: false,
    description: "Бджолина перга — натуральний продукт пасіки у гранулах.",
    image: "perga",
  },
  {
    id: "p8", slug: "box-medovyi", name: "Подарунковий бокс «Медовий»", category: "gift-boxes",
    weight: "набір", price: 450, oldPrice: null, stock: 10, featured: true, giftBox: true,
    description: "Крафтова коробка з медом, крем-медом та невеликим сюрпризом. Можливе персональне оформлення.",
    image: "box-medovyi",
  },
  {
    id: "p9", slug: "box-karpatskyi", name: "Подарунковий бокс «Карпатський»", category: "gift-boxes",
    weight: "набір", price: 590, oldPrice: null, stock: 8, featured: true, giftBox: true,
    description: "Розширений набір: мед, прополіс, пилок та горіхи в меді у крафтовій упаковці зі стрічкою.",
    image: "box-karpatskyi",
  },
  {
    id: "p10", slug: "box-osoblyvyi-den", name: "Подарунковий бокс «Особливий день»", category: "gift-boxes",
    weight: "набір", price: 790, oldPrice: null, stock: 6, featured: true, giftBox: true,
    description: "Преміальний бокс для весілля чи особливої події: мед, крем-мед, перга, квіти та індивідуальна етикетка.",
    image: "box-osoblyvyi",
  },
];

export const DEFAULT_SETTINGS = {
  contacts: { phone: "+380 67 835 23 11", email: "hello@pasika-honey.ua", tiktok: "@pasika.honey", telegram: "@pasika_honey" },
  payment: { bank: "monobank", card: "4441 1111 2222 3333", holder: "Олена Петріна", instruction: "Після оплати завантажте фото/скрін чека — ми підтвердимо замовлення протягом години." },
  delivery: { novaPoshtaEnabled: true, ukrposhtaEnabled: true },
};
