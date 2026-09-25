import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RealisticBee from "../components/RealisticBee";
import TikTokCard from "../components/TikTokCard";
import { Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";

const VALUES = [
  {
    icon: <RealisticBee size={34} depth="near" />,
    title: "Власна сімейна пасіка",
    desc: "Це родинна справа, яка почалася з одного вулика і за 10 років виросла у власне виробництво.",
  },
  {
    icon: "🍯",
    title: "Натуральний продукт",
    desc: "Ми працюємо з продуктами власної пасіки та створюємо натуральні медові продукти.",
  },
  {
    icon: "💛",
    title: "Дбайливе фасування",
    desc: "Кожен продукт фасується акуратно та з увагою до деталей, щоб зберегти його вигляд і якість до моменту, коли він потрапить до вас.",
  },
  {
    icon: "📦",
    title: "Надійне пакування",
    desc: "Ми приділяємо увагу пакуванню, щоб продукція безпечно пережила дорогу та приїхала до вас цілою й охайною.",
  },
];

const STORY_STEPS = [
  {
    step: "10 років тому",
    title: "Перший вулик",
    desc: "Поява першого вулика та перші кроки в бджільництві.",
    icon: "🌱",
  },
  {
    step: "Розвиток",
    title: "Любов до справи",
    desc: "Терпіння, уважність і щоденне вивчення життя бджіл.",
    icon: <RealisticBee size={28} depth="near" />,
  },
  {
    step: "Сьогодні",
    title: "100+ вуликів",
    desc: "Велика родинна пасіка серед природи Прикарпаття.",
    icon: "🍯",
  },
  {
    step: "Результат",
    title: "Власне виробництво",
    desc: "Створення натуральних медів, крем-медів та наборів.",
    icon: "✨",
  },
];

const SEASONS = [
  {
    season: "Рання весна",
    title: "Пробудження",
    desc: "Початок сезону: весняний огляд вуликів, турбота про бджолосім'ї та підготовка рамок до нового медозбору.",
    icon: "🌱",
  },
  {
    season: "Літо",
    title: "Медозбір",
    desc: "Активна невтомна праця бджіл серед різнотрав'я, липи та акації. Збір свіжого нектару та сотового меду.",
    icon: "☀️",
  },
  {
    season: "Осінь",
    title: "Підсумки та затишок",
    desc: "Завершення медового сезону, підготовка вуликів до спокійної зимівлі, дбайливе фасування продукції.",
    icon: "🍂",
  },
];

const ASSORTMENT = [
  {
    category: "Мед",
    icon: "🍯",
    link: "/catalog?category=honey",
    buttonLabel: "Переглянути мед →",
    items: [
      "Мед різнотрав'я",
      "Липовий мед",
      "Лісовий мед",
      "Акацієвий мед",
      "Медові соти",
    ],
  },
  {
    category: "Крем-мед",
    icon: "🍓",
    link: "/catalog?category=cream-honey",
    buttonLabel: "Переглянути крем-мед →",
    items: [
      "Кокос та мигдаль",
      "Какао та фундук",
      "Лимон та імбир",
      "Лайм та апельсин",
      "Малина",
      "Смородина",
      "Полуниця",
    ],
  },
  {
    category: "Інші продукти",
    icon: "🎁",
    link: "/gift-boxes",
    buttonLabel: "Подарункові набори →",
    items: [
      "Пилок бджолиний",
      "Прополіс",
      "Горішки в меді",
      "Воскові свічки",
      "Подарункові набори",
    ],
  },
];

const FIRST_TIKTOK_VIDEO = {
  id: 1,
  url: "https://vt.tiktok.com/ZSbLujdn8/",
  videoSrc: "/tiktok/video-1.mp4",
  poster: "/tiktok/preview-1.jpg",
  label: "Життя нашої пасіки",
};

export default function About() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const title = s?.about?.title || "«Ми пасічники і дуже любимо родинну справу»";
  const lead = s?.about?.shortText || s?.about?.lead || "Ми знаходимось на Прикарпатті, в селі Новоселиця Снятинського району. Перший наш вулик з'явився 10 років назад, і з того часу любов до бджільництва виросла у власне виробництво.";
  const story = s?.about?.fullDescription || s?.about?.story || "На нашій пасіці налічується більше ста вуликів. Робота на пасіці вимагає терпіння, уважності і знань. Це водночас цікавий та трудомісткий процес, який починається з ранньої весни та закінчується восени.";
  const location = s?.about?.location || s?.store?.location || "Прикарпаття • село Новоселиця";
  const hivesCount = s?.about?.hivesCount || s?.about?.stats?.hives || "100+";
  const years = s?.about?.foundationYear
    ? (s.about.foundationYear.length === 4 && !Number.isNaN(Number(s.about.foundationYear))
        ? `${Math.max(1, new Date().getFullYear() - Number(s.about.foundationYear))}`
        : s.about.foundationYear)
    : s?.about?.stats?.years || "10";

  const telegram = (s?.contacts?.telegram || "").trim();
  const telegramUrl = telegram ? getSocialUrl("telegram", telegram) : null;

  return (
    <div className="overflow-x-hidden pb-16">
      {/* 1. HERO & EDITORIAL LAYOUT */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F1E5] via-[#FCF9F2] to-[#FFFDF8] border-b border-ink/5 pt-8 pb-14 md:py-20">
        <div className="container-p relative z-20">
          <nav className="text-xs text-ink/50 mb-4 flex items-center gap-1.5">
            <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
            <span>/</span>
            <span className="text-ink/80 font-medium">Про нас</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-honey/30 text-ink text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
                <span>📍</span>
                <span>{location}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.15] tracking-tight">
                {title}
              </h1>

              <div className="mt-6 space-y-4 text-ink/80 text-base sm:text-lg leading-relaxed max-w-2xl">
                <p>{lead}</p>
                <p className="text-ink/75 text-sm sm:text-base whitespace-pre-line">
                  {story}
                </p>
              </div>

              {/* Geographic Card */}
              <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#FAF6EE] border border-gold/30 shadow-2xs w-full max-w-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gold/40 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  🌄
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-honey">Географія нашої пасіки</div>
                  <div className="font-serif text-base sm:text-lg font-bold text-ink mt-0.5">
                    {location}
                  </div>
                  <div className="text-xs text-ink/60">Екологічно чистий регіон</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/catalog" className="btn-primary text-sm sm:text-base px-7 py-3.5 font-bold shadow-md">
                  Переглянути продукцію
                </Link>
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm sm:text-base px-6 py-3.5"
                  >
                    Написати у Telegram →
                  </a>
                )}
              </div>
            </div>

            {/* Right Editorial Photo */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white aspect-[4/5]">
                  <img
                    src="/images/about-apiary.jpg"
                    alt="Пасіка серед природи Прикарпаття"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Decorative floating badge */}
                <div className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-6 bg-white/95 backdrop-blur-md border border-gold/30 rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center">
                    <RealisticBee size={32} depth="near" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink uppercase tracking-wide">{years} років досвіду</div>
                    <div className="text-[11px] text-ink/60">Родинна пасіка: {location}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. НАША ІСТОРІЯ: STORYTELLING VISUAL COMPOSITION */}
      <section className="container-p py-14 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3.5 py-1.5 rounded-full border border-honey/20">
            Родинний шлях
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3">
            Пасіка, яка почалася з одного вулика
          </h2>
          <p className="mt-3 text-ink/70 text-sm sm:text-base leading-relaxed">
            10 років тому з'явився перший вулик. Поступово любов до бджільництва переросла у власне виробництво. Сьогодні пасіка налічує понад 100 вуликів.
          </p>
        </div>

        {/* Visual Composition Flow */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {STORY_STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="relative card p-6 bg-[#FAF6EE] border border-gold/25 rounded-2xl flex flex-col justify-between hover:border-honey/60 hover:shadow-md transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-honey bg-white px-2.5 py-1 rounded-full border border-gold/20 shadow-2xs">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink group-hover:text-honey transition-colors">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-ink/70 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {idx < STORY_STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gold/40 text-honey flex items-center justify-center text-xs font-bold shadow-2xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. НАША ПАСІКА & ГЕОГРАФІЯ */}
      <section className="bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EE] to-[#FFFDF8] py-14 md:py-20 border-y border-ink/5">
        <div className="container-p">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20">
              Масштаб та родина
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3">
              Понад {hivesCount} вуликів — одна родинна справа
            </h2>
            <p className="mt-3 text-ink/75 text-sm sm:text-base leading-relaxed">
              На пасіці налічується понад {hivesCount} вуликів. За кожним вуликом стоять щоденна увага, терпіння та робота пасічників.
            </p>
          </div>

          {/* 3 Metric Storytelling Badges */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card p-6 sm:p-8 bg-white border border-gold/30 rounded-3xl text-center shadow-xs">
              <div className="font-serif text-4xl sm:text-5xl font-extrabold text-honey">
                {hivesCount}
              </div>
              <div className="font-bold text-ink mt-2 text-base">Вуликів на пасіці</div>
              <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                Щоденна праця та догляд за кожною бджолосім'єю
              </p>
            </div>

            <div className="card p-6 sm:p-8 bg-white border border-gold/30 rounded-3xl text-center shadow-xs">
              <div className="font-serif text-4xl sm:text-5xl font-extrabold text-honey">
                {years}
              </div>
              <div className="font-bold text-ink mt-2 text-base">Років родинної справи</div>
              <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                Від першого вулика до власного виробництва меду
              </p>
            </div>

            <div className="card p-6 sm:p-8 bg-white border border-gold/30 rounded-3xl text-center shadow-xs">
              <div className="text-3xl sm:text-4xl mb-1">
                📍
              </div>
              <div className="font-bold text-ink mt-2 text-base">{location}</div>
              <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                Екологічно чистий регіон України
              </p>
            </div>
          </div>

          {/* ШИРОКИЙ БЛОК СЕЗОННОСТІ */}
          <div className="mt-14 card p-6 sm:p-10 md:p-12 bg-white border border-gold/30 rounded-3xl shadow-sm">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-honey bg-cream px-3 py-1 rounded-full">
                Сезонність праці
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">
                Від весняного пробудження до осіннього медозбору
              </h3>
              <p className="mt-2 text-ink/70 text-xs sm:text-sm leading-relaxed">
                Робота на пасіці вимагає терпіння, уважності і знань. Це водночас цікавий та трудомісткий процес, який починається з ранньої весни та закінчується восени.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {SEASONS.map((s) => (
                <div key={s.season} className="p-5 rounded-2xl bg-[#FAF6EE] border border-ink/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-honey">{s.season}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-ink mb-1.5">{s.title}</h4>
                    <p className="text-xs text-ink/70 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. ПРИНЦИПИ ТА ЦІННОСТІ */}
      <section className="container-p py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3.5 py-1.5 rounded-full border border-honey/20">
            Основа нашої роботи
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3">
            Наші принципи та цінності
          </h2>
          <p className="text-xs sm:text-sm text-ink/65 mt-2">
            Чотири непорушних правила нашої родинної пасіки
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="card p-6 bg-[#FAF6EE] border border-gold/25 rounded-2xl flex flex-col items-center text-center hover:border-honey hover:shadow-md transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-gold/30 flex items-center justify-center text-3xl mb-4 shadow-2xs">
                {v.icon}
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-ink mb-2">
                {v.title}
              </h3>
              <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. АСОРТИМЕНТ: ЩО СТВОРЮЄМО НА НАШІЙ ПАСІЦІ */}
      <section className="bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EE] to-[#FFFDF8] py-14 md:py-20 border-y border-ink/5">
        <div className="container-p">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20">
              Продукція пасіки
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3">
              Що створюємо на нашій пасіці
            </h2>
            <p className="mt-2 text-ink/70 text-sm sm:text-base leading-relaxed">
              Натуральний мед різних зборів, авторські десертні крем-меди та корисні продукти бджільництва
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ASSORTMENT.map((cat) => (
              <div
                key={cat.category}
                className="card p-6 sm:p-7 bg-white border border-gold/30 rounded-3xl shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-ink/10 mb-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <h3 className="font-serif font-extrabold text-xl text-ink">
                      {cat.category}
                    </h3>
                  </div>

                  <ul className="space-y-2.5">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-ink/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-ink/10">
                  <Link
                    to={cat.link}
                    className="btn-secondary text-xs sm:text-sm w-full py-2.5 text-center font-semibold"
                  >
                    {cat.buttonLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Owners Note */}
          <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-white border border-honey/30 shadow-xs max-w-2xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-ink/80 font-medium">
              «Якщо вас зацікавили дані товари — пишіть нам у особисті або замовляйте напряму через каталог сайту.»
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link to="/catalog" className="btn-primary text-xs py-2.5 px-5 font-bold">
                Відкрити каталог
              </Link>
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2.5 px-5"
                >
                  Написати в Telegram →
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. ЖИТТЯ ПАСІКИ У СВІТЛИНАХ (EDITORIAL COLLAGE) */}
      <section className="container-p py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-honey bg-cream px-3.5 py-1.5 rounded-full border border-honey/20">
            Галерея
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3">
            Життя пасіки у світлинах
          </h2>
          <p className="text-xs sm:text-sm text-ink/65 mt-2">
            Атмосфера бджільництва, природи та щоденної родинної праці
          </p>
        </div>

        {/* Editorial Collage Grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
          {/* Main Large Photo */}
          <div className="col-span-2 md:col-span-7 rounded-3xl overflow-hidden shadow-sm border border-ink/10 aspect-[4/3] bg-[#FAF6EE] group">
            <img
              src="/images/about-1.jpg"
              alt="Робота на пасіці"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Right Column: 2 photos */}
          <div className="col-span-2 md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="rounded-3xl overflow-hidden shadow-sm border border-ink/10 aspect-[16/10] bg-[#FAF6EE] group">
              <img
                src="/images/about-honeycomb.jpg"
                alt="Стільники з медом"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm border border-ink/10 aspect-[16/10] bg-[#FAF6EE] group">
              <img
                src="/images/about-2.jpg"
                alt="Бджоли на стільнику"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </div>

          {/* Bottom Row: 2 photos */}
          <div className="col-span-1 md:col-span-6 rounded-3xl overflow-hidden shadow-sm border border-ink/10 aspect-[16/9] bg-[#FAF6EE] group">
            <img
              src="/images/about-3.jpg"
              alt="Свіжий мед у скляних банках"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div className="col-span-1 md:col-span-6 rounded-3xl overflow-hidden shadow-sm border border-ink/10 aspect-[16/9] bg-[#FAF6EE] group">
            <img
              src="/images/about-apiary.jpg"
              alt="Краєвид пасіки"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 7. TIKTOK У «ПРО НАС» */}
      <section className="container-p pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#FAF6EE] via-[#FDFBF7] to-[#F3ECD9] border border-gold/40 text-ink p-6 sm:p-10 md:p-12 shadow-sm">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Text description */}
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs mb-4">
                <RealisticBee size={18} depth="near" />
                <span>Офіційний TikTok: @honey.dsv</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink leading-tight">
                Більше життя нашої пасіки — у TikTok
              </h2>
              <p className="mt-3 text-ink/75 text-sm sm:text-base leading-relaxed max-w-xl">
                Щодня пасіка має своє життя. Більше моментів із нашої роботи, бджіл та меду дивіться у TikTok.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <a
                  href="https://vt.tiktok.com/ZSbLujdn8/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-sm sm:text-base px-7 py-3.5 font-bold shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  <span>Дивитися TikTok →</span>
                </a>
                <a
                  href="https://www.tiktok.com/@honey.dsv"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-sm sm:text-base px-6 py-3.5"
                >
                  Профіль @honey.dsv
                </a>
              </div>
            </div>

            {/* Real Video Card Preview (Video 1) */}
            <div className="md:col-span-5 max-w-xs mx-auto md:mr-0 w-full">
              <TikTokCard item={FIRST_TIKTOK_VIDEO} />
            </div>
          </div>
        </div>
      </section>

      {/* 8. ФІНАЛЬНИЙ CTA */}
      <section className="container-p pb-12">
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
            <Link to="/contacts" className="btn-secondary text-base px-7 py-3.5">
              Контакти пасіки
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
