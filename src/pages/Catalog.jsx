import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
    <div className="container-p py-10">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">Натуральна продукція</h1>
      <p className="text-ink/60 mt-2">Мед та продукти бджільництва з власної пасіки.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory("all")}
          className={`badge whitespace-nowrap ${activeCategory === "all" ? "bg-honey text-white" : "bg-cream text-ink/70"}`}
        >
          Всі товари
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`badge whitespace-nowrap ${activeCategory === c.slug ? "bg-honey text-white" : "bg-cream text-ink/70"}`}
          >
            {c.icon} {c.name}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto text-sm border border-ink/15 rounded-full px-3 py-1.5 bg-white"
        >
          <option value="default">За замовчуванням</option>
          <option value="price-asc">Спочатку дешевші</option>
          <option value="price-desc">Спочатку дорожчі</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-ink/50">Товарів не знайдено.</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
