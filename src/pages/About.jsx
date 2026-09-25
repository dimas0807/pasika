import { Link } from "react-router-dom";

const VALUES = [
  { icon: "🐝", title: "Власна сімейна пасіка", desc: "Працюємо без посередників у екологічно чистому куточку України." },
  { icon: "🌿", title: "100% природний продукт", desc: "Жодного цукру, штучного нагрівання або доданих барвників." },
  { icon: "💛", title: "Дбайливе фасування", desc: "Кожна банка наповнюється та перевіряється вручну з любов'ю." },
  { icon: "📦", title: "Надійне пакування", desc: "Безпечна доставка скляної тари у спеціальному захисному матеріалі." },
];

export default function About() {
  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#F7F1E5] via-[#FAF5EB] to-[#FFFDF8] py-12 md:py-20 border-b border-ink/5">
        <div className="container-p">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="md:col-span-7">
              <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5">
                <Link to="/" className="hover:text-honey">Головна</Link>
                <span>/</span>
                <span className="text-ink/80 font-medium">Про нас</span>
              </nav>

              <span className="text-xs font-bold uppercase tracking-wider text-honey bg-white/90 px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs">
                Наша історія
              </span>

              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-ink mt-4 leading-tight">
                Мед, який починається з бджіл
              </h1>

              <p className="mt-4 text-ink/75 text-sm sm:text-base leading-relaxed">
                Ми — сімейна пасіка, яка щодня піклується про бджіл та створює живий, справжній мед. Для нас бджільництво — це не просто ремесло, а спосіб життя в гармонії з природою.
              </p>

              <p className="mt-3 text-ink/75 text-sm sm:text-base leading-relaxed">
                Ми принципово не використовуємо антибіотики, цукрове підгодовування для отримання меду чи промислову термообробку, зберігаючи природні ферменти та неповторний аромат трав.
              </p>

              <div className="mt-6 flex gap-4">
                <Link to="/catalog" className="btn-primary text-sm px-6 py-3">
                  Переглянути продукцію
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white aspect-[4/3]">
                <img
                  src="/images/about-1.jpg"
                  alt="Пасіка у квітучому полі"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="container-p py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Наші принципи та цінності
          </h2>
          <p className="text-xs sm:text-sm text-ink/60 mt-1">Чому нам довіряють сім'ї по всій країні</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-5 bg-[#FAF6EE] border border-gold/20 flex flex-col items-center text-center">
              <span className="text-3xl mb-3">{v.icon}</span>
              <h3 className="font-serif font-bold text-base text-ink mb-1">{v.title}</h3>
              <p className="text-xs text-ink/65 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery / Production Process */}
      <section className="container-p pb-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Життя пасіки у світлинах
          </h2>
          <p className="text-xs sm:text-sm text-ink/60 mt-1">Моменти літнього збору меду та щоденної праці</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-square bg-[#FAF6EE]">
            <img src="/images/about-2.jpg" alt="Стільники з медом" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-square bg-[#FAF6EE]">
            <img src="/images/about-3.jpg" alt="Свіжий мед у скляних банках" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm border border-ink/5 aspect-square bg-[#FAF6EE]">
            <img src="/images/about-apiary.jpg" alt="Краєвид пасіки" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      {/* TikTok Card Banner */}
      <section className="container-p pb-12">
        <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-[#FAF6EE] via-[#FDFBF7] to-[#F3ECD9] border border-gold/40 text-ink rounded-3xl shadow-sm">
          <span className="text-2xl mb-2 inline-block">🐝</span>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-honey bg-white px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs mb-3">
            <span>Офіційний TikTok: @honey.dsv</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-ink">
            Більше життя нашої пасіки — у TikTok
          </h2>
          <p className="mt-2 text-ink/75 text-sm max-w-lg mx-auto leading-relaxed">
            Підписуйтесь на наш офіційний канал <b>@honey.dsv</b>: показуємо щоденне життя пасіки, процес збору меду та залаштунки виробництва.
          </p>
          <a
            href="https://www.tiktok.com/@honey.dsv"
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6 inline-flex text-sm sm:text-base px-7 py-3.5 font-bold shadow-md hover:shadow-lg"
          >
            Дивитися нашу пасіку в TikTok →
          </a>
        </div>
      </section>
    </div>
  );
}
