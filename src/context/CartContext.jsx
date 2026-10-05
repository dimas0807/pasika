import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { request } from "../data/db";

const CartContext = createContext(null);
const KEY = "pasika_cart";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [stockNotice, setStockNotice] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Adds product to cart with available stock guard
   * Formula: availableStock = total_stock - reserved_stock
   */
  const add = (product, qty = 1) => {
    let result = { success: true };
    const maxStock =
      product.availableStock !== undefined
        ? product.availableStock
        : product.stock !== undefined
        ? product.stock
        : 999;

    if (maxStock <= 0) {
      const msg = `Товар «${product.name}» наразі відсутній на складі`;
      setStockNotice(msg);
      return { success: false, reason: "out_of_stock", message: msg };
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const currentQty = prev[idx].qty;
        const requestedTotal = currentQty + qty;

        if (requestedTotal > maxStock) {
          const msg = `Доступно лише ${maxStock} шт. товару «${product.name}»`;
          setStockNotice(msg);
          result = { success: false, reason: "exceeded_stock", maxStock, message: msg };
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            qty: maxStock,
            availableStock: maxStock,
          };
          return next;
        }

        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: requestedTotal,
          availableStock: maxStock,
        };
        return next;
      }

      if (qty > maxStock) {
        const msg = `Доступно лише ${maxStock} шт. товару «${product.name}»`;
        setStockNotice(msg);
        result = { success: false, reason: "exceeded_stock", maxStock, message: msg };
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            weight: product.weight,
            price: product.price,
            image: product.image,
            slug: product.slug,
            category: product.category,
            qty: maxStock,
            availableStock: maxStock,
            boxItems: product.boxItems || null,
            isCustomBox: Boolean(product.isCustomBox),
            description: product.description || "",
          },
        ];
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          weight: product.weight,
          price: product.price,
          image: product.image,
          slug: product.slug,
          category: product.category,
          qty,
          availableStock: maxStock,
          boxItems: product.boxItems || null,
          isCustomBox: Boolean(product.isCustomBox),
          description: product.description || "",
        },
      ];
    });

    return result;
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setStockNotice(null);
  };

  const setQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const max = i.availableStock !== undefined ? i.availableStock : 999;
        const target = Math.max(1, qty);
        if (target > max) {
          setStockNotice(`Доступно лише ${max} шт. товару «${i.name}»`);
          return { ...i, qty: max };
        }
        setStockNotice(null);
        return { ...i, qty: target };
      })
    );
  };

  const clear = () => {
    setItems([]);
    setStockNotice(null);
  };

  /**
   * Server-side stock verification
   */
  const validateStockWithServer = useCallback(async () => {
    if (items.length === 0) return { valid: true, items: [] };

    try {
      const data = await request("/api/products/validate-stock", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.isCustomBox ? "custom_box" : i.id, qty: i.qty })),
        }),
      });

      if (!data?.valid && Array.isArray(data?.items)) {
        // Synchronize local cart quantities to available stock
        setItems((prev) => {
          let modified = false;
          const next = prev
            .map((localItem) => {
              const serverInfo = data.items.find((si) => si.id === localItem.id);
              if (!serverInfo) return localItem;

              const avail = serverInfo.availableStock ?? 0;
              if (avail <= 0) {
                modified = true;
                return null; // out of stock
              }

              if (localItem.qty > avail || localItem.availableStock !== avail) {
                modified = true;
                return {
                  ...localItem,
                  qty: Math.min(localItem.qty, avail),
                  availableStock: avail,
                };
              }
              return localItem;
            })
            .filter(Boolean);

          return modified ? next : prev;
        });

        const problem = data.items.find((i) => !i.isAvailable);
        if (problem) {
          setStockNotice(`Товару «${problem.name}» доступно лише ${problem.availableStock} шт.`);
        }
      }

      return data;
    } catch {
      return { valid: true, items: [] };
    }
  }, [items]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        clear,
        count,
        subtotal,
        stockNotice,
        setStockNotice,
        validateStockWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
