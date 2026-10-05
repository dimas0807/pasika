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

  const filteredProducts = useMemo(() => {
    let list = [...productsList];
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#2C2621]">
        <div>
          <nav className="text-xs text-[#8C8074] mb-2">
            <Link to="/" className="hover:text-bronze">Головна</Link> / Каталог
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F4EFEA]">
            Каталог домашніх страв
          </h1>
          <p className="text-[#A3988E] text-sm sm:text-base mt-1">
            Свіжі ковбаси, соковита шинка, генеральське сало та делікатеси на дровах від Галинки
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label htmlFor="catalog-sort" className="text-xs font-semibold text-[#8C8074] uppercase">
            Сортування:
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs sm:text-sm font-medium border border-[#3A332B] rounded-xl px-3 py-2 bg-[#1C1815] text-[#F4EFEA] focus:outline-none focus:ring-2 focus:ring-bronze/50 cursor-pointer shadow-2xs"
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
              ? "bg-gradient-to-r from-bronze to-gold text-[#141210] font-bold shadow-md"
              : "bg-[#1C1815] border border-[#332A22] text-[#D1C7BD] hover:border-bronze hover:text-white"
          }`}
        >
          Всі смаколики ({productsList.length})
        </button>

        {categoriesList.map((c) => {
          const count = productsList.filter((p) => p.category === c.slug).length;
          const isActive = activeCategory === c.slug;

          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-bronze to-gold text-[#141210] font-bold shadow-md"
                  : "bg-[#1C1815] border border-[#332A22] text-[#D1C7BD] hover:border-bronze hover:text-white"
              }`}
            >
              <span>{c.icon || "•"}</span>
              <span>{c.name}</span>
              {count > 0 && <span className="opacity-60 text-[11px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Gift Box Banner */}
      <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2C2118] via-[#241A14] to-[#1C1815] border border-bronze/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <span className="text-3xl sm:text-4xl p-2.5 rounded-xl bg-bronze/10 border border-bronze/20">🎁</span>
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
              Подарункові м'ясні бокси
            </h3>
            <p className="text-xs sm:text-sm text-[#BDB0A4]">
              Оберіть готовий набір або складіть власний бокс із улюблених ковбас, баличків та делікатесів.
            </p>
          </div>
        </div>
        <Link
          to="/gift-boxes"
          className="btn-primary text-xs sm:text-sm py-2.5 px-5 whitespace-nowrap shrink-0 shadow-md font-bold"
        >
          Зібрати свій бокс →
        </Link>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="text-5xl mb-4">🥩</div>
          <p className="text-[#A3988E] font-medium">У цій категорії наразі немає страв.</p>
          <button
            onClick={() => setCategory("all")}
            className="btn-secondary mt-4 text-xs py-2.5 px-5 font-semibold"
          >
            Скинути фільтр
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
