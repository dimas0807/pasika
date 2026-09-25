// Cloudflare Pages Functions edge handler for /uploads/* routes
// Intercepts /uploads/receipts/* and /uploads/products/* and routes them to the Edge API

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const catchall = params.catchall || [];
  const subpath = Array.isArray(catchall) ? catchall.join("/") : String(catchall);

  // Map /uploads/receipts/:filename -> /api/receipts/:filename
  // Map /uploads/products/:filename -> /api/uploads/products/:filename
  let targetPath = `/api/uploads/${subpath}`;
  if (subpath.startsWith("receipts/")) {
    targetPath = `/api/receipts/${subpath.replace("receipts/", "")}`;
  }

  const apiUrl = new URL(`${targetPath}${url.search}`, url.origin);
  const forwardRequest = new Request(apiUrl.toString(), request);
  return fetch(forwardRequest);
}
