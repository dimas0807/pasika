import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BeeScene from "../components/BeeScene";
import ProductCard from "../components/ProductCard";
import { Categories, Products, subscribe } from "../data/db";

const TRUST_BADGES = [
  { icon: "🐝", title: "Власна пасіка", desc: "Сімейне бджільництво" },
  { icon: "🌿", title: "100% натурально", desc: "Без цукру та домішок" },
  { icon: "🚚", title: "Доставка по Україні", desc: "Нова пошта та Укрпошта" },
  { icon: "🎁", title: "Подарункове оформлення", desc: "Крафтові бокси" },
];

const CATEGORY_IMAGES = {
  honey: "/images/prod-honey.jpg",
  "cream-honey": "/images/prod-cream-honey.jpg",
  "nuts-honey": "/images/prod-nuts-honey.jpg",
  pollen: "/images/prod-pollen.jpg",
  propolis: "/images/prod-propolis.jpg",
  perga: "/images/prod-perga.jpg",
  "gift-boxes": "/images/prod-gift-box.jpg",
};

const TIKTOK_VIDEOS = [
  {
    image: "/images/tiktok-1.jpg",
    title: "Свіжий мед з наших пасік",
    views: "16.4K",
  },
  {
    image: "/images/tiktok-2.jpg",
    title: "Бджілки-трудівниці на роботі",
    views: "24.1K",
  },
  {
    image: "/images/tiktok-3.jpg",
    title: "Збір меду в літній день",
    views: "19.8K",
  },
  {
    image: "/images/tiktok-4.jpg",
    title: "Пакування крафтових боксів",
    views: "12.3K",
  },
];

