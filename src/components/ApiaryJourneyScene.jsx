import { useState } from "react";
import RealisticBee from "./RealisticBee";

const JOURNEY_STEPS = [
  {
    step: "01",
    icon: "🌸",
    title: "Квітучі луки",
    subtitle: "Акація, липа, різнотрав'я",
    desc: "Бджоли збирають чистий нектар на диких луках Прикарпаття без пестицидів.",
  },
  {
    step: "02",
    icon: "🐝",
    title: "Збір пилку",
    subtitle: "Праця бджолосім'ї",
    desc: "Щодня бджоли здійснюють тисячі вильотів, наповнюючи золотисті пилкові кошики.",
  },
  {
    step: "03",
    icon: "🏡",
    title: "Родинна пасіка",
    subtitle: "Понад 100 вуликів",
    desc: "Турбота та щоденний догляд у селі Новоселиця від ранньої весни до осені.",
  },
  {
    step: "04",
    icon: "🟨",
    title: "Воскові соти",
    subtitle: "Природне дозрівання",
    desc: "Мед природно дозріває у стільниках без термообробки чи доданого цукру.",
  },
  {
    step: "05",
    icon: "📦",
    title: "Дбайливе фасування",
    subtitle: "До вашого столу",
    desc: "Ручний розлив у скляні банки та надійне пакування для безпечної доставки.",
  },
];

export default function ApiaryJourneyScene() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FAF5EB] to-[#FFFDF8] py-16 md:py-24 border-y border-ink/5">
      {/* Background Subtle Meadow Light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/35 via-transparent to-transparent pointer-events-none" />

      <div className="container-p relative z-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-honey/25 text-xs font-bold uppercase tracking-widest text-honey shadow-2xs mb-3">
            <RealisticBee size={18} depth="near" />
            <span>Шлях справжнього меду</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink leading-tight">
            Від квітки до вашого столу 🌸 → 🍯
          </h2>
          <p className="mt-4 text-ink/75 text-sm sm:text-base leading-relaxed">
            Повний природний цикл: як невтомна праця карпатських бджіл та родинне піклування пасічників перетворюються на живий мед.
          </p>
        </div>

        {/* The Living Flower & Pollinating Bee Story Composition */}
        <div className="rounded-3xl bg-white border border-gold/30 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Animated Pollination Visual Scene */}
          <div className="grid lg:grid-cols-12 gap-8 items-center pb-10 border-b border-ink/10">
            {/* Left Meadow Flora Scene */}
            <div className="lg:col-span-5 relative flex items-center justify-center p-6 bg-gradient-to-br from-[#FAF6EE] to-[#F5EBD4] rounded-2xl border border-gold/20 overflow-hidden min-h-[220px]">
              {/* Meadow Flowers Silhouette */}
              <div className="absolute bottom-0 left-4 text-5xl opacity-90 select-none">
                🌼🌸🌿
              </div>
              <div className="absolute bottom-2 right-6 text-4xl opacity-80 select-none">
                🌻🌼
              </div>

              {/* Shimmering Golden Pollen Dust Cloud */}
              <div className="pollen-particle absolute top-[30%] left-[45%] w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#F4B928]" />
              <div className="pollen-particle absolute top-[50%] left-[35%] w-1.5 h-1.5 rounded-full bg-honey shadow-[0_0_8px_#D99A19]" style={{ animationDelay: "-2s" }} />
              <div className="pollen-particle absolute top-[40%] left-[55%] w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#FBC02D]" style={{ animationDelay: "-4s" }} />

              {/* Animated Pollinating Bee hovering over the blooming flowers */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="bee-organic-hover transform -rotate-6">
                  <RealisticBee size={68} depth="near" pollen={true} angle={12} />
                </div>
                <div className="mt-3 px-3 py-1 rounded-full bg-white/95 border border-gold/30 text-[11px] font-bold text-ink shadow-2xs">
                  ✨ Збір натурального пилку
                </div>
              </div>
            </div>

            {/* Right Storyline Description */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-honey">
                Крок {activeStep} з 5
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1.5">
                {JOURNEY_STEPS[activeStep - 1].title} — {JOURNEY_STEPS[activeStep - 1].subtitle}
              </h3>
              <p className="mt-3 text-ink/75 text-sm sm:text-base leading-relaxed">
                {JOURNEY_STEPS[activeStep - 1].desc}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs font-semibold text-ink/60 uppercase">Оберіть етап:</span>
                <div className="flex gap-2">
                  {JOURNEY_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      onClick={() => setActiveStep(idx + 1)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        activeStep === idx + 1
                          ? "bg-honey text-ink shadow-sm scale-110"
                          : "bg-cream text-ink/60 hover:bg-gold/20"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5 Milestone Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mt-8">
            {JOURNEY_STEPS.map((s, idx) => {
              const isActive = activeStep === idx + 1;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(idx + 1)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? "bg-[#FAF6EE] border-honey shadow-sm scale-102"
                      : "bg-[#FFFDF8] border-ink/5 hover:border-gold/30 hover:bg-[#FAF6EE]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-[10px] font-bold text-honey uppercase tracking-wider">
                      {s.step}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-ink">{s.title}</h4>
                  <p className="text-[11px] text-ink/60 mt-1 line-clamp-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
