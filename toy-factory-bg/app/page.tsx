import ToyBuilder from "@/components/toy-builder";

const priceTiers = [
  { size: "10 cm", now: "€49", regular: "€59" },
  { size: "15 cm", now: "€69", regular: "€89" },
  { size: "20 cm", now: "€89", regular: "€119" },
];

const styles = [
  {
    name: "POP",
    key: "pop",
    copy: "Класическа колекционерска визия с голяма глава, изчистени форми и силен POP характер.",
    tone: "coral",
    image: "/marketing/pop-card.svg",
    badge: "КЛАСИКА",
  },
  {
    name: "MINI",
    key: "mini",
    copy: "По-фина chibi визия с по-човешки пропорции, повече детайл и много характер.",
    tone: "blue",
    image: "/marketing/mini.svg",
    badge: "НАЙ-ПОПУЛЯРЕН",
  },
  {
    name: "BRICK",
    key: "brick",
    copy: "Геометрична brick-style версия на теб — минималистична, забавна и разпознаваема.",
    tone: "lime",
    image: "/marketing/brick.svg",
    badge: "МОДЕРЕН",
  },
];

const faqs = [
  ["Каква снимка да кача?", "Най-добър резултат получаваме при ясна снимка, добро осветление, видимо лице и по възможност цял ръст."],
  ["Ще видя ли фигурката преди да платя?", "Да. Първо генерираме визуализация в избрания стил. Плащането идва след като я одобриш."],
  ["Фонът от визуализацията част ли е от продукта?", "Не. Фонът и сцената в preview изображението са илюстративни. Крайният продукт е самата 3D фигурка."],
  ["Какви размери има?", "Можеш да избереш 10 cm, 15 cm или 20 cm. Размерът се задава към конкретната поръчка."],
  ["Мога ли да поискам нова визуализация?", "Да. В builder-а имаш до два допълнителни опита за същата снимка преди да продължиш към поръчка."],
  ["Кога ще получа поръчката?", "Точният производствен и доставен срок ще бъде публикуван преди официалния старт. В момента финализираме производствения процес."],
];