export default function Home() {
  const [, setTick] = useState(0);

  useEffect(() => {
    Products.fetchAll();
    Categories.fetchAll();
    return subscribe(() => setTick((t) => t + 1));
  }, []);

  const featured = Products.featured().slice(0, 5);
  const categories = Categories.all();

  return (
    <div className="overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F1E5] via-[#FCF9F2] to-[#FFFDF8] border-b border-ink/5 pt-6 pb-12 md:py-20 lg:py-24">
        {/* Animated Living Bees & Floating Pollen */}
        <BeeScene dense />

        <div className="container-p relative z-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Natural tag badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-honey/30 text-ink text-xs font-semibold uppercase tracking-wider mb-5 shadow-xs">
                <span className="text-honey">🍯</span>
                <span>Натуральний мед з власної пасіки</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.12] tracking-tight">
                Натуральний мед <br />
                <span className="text-ink">прямо з нашої пасіки 🍯</span>
              </h1>

              <p className="mt-5 text-ink/75 text-base sm:text-lg max-w-xl leading-relaxed">
                Власна пасіка, натуральні продукти бджільництва та святкові подарункові набори зі швидкою доставкою по всій Україні.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3.5 sm:gap-4 w-full sm:w-auto">
                <Link
                  to="/catalog"
                  className="btn-primary text-base px-7 py-3.5 w-full sm:w-auto text-center"
                >
                  Переглянути продукцію
                </Link>
                <Link
                  to="/gift-boxes"
                  className="btn-secondary text-base px-6 py-3.5 w-full sm:w-auto text-center"
                >
                  Подарункові бокси
                </Link>
              </div>

              {/* 4 Horizontal Trust Badges */}
              <div className="mt-10 pt-8 border-t border-ink/10 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {TRUST_BADGES.map((b) => (
                  <div key={b.title} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="text-2xl mb-1">{b.icon}</span>
                    <span className="text-xs sm:text-sm font-bold text-ink">{b.title}</span>
                    <span className="text-[11px] text-ink/55 hidden sm:block mt-0.5">{b.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero Photographic Scene */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background glow circle */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-accent/30 via-honey/20 to-transparent rounded-3xl blur-xl" />

                {/* Hero Photo Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white aspect-square">
                  <img
                    src="/images/hero-honey.jpg"
                    alt="Натуральний мед з пасіки у скляних банках зі стільниками"
                    className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700"
                    loading="eager"
                  />
                  {/* Subtle warmth gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent pointer-events-none" />

                  {/* Floating seal */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-ink/5 flex items-center gap-2.5">
                    <span className="text-2xl">🐝</span>
                    <div>
                      <div className="text-xs font-bold text-ink leading-none">Власна пасіка</div>
                      <div className="text-[10px] text-ink/60 mt-0.5">Збір 2024–2025 року</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION (Circular Photo Cards) */}
      <section className="container-p py-12 md:py-16">
        <div className="text-center md:text-left mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Категорії товарів
          </h2>
          <p className="text-ink/60 text-sm mt-1">Оберіть те, що потрібно саме вам</p>
        </div>

        {/* Horizontal Circular Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
          {categories.map((c) => {
            const catImage = CATEGORY_IMAGES[c.slug] || "/images/prod-honey.jpg";
            const targetUrl = c.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${c.slug}`;

            return (
              <Link
                key={c.slug}
                to={targetUrl}
                className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-cream/40 transition-colors"
              >
                {/* Photo circle */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-sm border-2 border-white ring-2 ring-honey/20 group-hover:ring-honey group-hover:scale-105 transition-all duration-300 bg-[#FAF6EE]">
                  <img
                    src={catImage}
                    alt={c.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                {/* Title */}
                <span className="mt-2.5 font-medium text-xs sm:text-sm text-ink group-hover:text-honey transition-colors">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. POPULAR PRODUCTS SECTION */}
      <section className="container-p py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Популярні товари
            </h2>
            <p className="text-ink/60 text-sm mt-1">Найулюбленіші продукти наших покупців</p>
          </div>
          <Link
            to="/catalog"
            className="btn-secondary text-xs sm:text-sm py-2 px-4 shrink-0"
          >
            Весь каталог →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 4. GIFT BOXES SHOWCASE BANNER */}
      <section className="container-p pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#EFE5D1] via-[#F5EDDC] to-[#FAF6EE] border border-gold/30 p-6 sm:p-10 md:p-12 shadow-sm grid md:grid-cols-12 gap-8 items-center overflow-hidden relative">
          <div className="md:col-span-7 z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white/80 px-3 py-1 rounded-full border border-honey/20">
              Подарункова колекція
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink mt-4 leading-tight">
              Подарунок, який запам'ятається 💛
            </h2>
            <p className="mt-3 text-ink/75 text-sm sm:text-base leading-relaxed max-w-lg">
              Натуральні продукти бджільництва, стильне крафтове пакування та частинка сонячного тепла у кожному боксі. Можливе індивідуальне брендування для весіль та свят.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/gift-boxes" className="btn-primary text-sm sm:text-base px-6 py-3">
                Переглянути всі бокси
              </Link>
              <span className="text-xs text-ink/60 font-medium">від 450 грн • швидка відправка</span>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden shadow-md border-4 border-white aspect-[4/3] bg-white">
              <img
                src="/images/prod-gift-box.jpg"
                alt="Подарунковий бокс з медом та свічкою"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. ABOUT STORYTELLING SECTION */}
      <section className="container-p py-8 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Text & Bullets */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3 py-1 rounded-full">
              Про нашу пасіку
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-ink mt-3 leading-snug">
              Мед, який починається з бджіл
            </h2>
            <p className="mt-4 text-ink/75 leading-relaxed text-sm sm:text-base">
              Ми працюємо з бджолами та створюємо натуральну продукцію, яку хочеться щодня дарувати рідним та смакувати за сімейним столом. Кожна банка проходить дбайливий контроль без пастеризації та перегріву.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-ink/5">
                <span className="text-2xl">🐝</span>
                <div>
                  <h4 className="text-sm font-bold text-ink">Власна пасіка</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Розташована серед квітучих луків</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-ink/5">
                <span className="text-2xl">🍯</span>
                <div>
                  <h4 className="text-sm font-bold text-ink">Натуральні продукти</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Без доданого цукру чи барвників</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-ink/5">
                <span className="text-2xl">🌿</span>
                <div>
                  <h4 className="text-sm font-bold text-ink">Турбота про бджіл</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Екологічний підхід до бджільництва</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-ink/5">
                <span className="text-2xl">💛</span>
                <div>
                  <h4 className="text-sm font-bold text-ink">Якість у баночці</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Ручний збір та фасування</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/about" className="btn-secondary text-sm">
                Більше про наше господарство →
              </Link>
            </div>
          </div>

          {/* 3-Photo Authentic Gallery Collage */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-[3/4]">
              <img
                src="/images/about-1.jpg"
                alt="Пасічник на пасіці серед квітів"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-[4/3]">
                <img
                  src="/images/about-2.jpg"
                  alt="Стільники з медом та бджолами"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-[4/3]">
                <img
                  src="/images/about-3.jpg"
                  alt="Свіжий мед у банках з ложкою-веретеном"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TIKTOK / VIDEO SECTION */}
      <section className="container-p pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1E2022] via-[#2A2D30] to-[#1C1F22] text-[#FFFDF8] p-6 sm:p-10 md:p-12 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-white/10 px-3 py-1 rounded-full">
                Відео з пасіки
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold mt-3">
                Більше життя нашої пасіки — у TikTok 🐝
              </h2>
              <p className="mt-2 text-white/70 text-sm sm:text-base max-w-xl">
                Дивіться, як живе наша пасіка, як працюють бджілки та як народжується натуральний мед.
              </p>
            </div>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-accent hover:bg-honey text-ink font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>Ми в TikTok</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.41a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.45a8.27 8.27 0 0 0 4.82 1.54V6.69z" />
              </svg>
            </a>
          </div>

          {/* 4 Vertical Video Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TIKTOK_VIDEOS.map((v, i) => (
              <a
                key={i}
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-2xl overflow-hidden aspect-[9/16] bg-black/40 border border-white/10 hover:border-accent transition-all flex flex-col justify-end p-3 shadow-lg"
              >
                <img
                  src={v.image}
                  alt={v.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                {/* Play Button Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                {/* Video Info */}
                <div className="relative z-10">
                  <div className="text-[10px] font-semibold text-accent flex items-center gap-1">
                    <span>👁️</span> {v.views}
                  </div>
                  <h4 className="text-xs font-semibold text-white mt-1 line-clamp-2 leading-tight">
                    {v.title}
                  </h4>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
