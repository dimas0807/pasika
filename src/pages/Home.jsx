import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import TikTokCard from "../components/TikTokCard";
import RealisticBee from "../components/RealisticBee";
import { Categories, Products, subscribe } from "../data/db";

const TRUST_BADGES = [
  {
    icon: <RealisticBee size={26} depth="near" />,
    title: "Власна пасіка",
    desc: "Родинна справа",
  },
  {
    icon: <span className="text-2xl">🍯</span>,
    title: "Натуральні продукти",
    desc: "Без цукру та домішок",
  },
  {
    icon: <span className="text-2xl">🏡</span>,
    title: "Понад 100 вуликів",
    desc: "Прикарпаття, с. Новоселиця",
  },
  {
    icon: <span className="text-2xl">🚚</span>,
    title: "Доставка по Україні",
    desc: "Нова пошта та Укрпошта",
  },
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

const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@honey.dsv";

const TIKTOK_VIDEOS = [
  {
    id: 1,
    url: "https://vt.tiktok.com/ZSbLujdn8/",
    videoSrc: "/tiktok/video-1.mp4",
    poster: "/tiktok/preview-1.jpg",
    label: "Життя пасіки",
  },
  {
    id: 2,
    url: "https://vt.tiktok.com/ZSbLujG9o/",
    videoSrc: "/tiktok/video-2.mp4",
    poster: "/tiktok/preview-2.jpg",
    label: "Праця бджіл",
  },
  {
    id: 3,
    url: "https://vt.tiktok.com/ZSbLuJ8S1/",
    videoSrc: "/tiktok/video-3.mp4",
    poster: "/tiktok/preview-3.jpg",
    label: "Свіжий мед",
  },
  {
    id: 4,
    url: "https://vt.tiktok.com/ZSbLuM7kb/",
    videoSrc: "/tiktok/video-4.mp4",
    poster: "/tiktok/preview-4.jpg",
    label: "Крафтові бокси",
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
      {/* ==================================================
          01 — IMMERSIVE FULL-WIDTH HERO (85–90vh)
          ================================================== */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden border-b border-ink/5">
        {/* Full-bleed Authentic Apiary Photography Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-scene-clean.jpg"
            alt="Українська родинна пасіка серед квіткового лугу"
            className="w-full h-full object-cover object-center lg:object-right scale-100 transform motion-safe:scale-102 transition-transform duration-1000"
            loading="eager"
          />
          {/* Subtle warm sunlight & legibility gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE]/95 via-[#FAF6EE]/80 md:via-[#FAF6EE]/65 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6EE]/90 via-transparent to-transparent md:hidden z-10" />
        </div>

        {/* Foreground Content Composed Into The Scene */}
        <div className="container-p relative z-20 py-16 sm:py-20 lg:py-28 w-full">
          <div className="max-w-2xl">
            {/* Natural Tag Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-honey/30 text-ink text-xs font-bold uppercase tracking-wider mb-5 shadow-xs">
              <RealisticBee size={20} depth="near" />
              <span>Родинна пасіка на Прикарпатті</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.12] tracking-tight">
              Натуральний мед <br />
              <span className="text-ink">прямо з нашої пасіки 🍯</span>
            </h1>

            {/* Supporting Story Text */}
            <p className="mt-5 text-ink/85 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Власна пасіка, натуральні продукти бджільництва та подарункові набори зі швидкою доставкою по всій Україні.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <Link
                to="/catalog"
                className="btn-primary text-base px-8 py-3.5 shadow-md hover:shadow-lg w-full sm:w-auto text-center font-bold"
              >
                Переглянути продукцію
              </Link>
              <Link
                to="/gift-boxes"
                className="btn-secondary text-base px-7 py-3.5 bg-white/85 backdrop-blur-sm hover:bg-white w-full sm:w-auto text-center font-semibold"
              >
                Подарункові бокси
              </Link>
            </div>

            {/* 4 Integrated Information Overlays (Subtle, Not Generic Cards) */}
            <div className="mt-12 pt-6 border-t border-ink/15 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {TRUST_BADGES.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-2xs hover:bg-white/90 transition-all"
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink leading-snug">
                      {b.title}
                    </div>
                    <div className="text-[10px] text-ink/65 hidden sm:block mt-0.5">
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
          02 — PRODUCT CATEGORIES (Editorial Photo Gallery)
          ================================================== */}
      <section className="container-p py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3 py-1 rounded-full border border-honey/20">
              Наш асортимент
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink mt-3">
              Категорії товарів
            </h2>
            <p className="text-ink/65 text-sm sm:text-base mt-1">
              Свіжий мед різних зборів, авторські крем-меди та корисні дари пасіки
            </p>
          </div>
          <Link
            to="/catalog"
            className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start md:self-auto"
          >
            Весь каталог →
          </Link>
        </div>

        {/* Circular / Curved Category Photography Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
          {categories.map((c) => {
            const catImage = CATEGORY_IMAGES[c.slug] || "/images/prod-honey.jpg";
            const targetUrl = c.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${c.slug}`;

            return (
              <Link
                key={c.slug}
                to={targetUrl}
                className="group flex flex-col items-center text-center p-3.5 rounded-3xl bg-[#FAF6EE]/50 hover:bg-[#FAF6EE] border border-ink/5 hover:border-honey/40 transition-all duration-300"
              >
                {/* Photo circle with natural ring */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-sm border-2 border-white ring-2 ring-gold/20 group-hover:ring-honey group-hover:scale-105 transition-all duration-300 bg-[#FAF6EE]">
                  <img
                    src={catImage}
                    alt={c.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                {/* Title */}
                <span className="mt-3 font-serif font-bold text-xs sm:text-sm text-ink group-hover:text-honey transition-colors">
                  {c.name}
                </span>
                <span className="text-[11px] text-ink/50 mt-0.5 group-hover:text-honey/80 transition-colors">
                  Переглянути →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          03 — POPULAR PRODUCTS
          ================================================== */}
      <section className="bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EE] to-[#FFFDF8] py-14 md:py-20 border-y border-ink/5">
        <div className="container-p">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3 py-1 rounded-full border border-honey/20">
                Вибір покупців
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink mt-3">
                Популярні товари
              </h2>
              <p className="text-ink/65 text-sm sm:text-base mt-1">
                Найулюбленіші медові продукти з нашої пасіки
              </p>
            </div>
            <Link
              to="/catalog"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start sm:self-auto"
            >
              Переглянути всі товари →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          04 — GIFT BOXES EDITORIAL SHOWCASE
          ================================================== */}
      <section className="container-p py-14 md:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#FAF6EE] via-[#FDFBF7] to-[#F3ECD9] border border-gold/40 p-6 sm:p-10 md:p-14 shadow-sm grid md:grid-cols-12 gap-8 lg:gap-12 items-center overflow-hidden relative">
          <div className="md:col-span-7 z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs">
              Подарункова колекція
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink mt-4 leading-tight">
              Подарунок, який запам'ятається 💛
            </h2>
            <p className="mt-4 text-ink/80 text-sm sm:text-base leading-relaxed max-w-lg">
              Натуральні продукти бджільництва, стильне крафтове пакування та частинка сонячного тепла родинної пасіки у кожному наборі. Ідеально для затишного свята чи подарунка рідним.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/gift-boxes" className="btn-primary text-sm sm:text-base px-7 py-3.5 font-bold shadow-md">
                Переглянути всі бокси
              </Link>
              <span className="text-xs text-ink/65 font-medium">від 450 грн • надійне пакування</span>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-[4/3] bg-white group">
              <img
                src="/images/prod-gift-box.jpg"
                alt="Крафтовий подарунковий бокс з медом та свічкою"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          05 — OUR APIARY / ABOUT STORYTELLING
          ================================================== */}
      <section className="container-p pb-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Text & Story */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3 py-1 rounded-full border border-honey/20">
              Наша історія
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3 leading-snug">
              Мед, який починається з бджіл
            </h2>
            <p className="mt-4 text-ink/80 leading-relaxed text-sm sm:text-base">
              Ми пасічники і дуже любимо родинну справу. Знаходимось на Прикарпатті, в селі Новоселиця Снятинського району. Перший наш вулик з'явився 10 років назад, а сьогодні на нашій пасіці налічується понад 100 вуликів.
            </p>
            <p className="mt-3 text-ink/75 leading-relaxed text-sm sm:text-base">
              Робота на пасіці вимагає терпіння, уважності і знань. Це водночас цікавий та трудомісткий процес, який починається з ранньої весни та закінчується восени.
            </p>

            {/* 4 Storytelling Badges */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-gold/25">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                  <RealisticBee size={24} depth="near" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">10 років досвіду</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Від першого вулика до власного виробництва</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-gold/25">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs text-lg">
                  🏡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Понад 100 вуликів</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Одна родинна справа та щоденна турбота</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-gold/25">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs text-lg">
                  📍
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Прикарпаття</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Село Новоселиця, Снятинський район</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-gold/25">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs text-lg">
                  🍯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Натуральні продукти</h4>
                  <p className="text-xs text-ink/60 mt-0.5">Мед, соти, крем-меди та набори</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/about" className="btn-secondary text-sm font-bold px-6 py-3">
                Наша історія та цінності →
              </Link>
            </div>
          </div>

          {/* Editorial Collage */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[3/4] bg-[#FAF6EE] group">
              <img
                src="/images/about-apiary.jpg"
                alt="Родинна пасіка в селі Новоселиця"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[4/3] bg-[#FAF6EE] group">
                <img
                  src="/images/about-honeycomb.jpg"
                  alt="Стільники з натуральним медом"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[4/3] bg-[#FAF6EE] group">
                <img
                  src="/images/about-2.jpg"
                  alt="Праця бджіл на рамці"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          06 — TIKTOK / VIDEO HOVER PREVIEW SECTION
          ================================================== */}
      <section className="container-p pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#FAF6EE] via-[#FDFBF7] to-[#F3ECD9] border border-gold/40 text-ink p-6 sm:p-10 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs">
                <RealisticBee size={18} depth="near" />
                <span>Офіційний TikTok: @honey.dsv</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink mt-3 leading-tight">
                Більше життя нашої пасіки — у TikTok
              </h2>
              <p className="mt-2 text-ink/75 text-sm sm:text-base max-w-xl leading-relaxed">
                Підписуйтесь на наш офіційний канал <b>@honey.dsv</b>: показуємо щоденне життя пасіки, процес збору меду та залаштунки створення нашої продукції.
              </p>
            </div>
            <a
              href={TIKTOK_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm sm:text-base px-7 py-3.5 font-bold shadow-md hover:shadow-lg shrink-0 flex items-center gap-2"
            >
              <span>Дивитися нашу пасіку в TikTok →</span>
            </a>
          </div>

          {/* 4 Vertical Video Preview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TIKTOK_VIDEOS.map((item) => (
              <TikTokCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          07 — FINAL CTA SECTION
          ================================================== */}
      <section className="container-p pb-14">
        <div className="card p-8 sm:p-12 text-center bg-[#FAF6EE] border border-gold/30 rounded-3xl shadow-sm max-w-4xl mx-auto">
          <span className="text-3xl mb-2 inline-block">🍯</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink">
            Спробуйте смак нашої пасіки
          </h2>
          <p className="mt-3 text-ink/75 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Мед, крем-меди, пилок, прополіс, горішки в меді, свічки та подарункові набори — обирайте те, що припаде до душі.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/catalog" className="btn-primary text-base px-8 py-3.5 font-bold shadow-md hover:shadow-lg">
              Перейти до магазину
            </Link>
            <Link to="/contacts" className="btn-secondary text-base px-7 py-3.5 font-semibold">
              Контакти пасіки
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
