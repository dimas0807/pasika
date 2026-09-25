import ProductImage from "../components/ProductImage";

const GALLERY = [
  { image: "honey-jar", category: "honey" },
  { image: "propolis", category: "propolis" },
  { image: "perga", category: "perga" },
  { image: "cream-honey", category: "cream-honey" },
  { image: "box-medovyi", category: "gift-boxes" },
  { image: "nuts-honey", category: "nuts-honey" },
];

export default function About() {
  return (
    <div>
      <section className="container-p py-14 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-serif text-4xl font-bold text-ink">Мед, який починається з бджіл</h1>
          <p className="mt-5 text-ink/70 leading-relaxed">
            Ми — власна пасіка, яка вирощує мед та продукти бджільництва з турботою про бджіл та природу.
            Кожна баночка проходить через наші руки, перш ніж потрапити до вас.
          </p>
          <p className="mt-4 text-ink/70 leading-relaxed">
            Ми не обіцяємо лікувальних властивостей чи сертифікацій, яких не маємо — лише чесний, натуральний
            продукт, зроблений з любов'ю до справи.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink/70">
            <li>🍯 Власна пасіка</li>
            <li>🌿 Натуральна продукція</li>
            <li>🐝 Турбота про бджіл</li>
            <li>✅ Якість у кожній баночці</li>
          </ul>
        </div>
        <ProductImage image="honey-jar-big" category="honey" className="aspect-square" />
      </section>

      <section className="container-p pb-16">
        <h2 className="font-serif text-2xl font-bold text-ink mb-6">Галерея / процес</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {GALLERY.map((g, i) => (
            <ProductImage key={i} image={g.image} category={g.category} className="aspect-square" />
          ))}
        </div>
      </section>

      <section className="container-p pb-20">
        <div className="card p-8 md:p-10 text-center bg-gradient-to-br from-ink to-ink/90 text-cream rounded-3xl">
          <h2 className="font-serif text-2xl font-bold">Більше життя нашої пасіки — у TikTok 🐝</h2>
          <p className="mt-2 text-cream/70">Дивіться, як живе наша пасіка, як працюють бджоли та створюється продукція.</p>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">Дивитися TikTok</a>
        </div>
      </section>
    </div>
  );
}
