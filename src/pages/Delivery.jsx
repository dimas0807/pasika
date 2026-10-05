import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import {
  NovaPoshtaLogo,
  IconTruck,
  IconCreditCard,
  IconCash,
  IconShieldCheck,
} from "../components/Icons";

export default function Delivery() {
  const [s, setS] = useState(() => Settings.get());
  const [activeTab, setActiveTab] = useState("ukraine"); // "ukraine" | "international"

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const intl = s?.delivery?.international || {
    enabled: true,
    countries: "Польща, Німеччина, Чехія, Італія, Іспанія, Молдова та інші країни ЄС",
    deliveryMethod: "Міжнародна пошта та кур'єрські служби (Nova Post Global, Meest Post)",
    cost: "За тарифами перевізника (розраховується менеджером при підтвердженні)",
    terms: "3–7 робочих днів залежно від країни",
    minOrder: 1000,
    infoText:
      "Ми з радістю відправляємо домашні українські смаколики за кордон! Продукція герметично вакуумується та пакується у спеціальні термобокси з акумуляторами холоду, що гарантує збереження свіжості навіть під час далекої дороги.",
  };

  return (
    <div className="bg-[#121110] text-[#F4EFEA] min-h-[80vh] py-10 sm:py-16 md:py-20">
      <div className="container-p max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-[#8C8074] mb-4 flex items-center gap-1.5" aria-label="Хлібні крихти">
          <Link to="/" className="hover:text-bronze transition-colors">Головна</Link>
          <span>/</span>
          <span className="text-[#F4EFEA] font-medium">Доставка та оплата</span>
        </nav>

        {/* Page Title & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#2C2621] pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F4EFEA] tracking-tight">
              Доставка та оплата
            </h1>
            <p className="text-[#A3988E] text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Ми дбаємо про те, щоб кожна домашня ковбаска та шматочок м'яса доїхали до вашого столу свіжими та запашними.
            </p>
          </div>

          <div className="flex p-1.5 rounded-2xl bg-[#1C1815] border border-[#332A22] shrink-0 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab("ukraine")}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "ukraine"
                  ? "bg-gradient-to-r from-bronze to-gold text-[#141210] shadow-md"
                  : "text-[#D1C7BD] hover:text-white"
              }`}
            >
              <span>🇺🇦</span>
              <span>По Україні</span>
            </button>
            <button
              onClick={() => setActiveTab("international")}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "international"
                  ? "bg-gradient-to-r from-bronze to-gold text-[#141210] shadow-md"
                  : "text-[#D1C7BD] hover:text-white"
              }`}
            >
              <span>🌍</span>
              <span>За кордон</span>
            </button>
          </div>
        </div>

        {/* TAB 1: UKRAINE DELIVERY */}
        {activeTab === "ukraine" && (
          <div className="mt-10 space-y-12 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-bronze/20 flex items-center justify-center text-bronze">
                  <IconTruck className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F4EFEA]">
                  Доставка Новою Поштою по Україні
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Nova Poshta Branches */}
                <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <NovaPoshtaLogo className="w-8 h-8" />
                      <span className="text-xs font-bold text-bronze bg-[#26201B] px-3 py-1 rounded-full border border-bronze/30">
                        1–2 дні
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#F4EFEA]">У відділення Нової Пошти</h3>
                    <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                      Швидка доставка у будь-яке відділення Нової Пошти по всій Україні. Можливість оглянути смаколики перед оплатою.
                    </p>
                  </div>
                  <div className="text-xs text-[#8C8074] mt-5 pt-3 border-t border-[#2F2821]">
                    Вартість: за тарифами Нової Пошти (від 80 грн)
                  </div>
                </div>

                {/* Nova Poshta Postomats */}
                <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">📮</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                        24/7 доступ
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#F4EFEA]">У поштомат Нової Пошти</h3>
                    <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                      Забирайте посилку поруч із домом у будь-який зручний час доби без очікування в черзі.
                    </p>
                  </div>
                  <div className="text-xs text-[#8C8074] mt-5 pt-3 border-t border-[#2F2821]">
                    Вартість: за тарифами Нової Пошти (від 70 грн)
                  </div>
                </div>
              </div>
            </div>

            {/* Packaging Guarantee */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#1C1815] border border-bronze/40 shadow-xl">
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0">❄️</span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#F4EFEA]">
                    Спеціальна термоупаковка з холодоелементами
                  </h3>
                  <p className="text-xs sm:text-sm text-[#CFC5BA] mt-2 leading-relaxed">
                    М'ясні продукти потребують суворого дотримання температурного режиму:
                  </p>
                  <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#A3988E] list-disc list-inside">
                    <li>Герметично запаюємо у міцні вакуумні пакети перед відправкою;</li>
                    <li>Вкладаємо в термоізоляційні бокси з акумуляторами холоду;</li>
                    <li>Відправляємо свіжоприготовлене, щоб ви отримали ідеальний смак.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-bronze/20 flex items-center justify-center text-bronze">
                  <IconCreditCard className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F4EFEA]">
                  Способи оплати
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-bronze/15 flex items-center justify-center text-bronze mb-4">
                    <IconCash className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#F4EFEA]">
                    Оплата при отриманні (накладений платіж)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                    Сплачуйте готівкою або карткою у відділенні Нової Пошти після огляду посилки.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-bronze/15 flex items-center justify-center text-bronze mb-4">
                    <IconCreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#F4EFEA]">
                    Оплата на картку / розрахунковий рахунок (IBAN)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                    Зручна безготівкова оплата без комісії за накладений платіж. Реквізити надаються автоматично при оформленні.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERNATIONAL DELIVERY */}
        {activeTab === "international" && (
          <div className="mt-10 space-y-8 animate-fadeIn">
            {/* Header info banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#261E16] to-[#1C1815] border border-bronze/50 shadow-xl">
              <div className="flex items-start gap-4">
                <span className="text-4xl sm:text-5xl shrink-0">🌍</span>
                <div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F4EFEA]">
                    Доставка за кордон
                  </h2>
                  <p className="text-sm text-[#D4C3B3] mt-2 leading-relaxed">
                    {intl.infoText}
                  </p>
                </div>
              </div>
            </div>

            {/* Conditions grid */}
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Countries */}
              <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                <div className="text-2xl mb-3">📍</div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
                  Країни доставки
                </h3>
                <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                  {intl.countries}
                </p>
              </div>

              {/* Delivery method */}
              <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                <div className="text-2xl mb-3">✈️</div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
                  Спосіб та терміни доставки
                </h3>
                <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                  {intl.deliveryMethod}
                </p>
                <div className="mt-3 text-xs font-semibold text-bronze">
                  Термін доставки: {intl.terms}
                </div>
              </div>

              {/* Cost & Minimum order */}
              <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                <div className="text-2xl mb-3">💳</div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
                  Вартість доставки
                </h3>
                <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                  {intl.cost}
                </p>
                {Number(intl.minOrder) > 0 && (
                  <div className="mt-3 text-xs font-semibold text-bronze">
                    Мінімальна сума замовлення: {intl.minOrder} грн
                  </div>
                )}
              </div>

              {/* International Packaging */}
              <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
                <div className="text-2xl mb-3">📦</div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
                  Посилене пакування для дороги
                </h3>
                <p className="text-xs sm:text-sm text-[#A3988E] mt-2 leading-relaxed">
                  Подвійний вакуумний шар, термобокси підвищеної щільності та збільшена кількість холодоагентів забезпечують безпечне перевезення на великі відстані.
                </p>
              </div>
            </div>

            {/* How to order internationally */}
            <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821]">
              <h3 className="font-serif font-bold text-lg text-[#F4EFEA] mb-3">
                Як оформити замовлення з доставкою за кордон:
              </h3>
              <ol className="space-y-2 text-xs sm:text-sm text-[#D1C7BD] list-decimal list-inside leading-relaxed">
                <li>Оберіть улюблені смаколики в нашому каталозі або складіть подарунковий бокс.</li>
                <li>Перейдіть до оформлення замовлення та виберіть пункт <strong>«За кордон»</strong>.</li>
                <li>Вкажіть країну, місто, поштовий індекс, точну адресу та телефон одержувача.</li>
                <li>Наш менеджер зв'яжеться з вами у Viber / Telegram для погодження вартості пересилки та деталей відправлення.</li>
              </ol>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link to="/catalog" className="btn-primary text-base px-8 py-4 font-bold inline-flex">
            Перейти до каталогу страв →
          </Link>
        </div>
      </div>
    </div>
  );
}
