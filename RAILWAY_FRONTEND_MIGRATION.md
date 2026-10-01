# Міграція Frontend PASIKA на Railway API

Документ фіксує переведення клієнтської частини (React/Vite SPA на Cloudflare Pages) на роботу з backend-сервером Railway (`https://pasika-production.up.railway.app`).

---

## 1. Що було до зміни

1. **Базова адреса API**:
   - У `src/data/db.js` константа `API_BASE` формувалася виключно через `import.meta.env?.VITE_API_URL || ""`.
   - За відсутності змінної `VITE_API_URL` у production-білді всі запити йшли на відносні шляхи `/api/*`.
   - На хостингу Cloudflare Pages (`https://pasika12.pages.dev`) ці запити перехоплювалися локальними Cloudflare Functions (`functions/api/*`), де зберігалася стара або розбіжна логіка.

2. **Розрізнені виклики API**:
   - У `src/pages/Checkout.jsx` пошук міст та відділень Нової Пошти викликався через прямий `fetch('/api/delivery/...')`, оминаючи централізований хелпер `request()`.
   - Завантаження зображень товарів та чеків використовували `credentials: "same-origin"`, що блокувало відправку cookie при cross-origin запитах.
   - Посилання на резервні копії бази даних у `Backups.downloadUrl` вели на відносний шлях `/api/admin/backup`.

3. **Авторизація та крос-доменні обмеження**:
   - Cookie сесії адміна `pasika_session` виставлялися з прапорцем `SameSite=Lax`. При зверненні з домену `pasika12.pages.dev` до API на домені `pasika-production.up.railway.app` сучасні браузери (Safari ITP, Chrome Privacy Sandbox) блокують cross-site `SameSite=Lax` cookie.
   - Endpoint входу `POST /api/auth/login` не повертав токен у тілі JSON, унеможливлюючи fallback через заголовок `Authorization: Bearer <token>`.

---

## 2. Які API використовував frontend

Усі сутності проєкту та їхні точки взаємодії:
- **Каталог товарів та категорій**:
  - `GET /api/products` — список активних товарів із залишками;
  - `GET /api/products/:slug`, `GET /api/products/id/:id` — картка товару;
  - `GET /api/categories` — список категорій;
  - `POST /api/products/validate-stock` — серверна перевірка залишків перед оформленням;
  - `POST /api/admin/products`, `PUT /api/admin/products/:id`, `DELETE /api/admin/products/:id` — керування товарами в адмінці.
- **Публічні налаштування**:
  - `GET /api/settings` — контакти пасіки, соцмережі, графік, реквізити IBAN.
- **Доставка (Нова Пошта та Укрпошта)**:
  - `GET /api/delivery/cities?provider=np&query=...` — живий пошук міст;
  - `GET /api/delivery/branches?provider=np&cityId=...` — список відділень та поштоматів;
  - `GET /api/orders/track/:query` — публічний трекінг статусу посилки/ТТН.
- **Оформлення та замовлення**:
  - `POST /api/orders` — створення замовлення з резервуванням залишків;
  - `GET /api/orders/:id?token=...` — перегляд деталей замовлення клієнтом;
  - `GET /api/admin/orders` — повний реєстр замовлень в адмін-панелі;
  - `PATCH /api/admin/orders/:id/status` — зміна статусу (NEW, PROCESSING, PAID, SHIPPED тощо).
