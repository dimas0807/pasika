import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import TikTokCard from "../components/TikTokCard";
import RealisticBee from "../components/RealisticBee";
import WaxHoneycomb from "../components/WaxHoneycomb";
import { Categories, Products, Settings, subscribe } from "../data/db";

const TRUST_BADGES = [
  {
    icon: <RealisticBee size={28} depth="near" />,
    title: "Власна пасіка",
    desc: "Родинна справа",
  },
  {
    icon: <span className="text-2xl">🍯</span>,
    title: "Натуральний мед",
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

const CATEGORY_SHOWCASE = [
  {
    slug: "honey",
    name: "Мед натуральний",
    tag: "100% натурально",
    desc: "Різнотрав'я, липа, лісовий, акація та стільники",
    image: "/images/prod-honey.jpg",
    link: "/catalog?category=honey",
  },
  {
    slug: "cream-honey",
    name: "Крем-мед",
    tag: "Ніжна текстура",
    desc: "З кокосом, малиною, смородиною, лимоном та какао",
    image: "/images/prod-cream-honey.jpg",
    link: "/catalog?category=cream-honey",
  },
  {
    slug: "nuts-honey",
    name: "Горіхи в меді",
    tag: "Добірні горіхи",
    desc: "Волоський горіх, фундук та мигдаль у свіжому меді",
    image: "/images/prod-nuts-honey.jpg",
    link: "/catalog?category=nuts-honey",
  },
  {
    slug: "pollen",
    name: "Квітковий пилок",
    tag: "Сила природи",
    desc: "Натуральні гранули пилку прямо з вуликів",
    image: "/images/prod-pollen.jpg",
    link: "/catalog?category=pollen",
  },
  {
    slug: "propolis",
    name: "Прополіс",
    tag: "Природний захист",
    desc: "Очищений пасічний прополіс та настоянки",
    image: "/images/prod-propolis.jpg",
    link: "/catalog?category=propolis",
  },
  {
    slug: "perga",
    name: "Бджолина перга",
    tag: "Бджолиний хліб",
    desc: "Концентрована природна користь із воскових сот",
    image: "/images/prod-perga.jpg",
    link: "/catalog?category=perga",
  },
  {
    slug: "gift-boxes",
    name: "Подарункові бокси",
    tag: "Крафтовий подарунок",
    desc: "Святкові набори з медом, свічками та веретеном",
    image: "/images/prod-gift-box.jpg",
    link: "/gift-boxes",
  },
];

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
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Products.fetchAll();
    Categories.fetchAll();
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => {
      setTick((t) => t + 1);
      setS(Settings.get());
    });
  }, []);

  const featured = Products.featured().slice(0, 5);

  const aboutTitle = s?.about?.title || "Мед, який починається з бджіл";
  const aboutLead = s?.about?.shortText || s?.about?.lead || "Ми пасічники і дуже любимо родинну справу. Знаходимось на Прикарпатті, в селі Новоселиця Снятинського району. Перший наш вулик з'явився 10 років назад, а сьогодні на нашій пасіці налічується понад 100 вуликів.";
  const aboutStory = s?.about?.fullDescription || s?.about?.story || "Робота на пасіці вимагає терпіння, уважності і знань. Це водночас цікавий та трудомісткий процес, який починається з ранньої весни та закінчується восени.";
  const hivesCount = s?.about?.hivesCount || s?.about?.stats?.hives || "100+";
  const years = s?.about?.foundationYear
    ? (s.about.foundationYear.length === 4 && !Number.isNaN(Number(s.about.foundationYear))
        ? `${Math.max(1, new Date().getFullYear() - Number(s.about.foundationYear))}`
        : s.about.foundationYear)
    : s?.about?.stats?.years || "10";
  const location = s?.about?.location || s?.store?.location || "Прикарпаття, с. Новоселиця";

  return (
    <div className="overflow-x-hidden">
      {/* ==================================================
          01 — IMMERSIVE FULL-WIDTH HERO (85–90vh)
          ================================================== */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden border-b border-ink/5">
        {/* Full-bleed Authentic Apiary Photography Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/about-apiary.jpg"
            alt="Родинна пасіка серед лугових квітів на Прикарпатті"
            className="w-full h-full object-cover object-center lg:object-[68%_center] scale-100 transform motion-safe:scale-102 transition-transform duration-1000"
            loading="eager"
          />
          {/* Atmospheric Cinematic Gradient (Warm Amber Shadow for Pure Contrast) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#17120A]/90 via-[#17120A]/60 md:via-[#17120A]/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17120A]/85 via-transparent to-transparent md:hidden z-10" />
        </div>

        {/* Foreground Content Composed Into The Photograph */}
        <div className="container-p relative z-20 py-16 sm:py-20 lg:py-28 w-full">
          <div className="max-w-2xl text-white">
            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight drop-shadow-md">
              Натуральний мед <br />
              <span className="text-accent drop-shadow-sm">прямо з нашої пасіки 🍯</span>
            </h1>

            {/* Supporting Story Text */}
            <p className="mt-5 text-white/90 text-base sm:text-lg max-w-xl leading-relaxed font-normal drop-shadow-sm">
              Власна пасіка, натуральні продукти бджільництва та подарункові набори зі швидкою доставкою по всій Україні.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <Link
                to="/catalog"
                className="btn-primary text-base px-8 py-3.5 shadow-lg w-full sm:w-auto text-center font-bold"
              >
                Переглянути продукцію
              </Link>
              <Link
                to="/gift-boxes"
                className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl transition-all backdrop-blur-md w-full sm:w-auto text-center"
              >
                Подарункові бокси
              </Link>
            </div>

            {/* 4 Integrated Information Overlays (Glassmorphism) */}
            <div className="mt-12 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {TRUST_BADGES.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xs hover:bg-white/25 transition-all text-white"
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-snug">
                      {b.title}
                    </div>
                    <div className="text-[10px] text-white/75 hidden sm:block mt-0.5">
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
          02 — CATEGORIES SECTION (Meadow Flora & Apiary Harvest)
          ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5EB] via-[#F5EDDE] to-[#FAF5EB] py-16 md:py-24 border-b border-amber-900/10">
        {/* Decorative Wax Honeycomb Frame on the Left */}
        <WaxHoneycomb position="left" withBee={true} className="hidden xl:block" />

        {/* Ambient Warm Amber Glow */}
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-honey/10 blur-3xl pointer-events-none" />

        <div className="container-p relative z-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-honey/30 text-xs font-bold uppercase tracking-widest text-honey shadow-2xs">
                <span>🍯</span>
                <span>Дари нашої пасіки</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink mt-3">
                Категорії продукції
              </h2>
              <p className="text-ink/75 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                Кожен продукт — результат невтомної праці бджіл та дбайливого фасування без промислової обробки
              </p>
            </div>
            <Link
              to="/catalog"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start md:self-auto font-bold"
            >
              Весь каталог товарів →
            </Link>
          </div>

          {/* Top Row: 3 Primary Categories (Large Showcase Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {CATEGORY_SHOWCASE.slice(0, 3).map((cat) => (
              <Link
                key={cat.slug}
                to={cat.link}
                className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-2xl border border-amber-900/15 hover:border-honey transition-all duration-500 flex flex-col justify-end p-6 select-none bg-[#FAF6EE]"
              >
                {/* Full-bleed Photo */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Cinematic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-colors" />

                {/* Content Overlay */}
                <div className="relative z-10 text-white">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-accent bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 mb-2">
                    {cat.tag}
                  </span>
                  <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-white group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/85 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent group-hover:translate-x-1.5 transition-transform duration-300">
                    <span>Переглянути категорію</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Row: 4 Specialist Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORY_SHOWCASE.slice(3).map((cat) => (
              <Link
                key={cat.slug}
                to={cat.link}
                className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-lg border border-amber-900/10 hover:border-honey transition-all duration-500 flex flex-col justify-end p-5 select-none bg-[#FAF6EE]"
              >
                {/* Full-bleed Photo */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Cinematic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/90 transition-colors" />

                {/* Content Overlay */}
                <div className="relative z-10 text-white">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 mb-1.5">
                    {cat.tag}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-white group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-1">
                    {cat.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-accent group-hover:translate-x-1 transition-transform duration-300">
                    <span>Переглянути →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          03 — POPULAR PRODUCTS (Artisan Wooden Cellar & Table)
          ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7EFE2] via-[#FBF7EE] to-[#F7EFE2] py-16 md:py-24 border-b border-amber-900/10">
        <div className="container-p relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-honey/30 text-xs font-bold uppercase tracking-widest text-honey shadow-2xs">
                <span>🍯</span>
                <span>З медової комори на ваш стіл</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink mt-3">
                Популярні товари
              </h2>
              <p className="text-ink/75 text-sm sm:text-base mt-1">
                Найулюбленіші медові продукти, свіжо фасовані з родинної пасіки
              </p>
            </div>
            <Link
              to="/catalog"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shrink-0 self-start sm:self-auto font-bold"
            >
              Переглянути всі товари →
            </Link>
          </div>

          {/* Wooden Tabletop Frame for Product Jars */}
          <div className="relative rounded-3xl p-4 sm:p-6 lg:p-8 bg-[#FFFDF9]/90 backdrop-blur-xs border border-amber-800/15 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Wooden Table Shelf Edge Base */}
            <div className="mt-6 pt-4 border-t border-amber-900/10 flex flex-wrap items-center justify-between text-xs text-ink/65 gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <span>🪵</span> Натуральне дерев'яне фасування та крафтове пакування
              </span>
              <span className="font-semibold text-honey">
                100% чистий мед без цукру та домішок
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          04 — GIFT BOXES EDITORIAL SHOWCASE (Artisan Craft)
          ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7EFE2] via-[#FAF5EC] to-[#F7EFE2] py-16 md:py-24 border-b border-amber-900/10">
        <WaxHoneycomb position="right" withBee={true} className="hidden xl:block" />

        <div className="container-p relative z-20">
          <div className="rounded-3xl bg-gradient-to-br from-[#FAF5EC] via-[#FFFDF9] to-[#F3ECD9] border border-amber-800/20 p-6 sm:p-10 md:p-14 shadow-md grid md:grid-cols-12 gap-8 lg:gap-12 items-center overflow-hidden relative">
            <div className="md:col-span-7 z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/25 shadow-2xs">
                Подарункова колекція
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink mt-4 leading-tight">
                Подарунок, який запам'ятається 💛
              </h2>
              <p className="mt-4 text-ink/80 text-sm sm:text-base leading-relaxed max-w-lg">
                Натуральні продукти бджільництва, стильне крафтове пакування та частинка сонячного тепла родинної пасіки у кожному наборі. Ідеально для затишного свята чи подарунка рідним.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/gift-boxes" className="btn-primary text-sm sm:text-base px-8 py-3.5 font-bold shadow-md">
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
        </div>
      </section>

      {/* ==================================================
          05 — OUR APIARY / ABOUT STORYTELLING (Novoselytsia)
          ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5EB] via-[#F4EDE0] to-[#FAF5EB] py-16 md:py-24 border-b border-amber-900/10">
        <div className="container-p relative z-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Text & Story */}
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/25 shadow-2xs">
                Наша історія
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3 leading-snug">
                {aboutTitle}
              </h2>
              <p className="mt-4 text-ink/80 leading-relaxed text-sm sm:text-base">
                {aboutLead}
              </p>
              <p className="mt-3 text-ink/75 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {aboutStory}
              </p>

              {/* 4 Storytelling Badges */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/85 border border-gold/30 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 shadow-2xs">
                    <RealisticBee size={24} depth="near" facing="right" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{years} років досвіду</h4>
                    <p className="text-xs text-ink/60 mt-0.5">Від першого вулика до власного виробництва</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/85 border border-gold/30 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 shadow-2xs text-lg">
                    🏡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Понад {hivesCount} вуликів</h4>
                    <p className="text-xs text-ink/60 mt-0.5">Одна родинна справа та щоденна турбота</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/85 border border-gold/30 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 shadow-2xs text-lg">
                    📍
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{location}</h4>
                    <p className="text-xs text-ink/60 mt-0.5">Екологічно чистий регіон</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/85 border border-gold/30 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 shadow-2xs text-lg">
                    🍯
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Натуральні продукти</h4>
                    <p className="text-xs text-ink/60 mt-0.5">Мед, соти, крем-меди та набори</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/about" className="btn-secondary text-sm font-bold px-7 py-3.5">
                  Наша історія та цінності →
                </Link>
              </div>
            </div>

            {/* Editorial Collage of Real Honey & Honeycomb */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[3/4] bg-white group">
                <img
                  src="/images/hero-honey.jpg"
                  alt="Свіжий мед у банках зі стільниками"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[4/3] bg-white group">
                  <img
                    src="/images/about-honeycomb.jpg"
                    alt="Стільники з натуральним медом"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-md border-2 border-white aspect-[4/3] bg-white group">
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
        </div>
      </section>

      {/* ==================================================
          06 — TIKTOK / VIDEO HOVER PREVIEW SECTION
          ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5EB] via-[#F5EDDE] to-[#FAF5EB] py-16 border-b border-amber-900/10">
        <div className="container-p relative z-20">
          <div className="rounded-3xl bg-gradient-to-br from-[#FAF5EC] via-[#FFFDF9] to-[#F3ECD9] border border-amber-800/20 text-ink p-6 sm:p-10 md:p-12 shadow-md">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/25 shadow-2xs">
                  <RealisticBee size={18} depth="near" facing="right" />
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
        </div>
      </section>

      {/* ==================================================
          07 — FINAL ATMOSPHERIC PHOTO CTA SCENE
          ================================================== */}
      <section className="relative overflow-hidden bg-[#FAF5EB] py-16">
        <div className="container-p">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-800/30 text-white min-h-[380px] flex items-center justify-center p-8 sm:p-14 text-center">
            {/* Atmospheric Background Photo */}
            <img
              src="/images/hero-honey.jpg"
              alt="Натуральний мед та стільники"
              className="absolute inset-0 w-full h-full object-cover object-center scale-102"
              loading="lazy"
            />
            {/* Warm Dark Honey Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/75 z-10" />

            {/* Content */}
            <div className="relative z-20 max-w-2xl mx-auto">
              <span className="text-3xl mb-3 inline-block">🍯</span>
              <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                Спробуйте смак нашої пасіки
              </h2>
              <p className="mt-4 text-white/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Мед, крем-меди, пилок, прополіс, горішки в меді, свічки та подарункові набори — обирайте те, що припаде до душі.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/catalog" className="btn-primary text-base px-9 py-3.5 font-bold shadow-lg hover:shadow-xl">
                  Перейти до магазину
                </Link>
                <Link to="/contacts" className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl transition-all backdrop-blur-md">
                  Контакти пасіки
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
