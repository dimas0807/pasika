import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { MemoryRouter } from 'react-router-dom';

async function testRender() {
  console.log("Starting Vite SSR test runner...");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { CartProvider } = await vite.ssrLoadModule('/src/context/CartContext.jsx');
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    const { default: ErrorBoundary } = await vite.ssrLoadModule('/src/components/ErrorBoundary.jsx');

    const adminPages = [
      { name: 'Dashboard', path: '/src/admin/Dashboard.jsx' },
      { name: 'ProductsAdmin', path: '/src/admin/ProductsAdmin.jsx' },
      { name: 'ProductForm', path: '/src/admin/ProductForm.jsx' },
      { name: 'OrdersAdmin', path: '/src/admin/OrdersAdmin.jsx' },
      { name: 'OrderDetail', path: '/src/admin/OrderDetail.jsx' },
      { name: 'CustomersAdmin', path: '/src/admin/CustomersAdmin.jsx' },
      { name: 'CategoriesAdmin', path: '/src/admin/CategoriesAdmin.jsx' },
      { name: 'SettingsAdmin', path: '/src/admin/SettingsAdmin.jsx' },
      { name: 'HelpAdmin', path: '/src/admin/HelpAdmin.jsx' },
    ];

    for (const page of adminPages) {
      console.log(`\nTesting SSR render of Admin Page: ${page.name}`);
      try {
        const { default: Component } = await vite.ssrLoadModule(page.path);
        const element = React.createElement(
          ErrorBoundary,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/admin'] },
            React.createElement(Component, null)
          )
        );
        const html = renderToString(element);
        if (html.includes("Щось пішло не так")) {
          console.error(`❌ FAILED on ${page.name}: Rendered ErrorBoundary error screen!`);
        } else {
          console.log(`✅ OK on ${page.name} (rendered ${html.length} bytes)`);
        }
      } catch (err) {
        console.error(`💥 EXCEPTION during render of ${page.name}:`, err);
      }
    }
  } finally {
    await vite.close();
  }
}

testRender().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
