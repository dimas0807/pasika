import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BeeScene from "../components/BeeScene";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { Categories, Products, subscribe } from "../data/db";

const PERKS = [
  { icon: "🐝", title: "Власна пасіка" },
  { icon: "🌿", title: "100% натурально" },
  { icon: "🚚", title: "Доставка по Україні" },
  { icon: "🎁", title: "Подарункове оформлення" },
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
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-clean">
        <BeeScene dense />
        <div className="container-p relative py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-[1.1]">
              Натуральний мед<br />прямо з нашої пасіки 🍯
            </h1>
            <p className="mt-5 text-ink/70 text-base md:text-lg max-w-md">
              Власна пасіка, натуральні продукти бджільництва та подарункові набори з доставкою по Україні.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalog" className="btn-primary">Переглянути продукцію</Link>
              <Link to="/gift-boxes" className="btn-secondary">Подарункові бокси</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PERKS.map((p) => (
                <div key={p.title} className="flex flex-col items-center text-center gap-1.5">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-xs font-medium text-ink/70">{p.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-accent/30 to-honey/20 p-8 flex items-center justify-center shadow-soft">
              <ProductImage image="honey-jar" category="honey" className="w-3/4 h-3/4" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-p py-14">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-6">Категорії товарів</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={c.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${c.slug}`}
              className="card p-4 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 transition-transform"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-medium text-ink/80">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-p py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink">Популярні товари</h2>
          <Link to="/catalog" className="btn-ghost text-sm">Весь каталог →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* GIFT BANNER */}
      <section className="container-p pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-leaf/90 to-leaf text-cream p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div>
            <h2 className="font-serif text-3xl font-bold">Подарунок, який запам'ятається 💛</h2>
            <p className="mt-3 text-cream/80 max-w-md">
              Натуральні продукти, красиве оформлення та частинка нашої пасіки у кожному боксі. Можливе персональне оформлення.
            </p>
            <Link to="/gift-boxes" className="btn-primary mt-6 inline-flex">Переглянути всі бокси</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Products.byCategory("gift-boxes").slice(0, 3).map((p) => (
              <div key={p.id} className="bg-cream/10 rounded-2xl p-3">
                <ProductImage image={p.image} category={p.category} className="aspect-square" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="container-p pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold text-ink">Мед, який починається з бджіл</h2>
          <p className="mt-4 text-ink/70 leading-relaxed">
            Ми працюємо з бджолами та створюємо натуральну продукцію, яку хочеться дарувати щодня — без зайвих обіцянок, лише те, у чому ми впевнені.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ink/70">
            <li>🍯 Власна пасіка</li>
            <li>🌿 Натуральні продукти</li>
            <li>🐝 Турбота про бджіл</li>
          </ul>
          <Link to="/about" className="btn-secondary mt-6 inline-flex">Дізнатися більше</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ProductImage image="propolis" category="propolis" className="aspect-square" />
          <ProductImage image="perga" category="perga" className="aspect-square mt-6" />
        </div>
      </section>
    </div>
  );
}
