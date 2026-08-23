import ToyBuilder from "@/components/toy-builder";

const styles = [
  {
    name: "POP",
    key: "pop",
    copy: "Графична vinyl визия с голяма глава, смели черти и силен collectible характер.",
    tone: "coral",
    image: "/marketing/pop.svg",
    price: "€49",
  },
  {
    name: "MINI",
    key: "mini",
    copy: "По-мека chibi интерпретация с човешки силует, повече детайл и много характер.",
    tone: "blue",
    image: "/marketing/mini.svg",
    price: "€49",
  },
  {
    name: "BRICK",
    key: "brick",
    copy: "Твоята снимка, превърната в playful brick-style колекционерска фигурка.",
    tone: "lime",
    image: "/marketing/brick.svg",
    price: "€49",
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
          <div className="launch-pill">СТАРТОВА ОФЕРТА · −25%</div>
          <p className="popme-tag">MADE OF YOU.</p>
          <h1>ТИ.<br />КАТО 3D<br />ФИГУРКА.</h1>
          <p className="popme-hero-text">Качи снимка, избери POP, MINI или BRICK и виж персонализираната си 3D фигурка още преди да поръчаш.</p>
          <div className="popme-hero-actions">
            <a className="popme-primary" href="#create">НАПРАВИ МЕ 3D <span>→</span></a>
            <a className="popme-secondary" href="#how">Виж как работи</a>
          </div>
          <div className="popme-price-strip"><strong>ОТ €49</strong><span>10 / 15 / 20 cm · preview преди плащане</span></div>
        </div>

        <div className="hero-products" aria-label="POPME стилове">
          {styles.map((style) => (
            <a className={`hero-product ${style.tone}`} href={`/?style=${style.key}#create`} key={style.name}>
              <span>{style.name}</span>
              <img src={style.image} alt={`${style.name} примерна POPME фигурка`} />
            </a>
          ))}
          <div className="hero-note">ТВОЯТА СНИМКА → ТВОЯТА ФИГУРКА</div>
        </div>
      </section>

      <section className="popme-benefit-strip">
        <div><b>01</b><strong>Качи снимка</strong><span>JPG, PNG или WEBP</span></div>
        <div><b>02</b><strong>AI визуализация</strong><span>Виж стила преди поръчка</span></div>
        <div><b>03</b><strong>Персонализация</strong><span>3 стила · 3 размера</span></div>
        <div><b>04</b><strong>3D производство</strong><span>Подготвяме модела за печат</span></div>
        <div><b>05</b><strong>Единствена по рода си</strong><span>Направена по твоя снимка</span></div>
      </section>

      <section className="popme-styles" id="styles">
        <div className="popme-section-head split-head">
          <div><p>ИЗБЕРИ СВОЯ ХАРАКТЕР</p><h2>Три начина<br />да бъдеш ти.</h2></div>
          <div className="offer-copy"><strong>−25%</strong><span>стартова оферта върху текущите цени</span></div>
        </div>
        <div className="popme-style-grid" id="prices">
          {styles.map((style, index) => (
            <article className={`popme-style-card ${style.tone}`} key={style.name}>
              <div className="popme-style-top"><span>0{index + 1}</span><strong>{style.name}</strong></div>
              <img className="style-product-image" src={style.image} alt={`${style.name} стил`} />
              <p>{style.copy}</p>
              <div className="style-price"><span>СТАРТОВА ЦЕНА</span><strong>от {style.price}</strong><small>10 / 15 / 20 cm</small></div>
              <a className="style-cta" href={`/?style=${style.key}#create`}>ИЗБЕРИ {style.name} →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="popme-how" id="how">
        <div className="popme-section-head inverted"><p>ОТ СНИМКА ДО ФИГУРКА</p><h2>Лесно като<br />1 — 2 — 3.</h2></div>
        <div className="popme-how-grid">
          <article><span>01</span><h3>Качи снимка</h3><p>Избери снимка с ясно лице и добра светлина. Ние я подготвяме за AI визуализация.</p></article>
          <article><span>02</span><h3>Виж себе си в 3D стил</h3><p>Избираш POP, MINI или BRICK, преглеждаш preview-а и можеш да генерираш отново.</p></article>
          <article><span>03</span><h3>Одобри и поръчай</h3><p>Избираш размер, плащаш сигурно през Shopify и тогава стартираме истинския 3D модел.</p></article>
        </div>
      </section>

      <section className="popme-proof-section">
        <div className="popme-section-head"><p>ПЪРВИТЕ POPME ИСТОРИИ</p><h2>Преди да стане<br />истинска фигурка.</h2></div>
        <div className="proof-grid">
          {styles.map((style) => (
            <article key={style.name}>
              <img src={style.image} alt={`Тестова ${style.name} визуализация`} />
              <div><strong>{style.name}</strong><span>Тестова визуализация</span></div>
            </article>
          ))}
        </div>
        <p className="proof-note">Това са тестови POPME визуализации. Реални клиентски отзиви ще публикуваме след първите доставки.</p>
      </section>

      <ToyBuilder />

      <section className="popme-facts">
        <div><strong>10 / 15 / 20</strong><span>CM · ТРИ РАЗМЕРА</span></div>
        <div><strong>ONE OF ONE</strong><span>НАПРАВЕНА ПО ПОРЪЧКА</span></div>
        <div><strong>ТИ → 3D</strong><span>MADE OF YOU.</span></div>
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
        <div><p>ГОТОВ ЛИ СИ?</p><h2>Една снимка.<br />Една единствена фигурка.</h2></div>
        <div className="final-offer"><span>СТАРТОВА ОФЕРТА</span><strong>−25%</strong><small>цени от €49</small></div>
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
