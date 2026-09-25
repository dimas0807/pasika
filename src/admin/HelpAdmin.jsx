import { useState } from "react";
import { Link } from "react-router-dom";

const HELP_SECTIONS = [
  {
    id: "add-product",
    icon: "🍯",
    title: "1. Як створити новий товар",
    category: "Товари",
    link: "/admin/products/new",
    linkText: "Створити товар",
    content: `
- Перейдіть у розділ **«Товари»** та натисніть кнопку **«+ Додати товар»**.
- Заповніть обов'язкові поля: **Назва товару**, **Ціна (грн)**, **Вага / об'єм** (наприклад, 400 г або 1 л), оберіть **Категорію**.
- Обов'язково додайте **реальне фото товару** (перетягніть файл або виберіть з комп'ютера). Без завантаженого фото створення нового товару блокується для забезпечення високої якості вітрини.
- Поле **Ідентифікатор (slug)** генерується автоматично з української назви. За потреби ви можете відредагувати його у блоці «▸ Додаткові налаштування».
- Натисніть **«Створити товар»**. Товар одразу стане доступним у каталозі магазину.
    `,
  },
  {
    id: "product-photo",
    icon: "📸",
    title: "2. Як правильно завантажувати фото товарів",
    category: "Товари",
    link: "/admin/products",
    linkText: "До товарів",
    content: `
- Підтримувані формати: **JPG**, **PNG**, **WEBP**.
- Максимальний розмір одного файлу: **до 10 МБ**.
- **Заміна фото:** просто натисніть кнопку «Змінити фото» або перетягніть нове зображення прямо на область попереднього перегляду.
- **Видалення фото:** кнопка «Видалити фото» очищує вибране зображення. Зверніть увагу: для збереження нового товару наявність фото є обов'язковою.
- Рекомендується використовувати фото з гарним природним освітленням на теплому дерев'яному або натуральному фоні.
    `,
  },
  {
    id: "translit-slug",
    icon: "🔗",
    title: "3. Як працює авто-генерація адреси (slug)",
    category: "Товари",
    link: "/admin/products",
    linkText: "До товарів",
    content: `
- Кожен товар має свою унікальну адресу посилання, наприклад: \`/product/med-kvitkoviy-400g\`.
- Система автоматично транслітерує українську назву товару латиницею за офіційними правилами української транслітерації.
- Якщо товар з таким slug уже існує, система автоматично додасть порядковий номер (\`-2\`, \`-3\`), що гарантує відсутність конфліктів.
- Поле slug винесено в блок «▸ Додаткові налаштування». Його можна не чіпати — система все робить автоматично.
- **Порада:** після публікації товару не рекомендується часто змінювати його slug, оскільки на нього можуть посилатися клієнти та пошукові системи.
    `,
  },
  {
    id: "duplicate-product",
    icon: "📋",
    title: "4. Як дублювати існуючий товар",
    category: "Товари",
    link: "/admin/products",
    linkText: "До товарів",
    content: `
- У списку товарів біля потрібної позиції натисніть кнопку **«Дублювати»**.
- Система створить новий товар з позначкою **«(копія)»** у назві, унікальним новим slug (наприклад, \`med-akatsiya-kopiya\`), тим самим фото та ціною.
- Ви зможете відразу відкрити дублікат, змінити вагу чи ціну (наприклад, якщо у вас є фасування 250 г, 500 г та 1000 г одного сорту меду) та опублікувати.
    `,
  },
  {
    id: "delete-product",
    icon: "🛡️",
    title: "5. Як безпечно видалити товар",
    category: "Товари",
    link: "/admin/products",
    linkText: "До товарів",
    content: `
- При натисканні кнопки **«Видалити»** відкривається вікно підтвердження з фотографією, назвою та ціною товару.
- **Повна безпека історії замовлень:** видалення товару з каталогу ніколи не порушує та не видаляє дані в уже оформлених замовленнях. Всі назви, ціни та кількість у старих замовленнях надійно зафіксовані в базі даних.
- Видалений товар просто припиняє відображатися на вітрині магазину та в пошуку.
    `,
  },
  {
    id: "stock-management",
    icon: "📦",
    title: "6. Керування залишком та наявністю",
    category: "Товари",
    link: "/admin/products",
    linkText: "Керувати залишками",
    content: `
- **Швидке перемикання:** у таблиці товарів натисніть на бейдж наявності («В наявності» / «Немає в наявності»), щоб миттєво змінити статус без переходу у форму редагування.
- **Точний облік:** відкрийте форму товару та вкажіть точну кількість одиниць на складі.
- Якщо залишок **0 шт**, товар позначається як «Немає в наявності» і клієнт не зможе додати його до кошика.
- Якщо залишок **від 1 до 5 шт**, система відображає підказку «Закінчується», нагадуючи поповнити запаси або зібрати нову партію меду.
    `,
  },
  {
    id: "categories-management",
    icon: "🏷️",
    title: "7. Керування категоріями та захист від видалення",
    category: "Категорії",
    link: "/admin/categories",
    linkText: "До категорій",
    content: `
- Розділ **«Категорії»** дозволяє створювати нові розділи каталогу, призначати їм іконки (емодзі), опис та порядок відображення.
- **Захист від випадкової втрати даних:** якщо в категорії є хоча б один товар, кнопка видалення заблокована.
- Система видасть попередження: *«У цій категорії є X товарів. Спочатку перенесіть товари в іншу категорію»*.
- Тільки повністю порожню категорію можна видалити.
    `,
  },
  {
    id: "order-lifecycle",
    icon: "🔄",
    title: "8. Життєвий цикл та обробка замовлення",
    category: "Замовлення",
    link: "/admin/orders",
    linkText: "До замовлень",
    content: `
Замовлення проходить наступні етапи:
1. **Нове (NEW):** клієнт щойно оформив замовлення на сайті, вам надійшло сповіщення в Telegram.
2. **В обробці (PROCESSING):** ви зв'язалися з клієнтом, підтвердили наявність або перевірили оплату.
3. **Запаковано (PACKED):** посилка ретельно упакована та підготовлена до передачі перевізнику.
4. **Відправлено (SHIPPED):** відправлено поштою, клієнту надіслано номер накладної (ТТН).
5. **Виконано (COMPLETED):** посилка успішно отримана клієнтом, кошти надійшли.
6. **Скасовано (CANCELLED):** клієнт відмовився або не забрав посилку.

Статус можна зручно змінити прямо в таблиці замовлень або всередині картки замовлення.
    `,
  },
  {
    id: "cod-payments",
    icon: "💵",
    title: "9. Оплата при отриманні (післяплата)",
    category: "Оплата",
    link: "/admin/orders",
    linkText: "Фільтр замовлень",
    content: `
- Клієнт обирає спосіб «Оплата при отриманні» під час чекауту.
- У списку замовлень такі заявки мають синій бейдж **«Очікує оплати»**.
- Клієнт не зобов'язаний завантажувати чек або вносити кошти до відправлення — розрахунок відбувається у відділенні Нової пошти або Укрпошти при отриманні.
    `,
  },
  {
    id: "card-payments",
    icon: "💳",
    title: "10. Оплата на картку / рахунок та перевірка чека",
    category: "Оплата",
    link: "/admin/orders",
    linkText: "Перевірка чеків",
    content: `
- Клієнт обирає «Оплатити зараз» і бачить реквізити вашого рахунку чи картки.
- Після здійснення переказу клієнт завантажує фото/скріншот квитанції безпосередньо у форму замовлення.
- У таблиці замовлень з'являється статус **«Чек на перевірці»** та посилання **«📎 Чек»**.
- Натисніть на посилання, щоб відкрити квитанцію та звірити суму і час у вашому банкінгу.
- Після підтвердження переведіть статус замовлення у «В обробці» або «Запаковано».
    `,
  },
  {
    id: "telegram-bot",
    icon: "💬",
    title: "11. Налаштування та тестування Telegram-сповіщень",
    category: "Налаштування",
    link: "/admin/settings",
    linkText: "Налаштувати Telegram",
    content: `
1. Відкрийте Telegram і напишіть боту **@BotFather**.
2. Відправте команду \`/newbot\`, вкажіть назву та отримайте **API Bot Token**.
3. Додайте створеного бота у вашу робочу групу або почніть з ним діалог, натиснувши кнопку **Start**.
4. Дізнайтесь ваш **Chat ID** (через бота *@userinfobot* або переславши повідомлення в *@getmyid_bot*). Для груп chat_id починається з мінуса (наприклад: \`-100123456789\`).
5. Вставте токен і Chat ID у вкладці **«Telegram»** розділу «Налаштування» та натисніть «Зберегти».
6. Натисніть кнопку **«🧪 Перевірити підключення»**. Бот надішле тестове повідомлення у ваш чат, підтвердивши правильність налаштувань.
    `,
  },
  {
    id: "payment-requisites",
    icon: "🏦",
    title: "12. Налаштування банківських реквізитів",
    category: "Налаштування",
    link: "/admin/settings",
    linkText: "Змінити реквізити",
    content: `
- Перейдіть у розділ **«Налаштування»** → вкладка **«Оплата»**.
- Вкажіть ПІБ отримувача або назву ФОП, номер картки або повний номер рахунку IBAN (починається з UA...).
- Вкажіть назву банку та рекомендоване призначення платежу (наприклад, «Оплата замовлення мед»).
- Ці дані автоматично та синхронно відображаються клієнтам у формі чекауту без необхідності редагування коду сайту.
    `,
  },
  {
    id: "delivery-setup",
    icon: "📮",
    title: "13. Доставка Новою поштою та Укрпоштою",
    category: "Доставка",
    link: "/admin/settings",
    linkText: "Налаштування доставки",
    content: `
- У формі оформлення замовлення використовується проста та надійна ручна форма: клієнт вибирає поштового оператора, вводить своє місто/село та номер відділення чи поштомату.
- Це усуває будь-які збої чи відмови сторонніх API перевізників та не вимагає отримання складних API-ключів.
- У картці замовлення ви отримуєте точні дані, готові для швидкого створення накладної у кабінеті Нової пошти або додатку Укрпошти.
    `,
  },
  {
    id: "admin-security",
    icon: "🔒",
    title: "14. Зміна пароля та безпека адмін-панелі",
    category: "Безпека",
    link: "/admin/settings",
    linkText: "Безпека",
    content: `
- Перейдіть у розділ **«Налаштування»** → вкладка **«Безпека»**.
- Для збереження будь-яких змін обов'язково потрібно ввести ваш **поточний пароль**.
- Ви можете змінити логін адміністратора та задати новий надійний пароль (довжиною не менше 6 символів).
- Сесії адміністратора захищені безпечними HTTP-cookies.
- Після завершення роботи на чужому комп'ютері завжди натискайте кнопку **«⏻ Вийти»** у лівому меню.
    `,
  },
];

