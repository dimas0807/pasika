import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { Categories, Products, Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconTruck,
  IconShieldCheck,
  IconSparkles,
  IconPhone,
  IconViber,
  IconTikTok,
  IconChevronRight,
  IconCheckCircle,
} from "../components/Icons";

const TRUST_BADGES = [
  {
    icon: "🥩",
    title: "Добірне домашнє м'ясо",
    desc: "Свіжа українська свинина та птиця без штучних домішок",
  },
  {
    icon: "🪵",
    title: "Натуральне копчення",
    desc: "Традиційна коптильня на сухих вільхових та фруктових дровах",
  },
  {
    icon: "📦",
    title: "Термоупаковка з льодом",
    desc: "Свіжість гарантована при доставці Новою Поштою 1-2 дні",
  },
  {
    icon: "👩‍🍳",
    title: "Гарантія смаку від Галинки",
    desc: "Готуємо з душею за перевіреними родинними рецептами",
  },
];

const ORDER_STEPS = [
  {
    step: "01",
    title: "Оберіть смаколики",
    desc: "Домашні ковбаси, шинка, генеральське сало, курочка або паштети.",
  },
  {
    step: "02",
    title: "Додайте до кошика",
    desc: "Вкажіть потрібну кількість. Замовлення можна оформити за 1 хвилину.",
  },
  {
    step: "03",
    title: "Вкажіть Нову Пошту",
    desc: "Оберіть ваше місто та номер відділення або поштомату.",
  },
  {
    step: "04",
    title: "Підтвердіть замовлення",
    desc: "Отримайте номер замовлення та швидке узгодження деталей.",
  },
  {
    step: "05",
    title: "Галинка відправляє",
    desc: "Свіжо приготовлені та запаковані страви прямують до вашого столу.",
  },
];

