import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconShieldCheck,
  IconSparkles,
  IconViber,
  IconTikTok,
  IconPhone,
  IconTruck,
  IconArrowRight,
} from "../components/Icons";

const VALUES = [
  {
    icon: "🥩",
    title: "100% добірне свіже м'ясо",
    desc: "Працюємо лише з перевіреною українською фермерською свининою та птицею. Жодних замінників та соєвого білка.",
  },
  {
    icon: "🪵",
    title: "Натуральне копчення на дровах",
    desc: "Коптимо виключно на сухих вільхових, букових та яблуневих дровах. Категоричне табу на «рідкий дим» та хімічні барвники.",
  },
  {
    icon: "🧂",
    title: "Класичні домашні спеції",
    desc: "Свіжий український часничок, духмяний та чорний перець, сіль, лавровий лист і чебрець. Тільки натуральні приправи.",
  },
  {
    icon: "❄️",
    title: "Термопакування з холодом",
    desc: "Вакуумуємо перед відправкою та пакуємо в термоізоляційні бокси з холодоелементами. Доїжджає ідеально свіжим по всій Україні.",
  },
];

const CRAFT_STEPS = [
  {
    step: "01",
    title: "Ретельний відбір м'яса",
    desc: "Обираємо найсвіжіші шматки окісту, корейки, підчеревини та сала.",
  },
  {
    step: "02",
    title: "Домашній маринад",
    desc: "Засолюємо м'ясо з часником та перцем і даємо йому визріти.",
  },
  {
    step: "03",
    title: "Копчення на дровах",
    desc: "Гаряче копчення в традиційній коптильні до рум'яної скоринки та апетитного аромату.",
  },
  {
    step: "04",
    title: "Вакуумація та доставка",
    desc: "Охолодження, індивідуальний вакуум та швидка відправка Новою Поштою.",
  },
];

export default function About() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const rawPhone = phone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:+${rawPhone.startsWith("38") ? rawPhone : "38" + rawPhone}` : "tel:+380680257877";

  const viberRaw = (s?.contacts?.viber || "0680257877").trim();
  const viberUrl = getSocialUrl("viber", viberRaw) || "viber://chat?number=%2B380680257877";

  const tiktokUrl = getSocialUrl("tiktok", s?.contacts?.tiktok || "@kopchonosti777") || "https://www.tiktok.com/@kopchonosti777";

  return (
    <div className="bg-[#121110] text-[#F4EFEA] overflow-x-hidden">
      {/* 01 — Hero Header */}
      <section className="relative py-16 sm:py-24 border-b border-[#28221D] bg-[#161412]">
        <div className="container-p">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#26201B] border border-bronze/40 text-xs font-bold uppercase tracking-wider text-bronze mb-4">
              <span>🥩 Знайомство з майстринею</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#F4EFEA] tracking-tight leading-tight">
              Про Галинку та домашній <br />
              <span className="text-bronze">«М'ясний рай»</span>
            </h1>
            <p className="mt-4 text-[#CFC5BA] text-sm sm:text-lg leading-relaxed">
              Традиційне копчення на дровах, щира родинна праця та любов до справжньої української їжі без жодної краплі хімії.
            </p>
          </div>
        </div>
      </section>

      {/* 02 — Story and Portrait */}
      <section className="py-16 sm:py-24 border-b border-[#28221D]">
        <div className="container-p">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-[#332A22] shadow-2xl bg-[#1C1815]">
                <img
                  src="/images/about-galinka.jpg"
                  alt="Галинка з домашніми ковбасами та копченостями"
                  className="w-full h-full object-cover aspect-[4/5]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="font-serif font-bold text-xl text-[#F4EFEA]">
                    Галина
                  </div>
                  <div className="text-xs text-bronze font-semibold mt-0.5">
                    Засновниця «М'ясного раю у Галинки»
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-[#CFC5BA] text-sm sm:text-base leading-relaxed">
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#F4EFEA] leading-tight">
                «Готую так, щоб кожен шматочок нагадував свято в рідній домівці»
              </h2>

              <p>
                Мене звати Галина. Моє знайомство з коптильною справою почалося з простого бажання — частувати рідних та гостей справжньою, смачною ковбасою та соковитим салом, як колись у дитинстві.
              </p>

              <p>
                Сьогодні багато виробників економлять час і використовують «рідкий дим», підсилювачі смаку та надлишок вологи. Ми категорично відмовилися від такого підходу. Наш секрет простий: добірне свіже м'ясо від українських господарств, чисті сухі дрова з фруктових дерев та вільхи, домашні спеції та терпіння.
              </p>

              <p>
                Кожну ковбаску начиняємо власноруч, кожен шматок шинки чи генеральського сала витримується в ароматних спеціях і коптиться в коптильні стільки часу, скільки вимагає правильна технологія.
              </p>

              <div className="p-5 rounded-2xl bg-[#1C1815] border border-bronze/30 text-[#F4EFEA] italic text-sm">
                «Для мене найбільша радість — коли ви пишете у Viber чи TikTok: "Галинко, з'їли за один вечір, відправляйте ще!". Це найкраща нагорода за щоденну працю.»
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link to="/catalog" className="btn-primary text-sm font-bold">
                  Переглянути каталог страв →
                </Link>
                <a
                  href={viberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-viber text-sm"
                >
                  <IconViber className="w-4 h-4 text-white" />
                  <span>Написати Галині у Viber</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Core Principles */}
      <section className="py-16 sm:py-24 border-b border-[#28221D] bg-[#161412]">
        <div className="container-p">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA]">
              Наші золоті принципи якості
            </h2>
            <p className="text-[#A3988E] text-sm sm:text-base mt-2">
              Чому наші копченості замовляють знову і знову по всій Україні
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] hover:border-bronze/60 transition-colors shadow-lg flex flex-col"
              >
                <span className="text-4xl mb-4">{v.icon}</span>
                <h3 className="font-serif font-bold text-lg text-[#F4EFEA] mb-2 leading-snug">
                  {v.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A3988E] leading-relaxed mt-auto">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — Crafting Process Steps */}
      <section className="py-16 sm:py-24 border-b border-[#28221D]">
        <div className="container-p">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA]">
              Як народжується смак
            </h2>
            <p className="text-[#A3988E] text-sm sm:text-base mt-2">
              Чесний 4-етапний шлях від свіжого м'яса до посилки на Новій Пошті
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CRAFT_STEPS.map((cs, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col justify-between"
              >
                <div>
                  <span className="font-serif text-3xl font-extrabold text-bronze/60 mb-3 block">
                    {cs.step}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#F4EFEA] mb-2 leading-tight">
                    {cs.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3988E] leading-relaxed">
                    {cs.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — TikTok Bridge */}
      <section className="py-16 sm:py-20 bg-[#161412]">
        <div className="container-p">
          <div className="rounded-3xl bg-gradient-to-r from-[#211B16] via-[#28201A] to-[#1A1613] border border-bronze/40 p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl">
            <IconTikTok className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA]">
              Слідкуйте за Галинкою в TikTok
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#CFC5BA] max-w-xl mx-auto leading-relaxed">
              Дивіться свіжі відео процесів копчення, нарізку готових страв та спілкуйтеся з нами напряму в профілі @kopchonosti777.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-base px-8 py-3.5 font-bold w-full sm:w-auto"
              >
                Перейти в TikTok @kopchonosti777
              </a>
              <Link to="/catalog" className="btn-secondary text-base px-7 py-3.5 font-bold w-full sm:w-auto">
                Каталог на сайті
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
