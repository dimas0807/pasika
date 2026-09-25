import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { Categories, Products, subscribe } from "../data/db";

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "all";
  const [sort, setSort] = useState("default");

  const [productsList, setProductsList] = useState(() => Products.all());
  const [categoriesList, setCategoriesList] = useState(() => Categories.all());

  useEffect(() => {
    Products.fetchAll().then((p) => p && setProductsList(p));
    Categories.fetchAll().then((c) => c && setCategoriesList(c));
    return subscribe(() => {
      setProductsList(Products.all());
      setCategoriesList(Categories.all());
    });
  }, []);

  const categories = categoriesList.filter((c) => c.slug !== "gift-boxes");

  const filteredProducts = useMemo(() => {
    let list = productsList.filter((p) => p.category !== "gift-boxes");
    if (activeCategory !== "all") list = list.filter((p) => p.category === activeCategory);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [productsList, activeCategory, sort]);

  const setCategory = (slug) => {
    if (slug === "all") setParams({});
    else setParams({ category: slug });
  };

  return (
    <div className="container-p py-8 md:py-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-ink/5">
        <div>
          <nav className="text-xs text-ink/50 mb-2">
            <Link to="/" className="hover:text-honey">Головна</Link> / Каталог
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
            Натуральна продукція
          </h1>
          <p className="text-ink/65 text-sm sm:text-base mt-1">
            Свіжий мед, пилок, прополіс та перга прямо з пасіки
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label htmlFor="catalog-sort" className="text-xs font-semibold text-ink/60 uppercase">
            Сортування:
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs sm:text-sm font-medium border border-ink/15 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-honey/40 cursor-pointer shadow-2xs"
          >
            <option value="default">За замовчуванням</option>
            <option value="price-asc">Спочатку дешевші</option>
            <option value="price-desc">Спочатку дорожчі</option>
          </select>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeCategory === "all"
              ? "bg-honey text-ink shadow-sm scale-102"
              : "bg-white border border-ink/10 text-ink/75 hover:border-honey/50 hover:bg-cream/40"
          }`}
        >
          Всі товари ({productsList.filter((p) => p.category !== "gift-boxes").length})
        </button>

        {categories.map((c) => {
          const count = productsList.filter((p) => p.category === c.slug).length;
          const isActive = activeCategory === c.slug;

          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-honey text-ink shadow-sm scale-102"
                  : "bg-white border border-ink/10 text-ink/75 hover:border-honey/50 hover:bg-cream/40"
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
              {count > 0 && <span className="opacity-60 text-[11px]">({count})</span>}
            </button>
          );
        })}

        <Link
          to="/gift-boxes"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap bg-cream/70 border border-gold/40 text-ink hover:bg-cream transition-colors"
        >
          <span>🎁</span>
          <span>Подарункові бокси →</span>
        </Link>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-24 text-center">
          <div className="text-4xl mb-3">🍯</div>
          <p className="text-ink/60 font-medium">У цій категорії наразі немає товарів.</p>
          <button
            onClick={() => setCategory("all")}
            className="btn-secondary mt-4 text-xs py-2 px-4"
          >
            Скинути фільтр
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
