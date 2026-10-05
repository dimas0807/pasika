// Galinka Meat Shop seed data. Products, prices, and categories are editable via Admin.
import { CATEGORIES as SEED_CATS, PRODUCTS as SEED_PRODS, DEFAULT_INTERNATIONAL_SETTINGS } from "../../server/catalog-data.js";

export const CATEGORIES = SEED_CATS;
export const PRODUCTS = SEED_PRODS;

export const DEFAULT_SETTINGS = {
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
    description: "Справжні домашні ковбаси, копченості, курочка, сало та паштети від Галинки. Натуральне копчення на дровах, перевірені домашні рецепти та швидка доставка Новою Поштою по всій Україні та за кордон.",
    heroTitle: "М'ЯСНИЙ РАЙ У ГАЛИНКИ",
    heroSubtitle: "Домашні ковбаси та копченості",
    logoText: "М'ЯСНИЙ РАЙ У ГАЛИНКИ",
  },
  about: {
    title: "Домашні копченості з душею від Галинки",
    shortText: "Мене звати Галина, і я готую для вас справжні домашні ковбаси та копченості. Тільки свіже добірне м'ясо, натуральні спеції та традиційне копчення на дровах.",
    fullDescription: "Кожен шматочок м'яса маринується за перевіреними родинними рецептами без штучних барвників та консервантів. Наше копчення — виключно на дровах вільхи та фруктових дерев, що дає неповторний аромат та золотисту скоринку. Дякуємо нашій великій аудиторії в TikTok (понад 110 тисяч підписників) за довіру!",
    followersCount: "110K+",
    likesCount: "700K+",
    foundationYear: "2020",
    location: "Україна",
    image: "/images/about-galinka.jpg",
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
    instruction: "Після оформлення замовлення Галинка зв'яжеться з вами у Viber або за телефоном для узгодження деталей доставки.",
  },
  delivery: {
    novaPoshtaEnabled: true,
    ukrposhtaEnabled: false,
    international: DEFAULT_INTERNATIONAL_SETTINGS,
  },
  telegram: {
    botToken: "",
    chatId: "",
  },
};
