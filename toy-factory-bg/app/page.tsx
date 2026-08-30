const priceTiers = [
  { size: "10 cm", now: "€49", regular: "€59" },
  { size: "15 cm", now: "€69", regular: "€89" },
  { size: "20 cm", now: "€89", regular: "€119" },
];

const styles = [
  {
    name: "POP",
    key: "pop",
    copy: "Класическа collectible визия с голяма глава и силен POP характер.",
    tone: "coral",
    image: "/marketing/pop-card.svg",
    badge: "КЛАСИКА",
  },
  {
    name: "MINI",
    key: "mini",
    copy: "По-мек chibi силует, повече детайл и изразителност.",
    tone: "blue",
    image: "/marketing/mini.svg",
    badge: "НАЙ-ПОПУЛЯРЕН",
  },
  {
    name: "BRICK",
    key: "brick",
    copy: "Геометрична brick-style версия — чиста, забавна и разпознаваема.",
    tone: "lime",
    image: "/marketing/brick.svg",
    badge: "МОДЕРЕН",
  },
];

const faqs = [
  ["Ще видя ли фигурката преди да платя?", "Да. Първо генерираме визуализация. Плащаш едва след като я харесаш."],
  ["Каква снимка да кача?", "Ясна снимка, добро осветление, видимо лице и по възможност цял ръст."],
  ["Какви размери има?", "10 cm, 15 cm или 20 cm. Избираш размера след визуализацията."],
  ["Мога ли да генерирам отново?", "Да. Имаш до два допълнителни опита за същата снимка."],
];

export default function Home() {
  return (
    <main className="popme-site popme-home">
      <nav className="popme-nav" id="top">
        <a className="popme-logo" href="#top" aria-label="POPME начало">popme<span>✦</span></a>
        <div className="popme-nav-links">
          <a href="#styles">Стилове</a>
          <a href="#how">Как работи</a>
          <a href="#faq">FAQ</a>
          <a className="popme-nav-cta" href="/create">НАПРАВИ МЕ 3D →</a>
        </div>
      </nav>

      <section className="popme-hero">
        <div className="popme-hero-copy">
          <div className="launch-pill">СТАРТОВИ ЦЕНИ · ДО −25%</div>
          <p className="popme-tag">СНИМКА → ВИЗУАЛИЗАЦИЯ → ФИГУРКА</p>
          <h1>ТИ.<br />КАТО 3D<br />ФИГУРКА.</h1>
          <p className="popme-hero-text">Избираш POP, MINI или BRICK. Качваш снимка. Виждаш резултата преди да платиш.</p>
          <div className="popme-hero-actions">
            <a className="popme-primary" href="/create">НАПРАВИ МЕ 3D <span>→</span></a>
            <a className="popme-secondary" href="#styles">Виж стиловете</a>
          </div>
          <div className="popme-price-strip">
            <strong>ОТ €49</strong>
            <span>10 / 15 / 20 cm · preview преди плащане</span>
          </div>
        </div>

        <div className="hero-products" aria-label="POPME стилове">
          {styles.map((style) => (
            <a className={`hero-product ${style.tone}`} href={`/create?style=${style.key}`} key={style.name}>
              <img src={style.image} alt={`${style.name} примерна POPME фигурка`} />
              <span>{style.name}</span>
            </a>
          ))}
          <div className="hero-note">MADE OF YOU.</div>
        </div>
      </section>

      <section className="popme-quick-flow" aria-label="Как работи POPME">
        <div><b>01</b><strong>Качи снимка</strong></div>
        <div><b>02</b><strong>Виж себе си в 3D</strong></div>
        <div><b>03</b><strong>Одобри и поръчай</strong></div>
      </section>

      <section className="popme-styles" id="styles">
        <div className="popme-section-head split-head">
          <div><p>ИЗБЕРИ СВОЯ СТИЛ</p><h2>Три версии.<br />Все още ти.</h2></div>
          <div className="offer-copy"><span>СТАРТОВИ ЦЕНИ</span><strong>ДО −25%</strong><small>за стартовия период</small></div>
        </div>

        <div className="popme-style-grid">
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
              <a className="style-cta" href={`/create?style=${style.key}`}>ИЗБЕРИ {style.name} →</a>
            </article>
          ))}
        </div>
        <p className="price-clarifier">Зачеркнатите стойности са планираните редовни цени след стартовия период.</p>
      </section>

      <section className="popme-how compact-how" id="how">
        <div className="popme-section-head inverted"><p>3 СТЪПКИ</p><h2>От снимка<br />до твоя POPME.</h2></div>
        <div className="popme-how-grid">
          <article><span>01</span><h3>Качи снимка</h3><p>Една ясна снимка е достатъчна, за да започнем.</p></article>
          <article><span>02</span><h3>Виж визуализация</h3><p>Генерираме избрания стил и ти решаваш дали е твоят.</p></article>
          <article><span>03</span><h3>Поръчай</h3><p>Избираш 10, 15 или 20 cm и продължаваш към сигурен Shopify checkout.</p></article>
        </div>
        <a className="how-cta" href="/create">ЗАПОЧНИ СЪС СНИМКА →</a>
      </section>

      <section className="popme-proof-callout">
        <div className="proof-copy">
          <p>ПЪРВО ВИЖДАШ</p>
          <h2>Не плащаш<br />на сляпо.</h2>
          <span>Визуализацията е част от процеса. Харесваш я, избираш размер и чак тогава поръчваш.</span>
          <a href="/create">ВИЖ МЕ КАТО ФИГУРКА →</a>
        </div>
        <div className="proof-visual">
          <div className="before-card"><span>СНИМКА</span><div className="photo-placeholder">ТВОЯТА<br />СНИМКА</div></div>
          <div className="proof-arrow">→</div>
          <div className="after-card"><span>POPME</span><img src="/marketing/mini.svg" alt="POPME визуализация" /></div>
        </div>
      </section>

      <section className="popme-faq" id="faq">
        <div className="popme-section-head"><p>ПРЕДИ ДА ЗАПОЧНЕШ</p><h2>Най-важното.<br />Без дребния шрифт.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="popme-final-cta compact-final-cta">
        <div><p>ГОТОВ ЛИ СИ?</p><h2>Една снимка.<br />Твоята фигурка.</h2></div>
        <div className="final-offer"><span>СТАРТОВА ЦЕНА</span><strong>от €49</strong><small>preview преди плащане</small></div>
        <a href="/create">НАПРАВИ МЕ 3D →</a>
      </section>

      <footer className="popme-footer">
        <div className="popme-footer-logo">popme<span>✦</span></div>
        <p>Персонализирани 3D колекционерски фигурки.<br />Made of you.</p>
        <div className="popme-footer-links"><a href="#styles">Стилове</a><a href="#how">Как работи</a><a href="#faq">FAQ</a></div>
        <small>© 2026 POPME</small>
      </footer>

      <a className="mobile-sticky-cta" href="/create">НАПРАВИ МЕ 3D →</a>
    </main>
  );
}