export default function Home() {
  return (
    <main className="popme-site">
      <nav className="popme-nav" id="top">
        <a className="popme-logo" href="#top" aria-label="POPME начало">popme<span>✦</span></a>
        <div className="popme-nav-links">
          <a href="#styles">Стилове</a>
          <a href="#how">Как работи</a>
          <a href="#prices">Цени</a>
          <a href="#faq">FAQ</a>
          <a className="popme-nav-cta" href="#create">НАПРАВИ МЕ 3D →</a>
        </div>
      </nav>

      <section className="popme-hero">
        <div className="popme-hero-copy">
          <div className="launch-pill">🔥 СТАРТОВИ ЦЕНИ · СПЕСТИ ДО 25%</div>
          <p className="popme-tag">СНИМКА → 3D → ТВОЯ ФИГУРКА</p>
          <h1>ТИ.<br />КАТО 3D<br />ФИГУРКА.</h1>
          <p className="popme-hero-text">POP, MINI или BRICK — твоята снимка, твоят стил, истинска фигурка. Първо виждаш визуализацията. После решаваш.</p>
          <div className="popme-hero-actions">
            <a className="popme-primary" href="#create">НАПРАВИ МЕ 3D <span>→</span></a>
            <a className="popme-secondary" href="#styles">Виж стиловете</a>
          </div>
          <div className="popme-price-strip">
            <strong>ОТ €49</strong><del>редовна €59</del>
            <span>Стартова цена · визуализация преди плащане</span>
          </div>
        </div>

        <div className="hero-products" aria-label="POPME стилове">
          {styles.map((style) => (
            <a className={`hero-product ${style.tone}`} href={`/?style=${style.key}#create`} key={style.name}>
              <img src={style.image} alt={`${style.name} примерна POPME фигурка`} />
              <span>{style.name}</span>
            </a>
          ))}
          <div className="hero-note">ТВОЯТА СНИМКА → ТВОЯТА ФИГУРКА</div>
        </div>
      </section>

      <section className="popme-benefit-strip">
        <div><b>01</b><strong>Качи себе си</strong><span>1 добра снимка е достатъчна</span></div>
        <div><b>02</b><strong>Виж се като фигурка</strong><span>POP, MINI или BRICK</span></div>
        <div><b>03</b><strong>Избери своя стил</strong><span>3 стила · 3 размера</span></div>
        <div><b>04</b><strong>Ние я правим реална</strong><span>3D модел → печат</span></div>
        <div><b>05</b><strong>Разопаковай магията</strong><span>Единствена. Точно като теб.</span></div>
      </section>

      <section className="popme-styles" id="styles">
        <div className="popme-section-head split-head">
          <div><p>ИЗБЕРИ СВОЯ СТИЛ</p><h2>Три начина<br />да бъдеш ти.</h2></div>
          <div className="offer-copy"><span>СТАРТОВИ ЦЕНИ</span><strong>ДО −25%</strong><small>спрямо редовните цени след стартовия период</small></div>
        </div>

        <div className="popme-style-grid" id="prices">
          {styles.map((style, index) => (
            <article className={`popme-style-card ${style.tone}`} key={style.name}>
              <div className="popme-style-top"><span>0{index + 1}</span><strong>{style.name}</strong><em>{style.badge}</em></div>
              <img className="style-product-image" src={style.image} alt={`${style.name} стил`} />
              <p>{style.copy}</p>
              <div className="card-price-list" aria-label={`${style.name} цени`}>
                {priceTiers.map((tier) => (
                  <div key={tier.size}><span>{tier.size}</span><strong>{tier.now}</strong><del>{tier.regular}</del></div>
                ))}
              </div>
              <a className="style-cta" href={`/?style=${style.key}#create`}>ИЗБЕРИ {style.name} →</a>
            </article>
          ))}
        </div>
        <p className="price-clarifier">Стартовите цени са временни. Зачеркнатите стойности са планираните редовни цени след стартовия период.</p>
      </section>

      <section className="popme-how" id="how">
        <div className="popme-section-head inverted"><p>ОТ СНИМКА ДО ФИГУРКА</p><h2>Лесно.<br />Бързо. Вълнуващо.</h2></div>
        <div className="popme-how-grid">
          <article><span>01</span><h3>Качи снимка</h3><p>Избираш ясна снимка с добро осветление. Това е всичко, което ни трябва, за да започнем.</p></article>
          <article><span>02</span><h3>Виж AI визуализация</h3><p>Получаваш своя POP, MINI или BRICK вариант и избираш този, който най-много прилича на теб.</p></article>
          <article><span>03</span><h3>Одобри и поръчай</h3><p>Едва след одобрението избираш размер и плащаш. Ние превръщаме визията в истинска 3D фигурка.</p></article>
        </div>
      </section>

      <section className="preview-first-section">
        <div className="preview-first-visual">
          <div className="preview-ticket">НЕ ПЛАЩАШ НА СЛЯПО</div>
          <img src="/marketing/mini.svg" alt="Примерна MINI визуализация преди плащане" />
          <span>AI ВИЗУАЛИЗАЦИЯ</span>
        </div>
        <div className="preview-first-copy">
          <p>ПЪРВО ВИЖДАШ</p>
          <h2>Харесай я.<br />После я поръчай.</h2>
          <p className="preview-intro">Преди да платиш, виждаш как ще изглежда твоят стил. Ако не е твоето — генерираш отново.</p>
          <div className="preview-checks">
            <div><b>01</b><span><strong>Избираш стил</strong>POP, MINI или BRICK</span></div>
            <div><b>02</b><span><strong>Виждаш визуализация</strong>преди да дадеш и 1 евро</span></div>
            <div><b>03</b><span><strong>Одобряваш</strong>и чак тогава продължаваш към поръчка</span></div>
          </div>
          <a href="#create">ВИЖ МЕ КАТО ФИГУРКА →</a>
        </div>
      </section>

      <ToyBuilder />

      <section className="popme-facts">
        <div className="fact-size"><span>3 РАЗМЕРА</span><strong>10 · 15 · 20 CM</strong><p>Малка. Средна. WOW.</p></div>
        <div className="fact-one"><span>ЕДИНСТВЕНА</span><strong>ONE OF ONE</strong><p>Няма две еднакви POPME фигурки.</p></div>
        <div className="fact-transform"><span>ТИ → POPME</span><strong>ЛИЦЕ → СТИЛ → 3D</strong><p>От една снимка до истинска фигурка.</p></div>
      </section>

      <section className="popme-faq" id="faq">
        <div className="popme-section-head"><p>ПРЕДИ ДА ЗАПОЧНЕШ</p><h2>Имаш въпрос?<br />Имаме отговор.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="popme-final-cta">
        <div><p>ГОТОВ ЛИ СИ?</p><h2>Една снимка.<br />Една уникална фигурка.</h2></div>
        <div className="final-offer"><span>СТАРТОВИ ЦЕНИ</span><strong>от €49</strong><small>редовна от €59 · спести до 25%</small></div>
        <a href="#create">НАПРАВИ МЕ 3D →</a>
      </section>

      <footer className="popme-footer">
        <div className="popme-footer-logo">popme<span>✦</span></div>
        <p>Персонализирани 3D колекционерски фигурки.<br />Made of you.</p>
        <div className="popme-footer-links"><a href="#styles">Стилове</a><a href="#how">Как работи</a><a href="#faq">FAQ</a></div>
        <small>© 2026 POPME</small>
      </footer>

      <a className="mobile-sticky-cta" href="#create">НАПРАВИ МЕ 3D →</a>
    </main>
  );
}
