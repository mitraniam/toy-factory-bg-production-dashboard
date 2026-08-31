const styles = [
  {
    name: "POP",
    key: "pop",
    copy: "Vinyl визия с по-голяма глава и силен колекционерски характер.",
    tone: "coral",
    image: "/marketing/pop-card.svg",
    badge: "КЛАСИКА",
  },
  {
    name: "MINI",
    key: "mini",
    copy: "По-мек chibi силует, повече детайл и много характер.",
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
    <main className="popme-site popme-clean-home">
      <div className="mobile-announcement">PREVIEW ПРЕДИ ПЛАЩАНЕ · СТАРТОВИ ЦЕНИ ОТ €49</div>

      <nav className="clean-nav" id="top">
        <a className="clean-logo" href="#top" aria-label="POPME начало">popme<span>✦</span></a>
        <div className="clean-nav-links">
          <a href="#styles">Стилове</a>
          <a href="#how">Как работи</a>
          <a href="#faq">FAQ</a>
        </div>
        <a className="clean-nav-cta" href="/create">СЪЗДАЙ ФИГУРКА →</a>
      </nav>

      <section className="clean-hero">
        <div className="clean-hero-copy">
          <p className="clean-eyebrow">ТВОЯТА СНИМКА. ТВОЯТА ФИГУРКА.</p>
          <h1>Една снимка.<br />Твоята фигурка.</h1>
          <p className="clean-lead">Превръщаме снимката ти в персонализирана POP, MINI или BRICK 3D фигурка. Първо виждаш визуализацията. После решаваш.</p>
          <div className="clean-hero-actions">
            <a className="clean-primary" href="/create">СЪЗДАЙ СВОЯТА ФИГУРКА →</a>
            <span>Стартова цена от <strong>€49</strong></span>
          </div>
        </div>

        <div className="clean-hero-visual" aria-label="POPME стилове">
          <div className="clean-hero-pedestal" aria-hidden="true" />
          <a className="clean-hero-card coral" href="/create?style=pop"><img src="/marketing/pop-card.svg" alt="POP стил" /><b>POP</b></a>
          <a className="clean-hero-card blue featured" href="/create?style=mini"><img src="/marketing/mini.svg" alt="MINI стил" /><b>MINI</b></a>
          <a className="clean-hero-card lime" href="/create?style=brick"><img src="/marketing/brick.svg" alt="BRICK стил" /><b>BRICK</b></a>
        </div>
      </section>

      <div className="mobile-trust-row" aria-label="POPME преимущества">
        <span><b>3</b> стила</span>
        <span><b>3</b> размера</span>
        <span><b>2</b> нови опита</span>
      </div>

      <section className="clean-styles" id="styles">
        <div className="clean-section-head">
          <p>ИЗБЕРИ СВОЯ СТИЛ</p>
          <h2>3 стила. 3 начина да си ти.</h2>
        </div>
        <div className="clean-style-grid">
          {styles.map((style) => (
            <article className={`clean-style-card ${style.tone}`} key={style.name}>
              <div className="clean-style-copy">
                <div className="clean-style-title"><h3>{style.name}</h3><span>{style.badge}</span></div>
                <p>{style.copy}</p>
                <div className="clean-style-price"><strong>от €49</strong><small>10 / 15 / 20 cm</small></div>
                <a href={`/create?style=${style.key}`}>ИЗБЕРИ {style.name} →</a>
              </div>
              <div className="clean-style-visual"><img src={style.image} alt={`${style.name} POPME фигурка`} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="clean-how" id="how">
        <div className="clean-section-head">
          <p>КАК РАБОТИ</p>
          <h2>Три стъпки. Толкова е.</h2>
        </div>
        <div className="clean-how-grid">
          <article><span>01</span><h3>Качи снимка</h3><p>Избираш стил и качваш ясна снимка.</p></article>
          <article><span>02</span><h3>Виж визуализация</h3><p>Генерираме твоята фигурка преди плащане.</p></article>
          <article><span>03</span><h3>Одобри и поръчай</h3><p>Избираш размер и продължаваш към checkout.</p></article>
        </div>
      </section>

      <section className="clean-proof">
        <div className="clean-proof-copy">
          <p>ВИЗУАЛИЗАЦИЯ ПРЕДИ ПЛАЩАНЕ</p>
          <h2>Виж я. Харесай я. После поръчай.</h2>
          <span>Не плащаш на сляпо. Първо виждаш своя POPME, после избираш 10, 15 или 20 cm и продължаваш към плащане.</span>
          <div className="clean-proof-points"><b>3 стила</b><b>3 размера</b><b>до 2 нови опита</b></div>
          <a href="/create">НАПРАВИ МЕ 3D →</a>
        </div>
        <div className="clean-preview-showcase">
          <div className="clean-preview-label"><span>ПРИМЕРНА AI ВИЗУАЛИЗАЦИЯ</span><b>MINI</b></div>
          <img src="/marketing/mini.svg" alt="Примерна MINI POPME визуализация" />
          <div className="clean-preview-meta"><span>PREVIEW</span><strong>Преди плащане</strong></div>
        </div>
      </section>

      <section className="clean-faq" id="faq">
        <div className="clean-section-head"><p>НАЙ-ВАЖНОТО</p><h2>Често задавани въпроси.</h2></div>
        <div className="clean-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="clean-final">
        <div><p>ГОТОВ ЛИ СИ?</p><h2>Една снимка.<br />Твоята фигурка.</h2></div>
        <div className="clean-final-action"><div><strong>от €49</strong><small>визуализация преди плащане</small></div><a href="/create">СЪЗДАЙ СВОЯТА СЕГА →</a></div>
      </section>

      <footer className="clean-footer">
        <div className="clean-logo">popme<span>✦</span></div>
        <p>Персонализирани 3D колекционерски фигурки · Made of you.</p>
        <small>© 2026 POPME</small>
      </footer>

      <a className="mobile-shop-cta" href="/create"><span>СЪЗДАЙ ФИГУРКА</span><strong>от €49 →</strong></a>
    </main>
  );
}
