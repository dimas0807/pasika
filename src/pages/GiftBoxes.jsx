import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Products, Categories, subscribe } from "../data/db";
import { useCart } from "../context/CartContext";
import ProductImage from "../components/ProductImage";
import { IconCart, IconCheckCircle } from "../components/Icons";

export default function GiftBoxes() {
  const { add } = useCart();
  const [activeTab, setActiveTab] = useState("ready"); // "ready" | "custom"
  const [productsList, setProductsList] = useState(() => Products.all());
  const [categoriesList, setCategoriesList] = useState(() => Categories.all());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom box state: array of { id, name, price, weight, image, qty }
  const [boxItems, setBoxItems] = useState([]);
  const [boxAddedSuccess, setBoxAddedSuccess] = useState(false);
  const [readyAddedId, setReadyAddedId] = useState(null);

  useEffect(() => {
    Products.fetchAll().then((p) => p && setProductsList(p));
    Categories.fetchAll().then((c) => c && setCategoriesList(c));
    return subscribe(() => {
      setProductsList(Products.all());
      setCategoriesList(Categories.all());
    });
  }, []);

  // Filter ready-made boxes (category 'podarunkovi-boksy', excluding 'custom_box')
  const readyBoxes = useMemo(() => {
    return productsList.filter(
      (p) => p.category === "podarunkovi-boksy" && p.id !== "custom_box" && !p.slug?.startsWith("custom-")
    );
  }, [productsList]);

  // Catalog items available for custom box (excluding boxes themselves)
  const availableItems = useMemo(() => {
    let items = productsList.filter(
      (p) => p.category !== "podarunkovi-boksy" && p.id !== "custom_box"
    );
    if (selectedCategory !== "all") {
      items = items.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return items;
  }, [productsList, selectedCategory, searchQuery]);

  // Categories list for builder filter
  const builderCategories = useMemo(() => {
    return categoriesList.filter((c) => c.slug !== "podarunkovi-boksy");
  }, [categoriesList]);

  // Calculations for custom box
  const boxTotal = useMemo(() => {
    return boxItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [boxItems]);

  const boxCount = useMemo(() => {
    return boxItems.reduce((acc, item) => acc + item.qty, 0);
  }, [boxItems]);

  // Custom box builder actions
  const addToCustomBox = (prod) => {
    setBoxItems((prev) => {
      const idx = prev.findIndex((i) => i.id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          weight: prod.weight,
          image: prod.image,
          category: prod.category,
          qty: 1,
        },
      ];
    });
  };

  const updateBoxItemQty = (id, delta) => {
    setBoxItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeBoxItem = (id) => {
    setBoxItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBox = () => {
    setBoxItems([]);
  };

  // Add custom box to main cart
  const handleAddCustomBoxToCart = () => {
    if (boxItems.length === 0) return;

    const summaryText = boxItems.map((i) => `${i.name} × ${i.qty}`).join(", ");
    const customBoxProduct = {
      id: `custom_box_${Date.now()}`,
      name: `Власний подарунковий бокс (${boxCount} од.)`,
      price: boxTotal,
      weight: `${boxCount} смаколиків`,
      image: "/images/prod-gift-box.jpg",
      category: "podarunkovi-boksy",
      slug: "custom-meat-box",
      isCustomBox: true,
      boxItems: boxItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      description: summaryText,
      stock: 999,
      availableStock: 999,
    };

    add(customBoxProduct, 1);
    setBoxAddedSuccess(true);
    setBoxItems([]);
    setTimeout(() => setBoxAddedSuccess(false), 4000);
  };

  // Add ready box to cart
  const handleAddReadyBox = (box) => {
    add(box, 1);
    setReadyAddedId(box.id);
    setTimeout(() => setReadyAddedId(null), 1500);
  };

  return (
    <div className="container-p py-8 md:py-12">
      {/* Page Header */}
      <div className="border-b border-[#2C2621] pb-6">
        <nav className="text-xs text-[#8C8074] mb-2">
          <Link to="/" className="hover:text-bronze">Головна</Link> / <Link to="/catalog" className="hover:text-bronze">Каталог</Link> / Подарункові бокси
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F4EFEA] flex items-center gap-3">
              <span>🎁</span> Подарункові м'ясні бокси
            </h1>
            <p className="text-[#A3988E] text-sm sm:text-base mt-2 max-w-2xl">
              Справжні домашні ковбаси, копченості та делікатеси від Галинки у святковому крафтовому оформленні.
              Оберіть готовий набір або складіть свій індивідуальний подарунок.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-[#1C1815] border border-[#332A22] shrink-0 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab("ready")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "ready"
                  ? "bg-gradient-to-r from-bronze to-gold text-[#141210] shadow-md"
                  : "text-[#D1C7BD] hover:text-white"
              }`}
            >
              Готові набори ({readyBoxes.length})
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "custom"
                  ? "bg-gradient-to-r from-bronze to-gold text-[#141210] shadow-md"
                  : "text-[#D1C7BD] hover:text-white"
              }`}
            >
              <span>✨</span>
              <span>Зібрати свій бокс</span>
              {boxCount > 0 && (
                <span className="ml-1 bg-meat text-white px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                  {boxCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {boxAddedSuccess && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3 text-emerald-300">
            <IconCheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Чудово! Ваш індивідуальний бокс успішно додано до кошика!
            </span>
          </div>
          <Link
            to="/cart"
            className="btn-primary text-xs py-2 px-4 whitespace-nowrap font-bold"
          >
            Перейти в кошик →
          </Link>
        </div>
      )}

      {/* TAB 1: READY-MADE BOXES */}
      {activeTab === "ready" && (
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyBoxes.map((box) => {
              const isAdded = readyAddedId === box.id;
              const itemsList = Array.isArray(box.boxItems) ? box.boxItems : [];

              return (
                <div
                  key={box.id}
                  className="rounded-2xl overflow-hidden flex flex-col bg-[#1C1A18] border border-[#2D2824] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-bronze/50 transition-all duration-300"
                >
                  {/* Box Image */}
                  <div className="relative aspect-4/3 bg-[#141211] overflow-hidden">
                    <ProductImage
                      image={box.image || "/images/prod-gift-box.jpg"}
                      category="podarunkovi-boksy"
                      alt={box.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-[#E8DFD5] px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                      🎁 {box.weight || "Подарунковий набір"}
                    </div>
                  </div>

                  {/* Box Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif font-bold text-xl text-[#F4EFEA]">
                      {box.name}
                    </h3>
                    <p className="text-xs text-[#A89B8F] mt-2 leading-relaxed">
                      {box.description}
                    </p>

                    {/* Included Items Details */}
                    {itemsList.length > 0 && (
                      <div className="mt-4 p-3.5 rounded-xl bg-[#141210] border border-[#2A241E]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-bronze block mb-2">
                          Склад набору:
                        </span>
                        <ul className="space-y-1.5 text-xs text-[#D1C7BD]">
                          {itemsList.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <span>• {item.name}</span>
                              <span className="text-[#8C8074] font-medium">{item.qty} шт</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="mt-auto pt-5 flex items-center justify-between gap-4 border-t border-[#2A241E]">
                      <div>
                        <div className="text-[11px] text-[#8C8074]">Вартість набору:</div>
                        <div className="font-serif font-bold text-2xl text-[#F4EFEA]">
                          {box.price} <span className="text-sm font-sans font-normal text-bronze">грн</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddReadyBox(box)}
                        className={`py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "btn-primary"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <IconCheckCircle className="w-4 h-4" />
                            <span>Додано!</span>
                          </>
                        ) : (
                          <>
                            <IconCart className="w-4 h-4" />
                            <span>В кошик</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Builder prompt CTA */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#241A14] to-[#1C1815] border border-bronze/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl">🎀</span>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F4EFEA]">
                  Бажаєте скласти свій власний бокс?
                </h3>
                <p className="text-xs sm:text-sm text-[#BDB0A4] mt-1">
                  Виберіть будь-які ковбаси, копченості, сало та паштети з нашого асортименту. Ми запакуємо їх у фірмову святкову коробку!
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("custom")}
              className="btn-primary text-xs sm:text-sm py-3 px-6 whitespace-nowrap font-bold"
            >
              Відкрити конструктор боксу →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM BOX BUILDER */}
      {activeTab === "custom" && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Area: Catalog Picker */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Filter and Search */}
            <div className="p-4 rounded-2xl bg-[#1C1815] border border-[#2D2824] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Шукати страву для боксу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141210] border border-[#332A22] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F4EFEA] focus:outline-none focus:ring-1 focus:ring-bronze"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8074] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#141210] border border-[#332A22] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F4EFEA] focus:outline-none focus:ring-1 focus:ring-bronze cursor-pointer"
              >
                <option value="all">Усі категорії</option>
                {builderCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Grid for Custom Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {availableItems.map((prod) => {
                const inBox = boxItems.find((i) => i.id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-[#1C1815] border border-[#2D2824] hover:border-bronze/40 transition-all flex flex-col justify-between"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#141211] border border-[#332A22]">
                        <ProductImage
                          image={prod.image}
                          category={prod.category}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-serif font-bold text-sm text-[#F4EFEA] line-clamp-1">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-[#8C8074] mt-0.5">
                          {prod.weight || "1 кг"}
                        </div>
                        <div className="font-bold text-sm text-bronze mt-1">
                          {prod.price} грн
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#26211C] flex items-center justify-between">
                      {inBox ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <span>✓</span> У боксі: {inBox.qty} шт
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateBoxItemQty(prod.id, -1)}
                              className="w-7 h-7 rounded-lg bg-[#2A241E] text-xs font-bold text-white hover:bg-[#383028] transition-colors"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold px-2">{inBox.qty}</span>
                            <button
                              onClick={() => updateBoxItemQty(prod.id, 1)}
                              className="w-7 h-7 rounded-lg bg-[#2A241E] text-xs font-bold text-white hover:bg-[#383028] transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCustomBox(prod)}
                          className="w-full py-1.5 px-3 rounded-xl bg-[#26201B] hover:bg-bronze hover:text-[#141210] text-[#D1C7BD] text-xs font-bold transition-all flex items-center justify-center gap-1 border border-[#3A332B]"
                        >
                          <span>+ Додати в бокс</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Sticky Box Tray & Summary */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1815] border-2 border-bronze/50 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#2C2621] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F4EFEA] flex items-center gap-2">
                    <span>🎁</span> Ваш власний бокс
                  </h3>
                  <div className="text-xs text-[#8C8074] mt-0.5">
                    {boxCount > 0 ? `${boxCount} товарів у наборі` : "Бокс поки порожній"}
                  </div>
                </div>
                {boxItems.length > 0 && (
                  <button
                    onClick={clearBox}
                    className="text-xs text-[#8C8074] hover:text-red-400 transition-colors py-1 px-2 rounded-lg"
                  >
                    Очистити
                  </button>
                )}
              </div>

              {/* Items in the box list */}
              {boxItems.length === 0 ? (
                <div className="py-12 text-center text-[#8C8074] space-y-2">
                  <div className="text-4xl">🧺</div>
                  <p className="text-xs sm:text-sm font-medium">
                    Виберіть страви з каталогу ліворуч, щоб зібрати свій персональний подарунковий набір.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {boxItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#141210] border border-[#2D2824] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-serif font-bold text-xs sm:text-sm text-[#F4EFEA] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#8C8074]">
                          {item.price} грн × {item.qty} = <span className="text-bronze font-bold">{item.price * item.qty} грн</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateBoxItemQty(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-[#25201C] text-xs font-bold text-[#A3988E] hover:text-white"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold min-w-4 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateBoxItemQty(item.id, 1)}
                          className="w-6 h-6 rounded-md bg-[#25201C] text-xs font-bold text-[#A3988E] hover:text-white"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeBoxItem(item.id)}
                          className="text-[#7A7065] hover:text-red-400 p-1 ml-1"
                          title="Видалити з боксу"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gift packaging badge */}
              <div className="p-3 rounded-xl bg-[#241C15] border border-bronze/30 text-xs text-[#D1C7BD] flex items-center gap-2.5">
                <span className="text-lg">🎀</span>
                <span>
                  <strong>Фірмове пакування:</strong> крафтова коробка, дерев'яна стружка та святкова стрічка — <strong>безкоштовно!</strong>
                </span>
              </div>

              {/* Total & Checkout button */}
              <div className="pt-3 border-t border-[#2C2621] space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase font-bold text-[#8C8074]">Загальна сума боксу:</span>
                  <span className="font-serif font-bold text-2xl text-[#F4EFEA]">
                    {boxTotal} <span className="text-sm font-sans font-normal text-bronze">грн</span>
                  </span>
                </div>

                <button
                  onClick={handleAddCustomBoxToCart}
                  disabled={boxItems.length === 0}
                  className="w-full btn-primary py-3.5 px-4 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  <IconCart className="w-4 h-4" />
                  <span>Додати бокс у кошик</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
