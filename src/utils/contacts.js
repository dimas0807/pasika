export function getSocialUrl(network, rawValue) {
  if (!rawValue || typeof rawValue !== "string") return null;
  const val = rawValue.trim();
  if (!val) return null;

  if (val.startsWith("http://") || val.startsWith("https://")) {
    return val;
  }

  switch (network) {
    case "telegram":
      return `https://t.me/${val.replace(/^@/, "")}`;
    case "viber": {
      if (val.startsWith("viber://")) return val;
      const cleanDigits = val.replace(/\D/g, "");
      return cleanDigits ? `viber://chat?number=%2B${cleanDigits}` : null;
    }
    case "instagram":
      return `https://instagram.com/${val.replace(/^@/, "")}`;
    case "facebook":
      return `https://facebook.com/${val.replace(/^@/, "")}`;
    case "tiktok":
      return `https://www.tiktok.com/${val.startsWith("@") ? "" : "@"}${val}`;
    default:
      return val;
  }
}

export function getMapsUrl(lat, lng) {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return null;
  const cleanLat = String(lat).trim();
  const cleanLng = String(lng).trim();
  if (!cleanLat || !cleanLng) return null;
  // Ensure valid numeric coordinates
  const numLat = Number(cleanLat);
  const numLng = Number(cleanLng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanLat},${cleanLng}`)}`;
}