- **Файли та сховище (Uploads/Storage)**:
  - `POST /api/upload-receipt` — завантаження фото/PDF чека про оплату (з прив'язкою до `checkoutToken`);
  - `GET /api/receipts/:filename` або `/uploads/receipts/:filename` — захищений перегляд чека;
  - `POST /api/upload-product-image` — завантаження фотографій продуктів (доступно тільки адміну);
  - `GET /uploads/products/:filename` — публічна роздача фото товарів.
- **Авторизація адміністратора**:
  - `POST /api/auth/login` — вхід за логіном і паролем;
  - `POST /api/auth/logout` — завершення сесії;
  - `GET /api/auth/me` — перевірка валідності активної сесії;
  - `PUT /api/admin/security` — зміна пароля.
- **Telegram та сповіщення**:
  - `GET /api/admin/telegram/config`, `PUT /api/admin/telegram/config` — конфігурація бота;
  - `GET /api/admin/telegram/recipients` — список отримувачів замовлень;
  - `POST /api/admin/telegram/recipients/:id/test` — тест зв'язку;
  - `GET /api/admin/telegram-log` — історія відправлених сповіщень.

---

## 3. Що змінено

1. **Конфігурація середовища**:
   - Створено `.env.production` з параметром `VITE_API_URL=https://pasika-production.up.railway.app`.
   - У `src/data/db.js` налаштовано двошаровий fallback для `API_BASE`:
     ```javascript
     export const API_BASE = (
       import.meta.env?.VITE_API_URL ||
       (import.meta.env?.PROD ? "https://pasika-production.up.railway.app" : "")
     ).replace(/\/$/, "");
     ```
     Це гарантує, що у продакшн-білді запити автоматично направляються на Railway, а в локальній розробці (`npm run dev`) зберігається відносний `/api` через Vite proxy.

2. **Токенний механізм авторизації (Bearer fallback)**:
   - Додано збереження сесійного токена адміністратора (`pasika_admin_token` у `localStorage`/`sessionStorage`).
   - Централізований метод `request()` у `src/data/db.js` тепер автоматично додає заголовок:
     `Authorization: Bearer <token>`
     за наявності збереженого токена разом із `credentials: "include"`.
   - Оновлено `Auth.login`, `Auth.logout` та `Auth.checkSession` для безшовного керування токеном.

3. **Виправлення cross-origin завантаження файлів (Uploads)**:
   - У `Storage.uploadReceipt` та `Storage.uploadProductImage` змінено `credentials: "same-origin"` на `credentials: "include"`.
   - Додано передачу заголовків `Authorization: Bearer <token>` та `x-checkout-token`.
   - Створено функцію `resolveImageUrl(rawUrl)`: якщо URL зображення товару починається з `/uploads/`, вона автоматично додає `API_BASE`, забезпечуючи завантаження фотографій із сервера Railway, а не статичного сховища Cloudflare Pages.
   - Оновлено компонент `src/components/ProductImage.jsx` для коректного відображення завантажених фото товарів.

4. **Уніфікація доставки у Checkout**:
   - У `src/pages/Checkout.jsx` запити до `/api/delivery/branches` та `/api/delivery/cities` переведено на централізований хелпер `request()`.

5. **Захищений перегляд чеків в адмінці**:
   - У `src/admin/OrdersAdmin.jsx` та `src/admin/OrderDetail.jsx` до виклику `fetch(resolveReceiptUrl(...))` додано передачу заголовка `Authorization: Bearer <token>`.

6. **Серверна частина (Railway Backend)**:
   - У `server/auth.js` налаштовано прапорці cookie: у продакшні використовується `sameSite: "none", secure: true`.
   - `loginHandler` повертає `token: session.token` у тілі відповіді для клієнтського Bearer fallback.
   - У `server/index.js` розширено перевірку CORS: додано підтримку піддоменів прев'ю Cloudflare Pages (`https://*.pasika12.pages.dev`).

---

## 4. Які endpoint-и перевірені

| Endpoint | Метод | Результат | Примітка |
|---|---|---|---|
| `/api/health` | GET | **PASS** | `{"ok":true}` |
| `/api/products` | GET | **PASS** | Повертає 10 активних товарів із залишками |
| `/api/categories` | GET | **PASS** | Повертає 7 категорій |
| `/api/settings` | GET | **PASS** | Публічні контакти та банківські реквізити |
| `/api/delivery/cities` | GET | **PASS** | Реальний пошук по API Нової Пошти через backend |
| `/api/delivery/branches` | GET | **PASS** | Отримання списку відділень Нової Пошти |
| `/api/products` (CORS) | OPTIONS | **PASS** | `access-control-allow-origin: https://pasika12.pages.dev`, `credentials: true` |
| `/api/auth/login` | POST | **PASS** | Сесія створюється, повертається `token` |
| `/api/auth/me` | GET | **PASS** | Підтверджено роботу через `Authorization: Bearer <token>` |
| `/api/orders` | POST | **PASS** | Перевірено в E2E-тесті (створення, резервація залишків) |
| `/api/telegram/webhook` | POST | **PASS** | Перевірено в E2E-тесті (обробка inline-кнопок) |

---

## 5. Auth / Cookie ризики та їх вирішення

- **Ризик**: Сучасні браузери (особливо Safari на iOS/macOS через ITP) блокують сторонні cookie при взаємодії між різними доменами (`pasika12.pages.dev` та `railway.app`). Якщо авторизація зав'язана виключно на cookie, адміністратор не зможе увійти в адмінку з Cloudflare Pages.
- **Вирішення**: Реалізовано повноцінний гібридний механізм:
  1. Cookie з прапорцями `SameSite=None; Secure` для браузерів, які підтримують крос-доменні сесії.
  2. Fallback через токен у пам'яті клієнта (`pasika_admin_token`) та заголовок `Authorization: Bearer <token>`. Бекед перевіряє обидва джерела авторизації.

---

## 6. CORS (Cross-Origin Resource Sharing)

- Бекенд Railway дозволяє origin `https://pasika12.pages.dev` та всі піддомени `https://*.pasika12.pages.dev`.
- Перевірено відправку заголовків:
  - `Access-Control-Allow-Origin: https://pasika12.pages.dev`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, x-customer-token, x-checkout-token`
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`

---

## 7. Uploads (Зображення та чеки)

- Усі завантаження направляються на Railway (`/api/upload-receipt`, `/api/upload-product-image`).
- Зображення товарів роздаються статично бекендом Railway через `/uploads/products/*`.
- Чеки захищені: доступ до чека надається або авторизованому адміністратору (через cookie або Bearer токен), або клієнту за його одноразовим `customerToken`/`checkoutToken`.

---

## 8. Orders (Замовлення)

- Створення замовлень відбувається через `POST /api/orders` на Railway.
- Збереження виконується в базу даних SQLite.
- Відновлення залишків при скасуванні/відхиленні працює автоматично.

---

## 9. Telegram

- Вся логіка Telegram залишається **100% server-side**.
- Жодних бот-токенів чи секретних ключів не імпортується і не потрапляє у клієнтський JavaScript-бандл.
- При створенні замовлення бекенд Railway самостійно формує картку та відправляє сповіщення через Telegram Bot API з публічними inline-кнопками, що ведуть на Railway API Webhook.

---

## 10. Що ще не перевірено

1. Робота завантаження фото товару через інтерфейс адмінки безпосередньо з живого домену Cloudflare Pages (потребує оновлення деплою на Cloudflare).
2. Завантаження чека клієнтом у реальному браузері на мобільному пристрої Safari з Cloudflare Pages (потребує фінальної перевірки після деплою).
3. Поведінка кастомного домену, якщо він буде підключений до Cloudflare Pages (потрібно буде додати кастомний домен до `FRONTEND_URL` у змінних Railway).
