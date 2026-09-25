import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import GiftBoxes from "./pages/GiftBoxes";
import About from "./pages/About";
import Delivery from "./pages/Delivery";
import Contacts from "./pages/Contacts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import RequireAuth from "./admin/RequireAuth";
import Dashboard from "./admin/Dashboard";
import ProductsAdmin from "./admin/ProductsAdmin";
import ProductForm from "./admin/ProductForm";
import OrdersAdmin from "./admin/OrdersAdmin";
import OrderDetail from "./admin/OrderDetail";
import SettingsAdmin from "./admin/SettingsAdmin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function StoreLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
        <Route path="/catalog" element={<StoreLayout><Catalog /></StoreLayout>} />
        <Route path="/product/:slug" element={<StoreLayout><Product /></StoreLayout>} />
        <Route path="/gift-boxes" element={<StoreLayout><GiftBoxes /></StoreLayout>} />
        <Route path="/about" element={<StoreLayout><About /></StoreLayout>} />
        <Route path="/delivery" element={<StoreLayout><Delivery /></StoreLayout>} />
        <Route path="/contacts" element={<StoreLayout><Contacts /></StoreLayout>} />
        <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
        <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
        <Route path="/order-success/:id" element={<StoreLayout><OrderSuccess /></StoreLayout>} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<RequireAuth><AdminLayout /></RequireAuth>}
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>

        <Route path="*" element={<StoreLayout><NotFound /></StoreLayout>} />
      </Routes>
    </>
  );
}

function NotFound() {
  return (
    <div className="container-p py-24 text-center">
      <h1 className="font-serif text-3xl font-bold text-ink">404</h1>
      <p className="text-ink/60 mt-2">Сторінку не знайдено.</p>
    </div>
  );
}