export default function HelpAdmin() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openSectionId, setOpenSectionId] = useState("add-product");

  const categories = ["all", "Товари", "Категорії", "Замовлення", "Оплата", "Доставка", "Налаштування", "Безпека"];

  const filteredSections = HELP_SECTIONS.filter((s) => {
    if (activeCategory !== "all" && s.category !== activeCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchContent = s.content.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
          Довідка та інструкції адміністратора
        </h1>
        <p className="text-xs text-ink/50 mt-1">
          Практичний посібник з керування інтернет-магазином пасіки, товарами, замовленнями та інтеграціями
        </p>
      </div>

      {/* Search and category filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Пошук по довідці (наприклад: фото, чек, бот, пароль)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-2 rounded-xl transition-all min-h-[44px] flex items-center ${
                activeCategory === c
                  ? "bg-honey text-white font-semibold shadow-2xs"
                  : "bg-cream/60 hover:bg-cream text-ink/70"
              }`}
            >
              {c === "all" ? "Всі розділи (14)" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <div className="card p-8 text-center text-ink/40">
            За вашим запитом нічого не знайдено. Спробуйте інше ключове слово.
          </div>
        ) : (
          filteredSections.map((item) => {
            const isOpen = openSectionId === item.id;
            return (
              <div
                key={item.id}
                className="card overflow-hidden transition-all duration-200 border border-ink/5 shadow-2xs"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setOpenSectionId(isOpen ? null : item.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-cream/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h3 className="font-serif font-bold text-base text-ink">
                        {item.title}
                      </h3>
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-cream text-[10px] font-medium text-ink/60">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm text-ink/40 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-ink/5 bg-cream/10 animate-fade-in">
                    <div className="text-sm text-ink/80 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                      {item.content.trim()}
                    </div>

                    {item.link && (
                      <div className="mt-4 pt-3 border-t border-ink/5 flex justify-end">
                        <Link
                          to={item.link}
                          className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-2xs min-h-[44px]"
                        >
                          <span>→</span> {item.linkText}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer quick help note */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <span className="text-xl">🐝</span>
        <div>
          <h4 className="font-semibold text-ink">Потрібна додаткова підтримка?</h4>
          <p className="mt-0.5 text-ink/70">
            Всі налаштування зберігаються у надійній локальній базі даних SQLite та автоматично синхронізуються з хмарою.
          </p>
        </div>
      </div>
    </div>
  );
}
