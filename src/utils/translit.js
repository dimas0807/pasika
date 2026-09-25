// Ukrainian transliteration according to official Ukrainian transliteration standards (KMU 2010)
// and slug generator for clean, URL-safe product and category URLs.

const UKR_TO_LAT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
  "’": "", "'": "", "`": "", "ʼ": "",
};

export function transliterateUa(text = "") {
  return String(text)
    .toLowerCase()
    .split("")
    .map((char) => (UKR_TO_LAT[char] !== undefined ? UKR_TO_LAT[char] : char))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug from title and list of existing slugs.
 * If slug exists, appends -2, -3, etc.
 */
export function generateUniqueSlug(title, existingSlugs = [], currentId = null, currentSlug = null) {
  const baseSlug = transliterateUa(title) || "product";

  if (currentSlug && transliterateUa(title) === currentSlug) {
    return currentSlug;
  }

  let candidate = baseSlug;
  let counter = 2;
  const set = new Set(existingSlugs.filter((s) => s && s !== currentSlug));

  while (set.has(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidate;
}