export default function Home() {
  const [, setTick] = useState(0);
  const [s, setS] = useState(() => Settings.get());
  const [categories, setCategories] = useState(() => Categories.all());
  const [products, setProducts] = useState(() => Products.all());

  useEffect(() => {
    Products.fetchAll().then((data) => data && setProducts(data));
    Categories.fetchAll().then((data) => data && setCategories(data));
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => {
      setTick((t) => t + 1);
      setS(Settings.get());
      setCategories(Categories.all());
      setProducts(Products.all());
    });
  }, []);

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const rawPhone = phone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:+${rawPhone.startsWith("38") ? rawPhone : "38" + rawPhone}` : "tel:+380680257877";

  const viberRaw = (s?.contacts?.viber || "0680257877").trim();
  const viberUrl = getSocialUrl("viber", viberRaw) || "viber://chat?number=%2B380680257877";

  const tiktokUrl = getSocialUrl("tiktok", s?.contacts?.tiktok || "@kopchonosti777") || "https://www.tiktok.com/@kopchonosti777";

  // Category image map helper
  const getCategoryPhoto = (slug) => {
    switch (slug) {
      case "domashni-kovbasy":
        return "/images/kovbasa-domashnya.jpg";
      case "kopchenosti":
        return "/images/rebertsya.jpg";
      case "kopchene-myaso":
        return "/images/shynka.jpg";
      case "kurochka":
        return "/images/kurochka.jpg";
      case "sardelky":
        return "/images/sardelky.jpg";
      case "pashtety":
        return "/images/pashtet.jpg";
      case "salo":
        return "/images/salo.jpg";
      default:
        return "/images/kovbasa-kopchena.jpg";
    }
  };

  return (
    <div className="overflow-x-hidden bg-[#121110] text-[#F4EFEA]">
      {/* ==================================================
          01 — HERO SECTION
          ================================================== */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden border-b border-[#28221D]">
        {/* Full-bleed Authentic Food Photography Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-meat.jpg"
            alt="Домашні копченості на дровах від Галинки"
            className="w-full h-full object-cover object-center lg:object-[65%_center] scale-100 transform motion-safe:scale-102 transition-transform duration-1000"
            loading="eager"
          />
          {/* Atmospheric Cinematic Gradients for high contrast and appetizing vibe */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121110]/95 via-[#121110]/80 md:via-[#121110]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-transparent to-transparent md:hidden z-10" />
        </div>

        {/* Foreground Content */}
        <div className="container-p relative z-20 py-16 sm:py-20 lg:py-24 w-full">
          <div className="max-w-2xl text-white relative">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A231C]/90 border border-bronze/40 text-xs font-bold uppercase tracking-wider text-bronze shadow-lg mb-5">
              <span>🔥 Власна коптильня на дровах</span>
              <span className="text-[#8C8074]">•</span>
              <span>100% натурально</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[56px] font-bold leading-[1.12] tracking-tight">
              М'ЯСНИЙ РАЙ <br />
              <span className="text-bronze">У ГАЛИНКИ</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-xl sm:text-2xl font-serif text-[#E8DFD5] font-semibold">
              Домашні ковбаси та копченості
            </p>

            {/* Supporting Story Text */}
            <p className="mt-4 text-[#CFC5BA] text-sm sm:text-base max-w-xl leading-relaxed">
              Справжні ковбаси з печі, соковита шинка, генеральське сало, ніжна копчена курочка та паштети. Готуємо з добірного фермерського м'яса без сої, підсилювачів смаку та рідкого диму.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto">
              <Link
                to="/catalog"
                className="btn-primary text-base px-8 py-4 shadow-lg w-full sm:w-auto text-center font-bold"
              >
                Перейти до каталогу →
              </Link>

              <a
                href={viberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-viber text-base px-7 py-4 w-full sm:w-auto text-center"
              >
                <IconViber className="w-5 h-5 text-white" />
                <span>Написати Галині у Viber</span>
              </a>

              <a
                href={telHref}
                className="inline-flex items-center justify-center gap-2 bg-[#201D1A]/90 hover:bg-[#2A2622] border border-[#3D352D] hover:border-bronze text-[#F4EFEA] font-semibold px-6 py-4 rounded-xl transition-all w-full sm:w-auto text-center"
              >
                <IconPhone className="w-4 h-4 text-bronze" />
                <span>{phone}</span>
              </a>
            </div>

            {/* Trust Badges Bar */}
            <div className="mt-12 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {TRUST_BADGES.map((b, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1C1815]/90 border border-[#332A22] shadow-md text-white"
                >
                  <span className="text-xl shrink-0 mt-0.5">{b.icon}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight text-[#F4EFEA]">
                      {b.title}
                    </div>
                    <div className="text-[10px] text-[#A3988E] hidden sm:block mt-0.5 leading-snug">
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          02 — CATEGORIES SECTION
          ================================================== */}
      <section className="py-16 md:py-24 border-b border-[#28221D] bg-[#161412] relative">
        <div className="container-p">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#26201B] border border-bronze/30 text-xs font-bold uppercase tracking-wider text-bronze">
                <span>🥩 Наш асортимент</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA] mt-3">
                Категорії домашніх страв
              </h2>
              <p className="text-[#A3988E] text-sm sm:text-base mt-2 max-w-xl">
                Оберіть улюблені копченості до щоденного столу або до святкового частування
              </p>
            </div>
            <Link
              to="/catalog"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start md:self-auto font-bold"
            >
              Весь каталог смаколиків →
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => {
              const photo = getCategoryPhoto(cat.slug);
              return (
                <Link
                  key={cat.slug}
                  to={`/catalog?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square bg-[#1F1C19] border border-[#2F2822] hover:border-bronze shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-end p-4 sm:p-5"
                >
                  {/* Photo */}
                  <img
                    src={photo}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-colors" />

                  {/* Text */}
                  <div className="relative z-10">
                    <span className="text-xl sm:text-2xl mb-1 block">
                      {cat.icon || "🥩"}
                    </span>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-white group-hover:text-bronze transition-colors leading-tight">
                      {cat.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-bronze group-hover:translate-x-1 transition-transform">
                      <span>Дивитися страви</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          03 — POPULAR PRODUCTS ("Хіти Галинки")
          ================================================== */}
      <section className="py-16 md:py-24 border-b border-[#28221D] bg-[#121110]">
        <div className="container-p">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#26201B] border border-bronze/30 text-xs font-bold uppercase tracking-wider text-bronze">
                <IconSparkles className="w-3.5 h-3.5 text-bronze" />
                <span>Вибір покупців</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA] mt-3">
                Хіти Галинки
              </h2>
              <p className="text-[#A3988E] text-sm sm:text-base mt-1">
                Найпопулярніші копченості та ковбаси, які замовляють найчастіше
              </p>
            </div>
            <Link
              to="/catalog"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start sm:self-auto font-bold"
            >
              Переглянути всі товари →
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Banner under products */}
          <div className="mt-10 p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A3988E]">
            <div className="flex items-center gap-2.5">
              <IconShieldCheck className="w-5 h-5 text-bronze shrink-0" />
              <span>
                Кожне замовлення збирається свіжим. Вакуумуємо перед самою відправкою.
              </span>
            </div>
            <Link to="/catalog" className="font-bold text-bronze hover:underline shrink-0">
              Переглянути повний каталог ({products.length} позицій) →
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================
          04 — ABOUT GALINKA
          ================================================== */}
      <section className="py-16 md:py-24 border-b border-[#28221D] bg-[#161412]">
        <div className="container-p">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Photo Column */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border border-[#332A22] shadow-2xl bg-[#1F1C19]">
                <img
                  src="/images/about-galinka.jpg"
                  alt="Галинка у власній домашній майстерні копченостей"
                  className="w-full h-full object-cover aspect-[4/5]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="font-serif font-bold text-lg text-[#F4EFEA]">
                    Галина
                  </div>
                  <div className="text-xs text-bronze font-semibold">
                    Засновниця та майстриня «М'ясного раю»
                  </div>
                </div>
              </div>
            </div>

            {/* Story Column */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#26201B] border border-bronze/30 text-xs font-bold uppercase tracking-wider text-bronze mb-3">
                <span>👩‍🍳 Про людину за брендом</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4EFEA] leading-tight">
                Готую з любов'ю, як для власної родини
              </h2>
              <div className="mt-6 space-y-4 text-sm sm:text-base text-[#CFC5BA] leading-relaxed">
                <p>
                  Мене звати Галина. Своє коптильне діло я починала для родини та близьких друзів. Згодом люди почали замовляти знову і знову, розповідати знайомим — і так народився наш «М'ясний рай».
                </p>
                <p>
                  Головний наш принцип — жодних компромісів щодо якості. Ми не використовуємо соєвих добавок, крохмалю, фосфатів чи «рідкого диму». Тільки добірне свіже м'ясо, перець, часник і натуральне копчення на сухих дровах у нашій коптильні.
                </p>
                <p>
                  Сьогодні наші копченості замовляють по всій Україні через TikTok та сайт. Ми дуже цінуємо вашу довіру і щодня прагнемо робити найсмачніший продукт, який з гордістю ставимо на святковий стіл.
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/about" className="btn-secondary text-sm font-bold">
                  Дізнатися більше про коптильню →
                </Link>
                <a
                  href={viberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-viber text-sm"
                >
                  <IconViber className="w-4 h-4 text-white" />
                  <span>Написати Галині особисто</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          05 — TIKTOK SECTION
          ================================================== */}
      <section className="py-16 md:py-24 border-b border-[#28221D] bg-[#121110]">
        <div className="container-p">
          <div className="rounded-3xl bg-gradient-to-br from-[#1C1815] via-[#211B17] to-[#171412] border border-bronze/30 p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden">
            {/* Glow background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-bronze/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-bold text-white mb-4">
                  <IconTikTok className="w-4 h-4 text-white" />
                  <span>@kopchonosti777</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4EFEA] leading-tight">
                  Галинка в TikTok: дивіться як ми готуємо наживо
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[#CFC5BA] max-w-2xl leading-relaxed">
                  Показуємо весь процес без прикрас: від вибору м'яса та запікання ковбасок до виймання гарячої шинки з коптильні. Дивіться відео, огляди та відгуки наших замовників!
                </p>

                {/* TikTok Audience Stats */}
                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#F4EFEA]">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-extrabold text-2xl text-bronze">110K+</span>
                    <span className="text-xs text-[#A3988E]">підписників у TikTok</span>
                  </div>
                  <div className="h-6 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-extrabold text-2xl text-bronze">700K+</span>
                    <span className="text-xs text-[#A3988E]">лайків на відео</span>
                  </div>
                  <div className="h-6 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-extrabold text-2xl text-bronze">100%</span>
                    <span className="text-xs text-[#A3988E]">справжні живі відгуки</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-black hover:bg-[#1A1A1A] text-white font-bold px-7 py-3.5 rounded-xl border border-white/30 hover:border-[#FE2C55] shadow-lg transition-all active:scale-98 text-sm sm:text-base"
                  >
                    <IconTikTok className="w-5 h-5 text-white" />
                    <span>Дивитися TikTok @kopchonosti777</span>
                  </a>

                  <Link to="/catalog" className="btn-primary text-sm sm:text-base">
                    Замовити смаколики на сайті
                  </Link>
                </div>
              </div>

              {/* TikTok Badge / preview mockup */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-xs rounded-2xl bg-[#141211] border border-[#332A22] p-5 shadow-xl text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-bronze to-meat flex items-center justify-center text-4xl shadow-inner border-2 border-white/20 mb-3">
                    🥩
                  </div>
                  <div className="font-bold text-base text-[#F4EFEA]">Домашні копченості 🥩</div>
                  <div className="text-xs text-bronze font-semibold mt-0.5">@kopchonosti777</div>
                  <p className="text-xs text-[#8C8074] mt-2 leading-relaxed">
                    «М'ясний рай у Галинки» — щоденні відео про копчення на дровах та смачні рецепти
                  </p>
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    Перейти до профілю →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          06 — ORDERING & NOVA POSHTA DELIVERY STEPS
          ================================================== */}
      <section className="py-16 md:py-24 border-b border-[#28221D] bg-[#161412]">
        <div className="container-p">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#26201B] border border-bronze/30 text-xs font-bold uppercase tracking-wider text-bronze">
              <IconTruck className="w-4 h-4 text-bronze" />
              <span>Швидко, просто та надійно</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4EFEA] mt-3">
              Як замовити на сайті?
            </h2>
            <p className="text-[#A3988E] text-sm sm:text-base mt-2">
              Оформлення займає всього 1-2 хвилини без обов'язкової реєстрації
            </p>
          </div>

          {/* 5 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {ORDER_STEPS.map((s, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#1C1815] border border-[#2F2821] p-5 flex flex-col justify-between hover:border-bronze/60 transition-colors shadow-md"
              >
                <div>
                  <span className="font-serif text-2xl font-black text-bronze/70 mb-2 block">
                    {s.step}
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#F4EFEA] mb-1.5 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#A3988E] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-bronze font-medium">
                  <IconCheckCircle className="w-3.5 h-3.5" />
                  <span>Крок {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Details Card */}
          <div className="mt-12 rounded-2xl bg-[#1C1815] border border-[#2F2821] p-6 sm:p-8 grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🚚</span>
              <div>
                <div className="font-bold text-[#F4EFEA]">Доставка Новою Поштою</div>
                <div className="text-xs text-[#A3988E] mt-1 leading-relaxed">
                  Відправляємо у відділення та поштомати по всій Україні. Термін доставки 1–2 дні.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">❄️</span>
              <div>
                <div className="font-bold text-[#F4EFEA]">Термозахист та свіжість</div>
                <div className="text-xs text-[#A3988E] mt-1 leading-relaxed">
                  Продукти пакуються у вакуум та термопакети з холодоелементами. Завжди приїжджає свіжим.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">💳</span>
              <div>
                <div className="font-bold text-[#F4EFEA]">Зручна оплата</div>
                <div className="text-xs text-[#A3988E] mt-1 leading-relaxed">
                  Оплата при отриманні на Новій Пошті або переказ на розрахунковий рахунок/карту.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          07 — FINAL CTA BANNER
          ================================================== */}
      <section className="py-16 md:py-20 bg-[#121110]">
        <div className="container-p">
          <div className="rounded-3xl bg-gradient-to-r from-[#211B16] via-[#2A221C] to-[#1A1613] border border-bronze/40 p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <span className="text-4xl mb-3 block">🥩</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4EFEA]">
              Бажаєте справжнього домашнього м'яса?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#CFC5BA] max-w-xl mx-auto leading-relaxed">
              Обирайте смаколики в каталозі прямо зараз або пишіть Галині у Viber, якщо потрібна порада чи особливе замовлення.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/catalog" className="btn-primary text-base px-8 py-4 font-bold w-full sm:w-auto">
                Перейти до каталогу страв →
              </Link>

              <a
                href={viberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-viber text-base px-7 py-4 w-full sm:w-auto"
              >
                <IconViber className="w-5 h-5 text-white" />
                <span>Написати у Viber ({phone})</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
