const styles = [
  {
    name: "POP",
    key: "pop",
    subtitle: "Vinyl collectible",
    copy: "Vinyl визия, по-голяма глава, колекционерски характер.",
    image: "/marketing/pop.svg",
    tone: "coral",
    badge: "КЛАСИКА",
  },
  {
    name: "MINI",
    key: "mini",
    subtitle: "Chibi figure",
    copy: "По-мек chibi силует, повече детайл и много характер.",
    image: "/marketing/mini.svg",
    tone: "blue",
    badge: "НАЙ-ПОПУЛЯРЕН",
  },
  {
    name: "BRICK",
    key: "brick",
    subtitle: "Brick-style figure",
    copy: "Геометрична brick-style версия — чиста и разпознаваема.",
    image: "/marketing/brick.svg",
    tone: "lime",
    badge: "МОДЕРЕН",
  },
];

const faqs = [
  ["Ще видя ли фигурката преди да платя?", "Да. Първо генерираме визуализация. Плащаш едва след като я одобриш."],
  ["Каква снимка да кача?", "Ясна снимка, добро осветление, видимо лице и по възможност цял ръст."],
  ["Какви размери и цени има?", "10 cm — €49, 15 cm — €69, 20 cm — €89. Това са стартови цени."],
  ["Мога ли да генерирам отново?", "Да. Имаш до два допълнителни опита за същата снимка."],
];

const prices = [
  ["10 cm", "€49"],
  ["15 cm", "€69"],
  ["20 cm", "€89"],
];

export default function Home() {
  return (
    <main className="pmv2-site">
      <aside className="pmv2-side-price-tab">СТАРТОВИ ЦЕНИ ОТ €49</aside>

      <div className="pmv2-announcement">
        <strong>ВИЖДАШ ФИГУРКАТА СИ, ПРЕДИ ДА ПЛАТИШ</strong>
        <span>СТАРТОВИ ЦЕНИ ОТ €49</span>
      </div>

      <header className="pmv2-header" id="top">
        <a className="pmv2-logo" href="#top" aria-label="POPME начало">popme<span>✦</span></a>
        <nav className="pmv2-nav-links" aria-label="Основна навигация">
          <a href="#styles">Стилове</a>
          <a href="#how">Как работи</a>
          <a href="#prices">Цени</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="pmv2-header-actions">
          <a className="pmv2-header-cta" href="/create">СЪЗДАЙ ФИГУРКА</a>
          <a className="pmv2-menu-link" href="#styles" aria-label="Виж стиловете">☰</a>
        </div>
      </header>

      <section className="pmv2-hero">
        <div className="pmv2-hero-copy">
          <div className="pmv2-rating-line"><span>★★★★★</span><span><b>3</b> стила · <b>3</b> размера · визуализация <b>преди</b> плащане</span></div>
          <h1>Една снимка.<br /><span>Твоята фигурка.</span></h1>
          <a className="pmv2-primary" href="/create">СЪЗДАЙ СВОЯТА ФИГУРКА →</a>
          <div className="pmv2-micro-trust">
            <span>◷ Плащаш след одобрение</span>
            <span>◇ Сигурно плащане Shopify</span>
          </div>
          <div className="pmv2-hero-stats" aria-label="POPME факти">
            <div><strong>3</strong><b>Стила</b><span>POP · MINI · BRICK</span></div>
            <div><strong>3</strong><b>Размера</b><span>10 / 15 / 20 cm</span></div>
            <div><strong>€49</strong><b>Стартова цена</b><span>за 10 cm фигурка</span></div>
          </div>
        </div>

        <div className="pmv2-hero-stage" aria-label="POPME POP, MINI и BRICK стилове">
          <div className="pmv2-stage-glow" />
          <div className="pmv2-stage-shadow" />
          <a className="pmv2-figure pmv2-figure-pop" href="/create?style=pop"><img src="/marketing/pop.svg" alt="Примерна POP фигурка" /><b>POP</b></a>
          <a className="pmv2-figure pmv2-figure-mini" href="/create?style=mini"><img src="/marketing/mini.svg" alt="Примерна MINI фигурка" /><b>MINI</b></a>
          <a className="pmv2-figure pmv2-figure-brick" href="/create?style=brick"><img src="/marketing/brick.svg" alt="Примерна BRICK фигурка" /><b>BRICK</b></a>
          <div className="pmv2-hero-badge">ВИЖДАШ Я<br />ПРЕДИ ДА<br />ПЛАТИШ</div>
        </div>
      </section>

      <section className="pmv2-trust-marquee" aria-label="Основни предимства">
        <span>PREVIEW ПРЕДИ ПЛАЩАНЕ</span><span>SHOPIFY CHECKOUT</span><span>3D ПЕЧАТ ПО ПОРЪЧКА</span><span>ДОСТАВКА В БЪЛГАРИЯ</span><span>ДО 2 НОВИ ОПИТА</span>
      </section>

      <section className="pmv2-styles" id="styles">
        <div className="pmv2-section-title"><p>НАМЕРИ СВОЯТА ВЕРСИЯ</p><h2>Избери своя стил</h2></div>
        <div className="pmv2-style-rail">
          {styles.map((style) => (
            <article className={`pmv2-style-card ${style.tone}`} key={style.key}>
              <div className="pmv2-style-visual"><span className="pmv2-style-badge">{style.badge}</span><img src={style.image} alt={`${style.name} стил POPME фигурка`} /></div>
              <div className="pmv2-style-body">
                <div className="pmv2-style-heading"><div><h3>{style.name}</h3><small>{style.subtitle}</small></div><strong>от €49</strong></div>
                <p>{style.copy}</p>
                <div className="pmv2-size-chips"><span>10 cm</span><span>15 cm</span><span>20 cm</span></div>
                <a href={`/create?style=${style.key}`}>СЪЗДАЙ {style.name} →</a>
              </div>
            </article>
          ))}
        </div>
        <p className="pmv2-swipe-hint">ПЛЪЗНИ ЗА ОЩЕ →</p>
      </section>

      <section className="pmv2-easy-story">
        <h2>Направихме го<br /><span>абсурдно лесно.</span></h2>
        <div className="pmv2-story-grid">
          <article><div className="pmv2-story-visual photo"><div className="pmv2-phone-photo">ТВОЯТА<br />СНИМКА</div></div><h3>Качи. Виж. Одобри.</h3><p>Една снимка е достатъчна. Визуализацията идва преди плащането.</p></article>
          <article><div className="pmv2-story-visual trio"><img src="/marketing/pop.svg" alt="POP" /><img src="/marketing/mini.svg" alt="MINI" /><img src="/marketing/brick.svg" alt="BRICK" /></div><h3>Три стила. Все още ти.</h3><p>POP, MINI или BRICK — един и същи ти, три различни характера.</p></article>
          <article><div className="pmv2-story-visual desk"><img src="/marketing/mini.svg" alt="MINI фигурка върху постамент" /></div><h3>Истински предмет.</h3><p>3D отпечатана и ръчно обработена. 10, 15 или 20 сантиметра теб.</p></article>
        </div>
      </section>

      <section className="pmv2-manifesto">
        <h2>Една снимка<br />Три стила<br />Три размера<br /><span>Една фигурка</span></h2>
        <div className="pmv2-manifesto-product"><img src="/marketing/pop.svg" alt="POP" /><img src="/marketing/mini.svg" alt="MINI" /><img src="/marketing/brick.svg" alt="BRICK" /></div>
        <div className="pmv2-manifesto-float left" /><div className="pmv2-manifesto-float right" />
      </section>

      <section className="pmv2-transform" id="how">
        <p>ОТ СНИМКА ДО ФИГУРКА</p><h2>Виж я. Харесай я.<br /><span>После поръчай.</span></h2>
        <div className="pmv2-transform-grid">
          <figure><div className="pmv2-transform-photo"><span>ТВОЯТА<br />СНИМКА</span></div><figcaption>01 · Твоята снимка</figcaption></figure>
          <figure><div className="pmv2-transform-preview"><img src="/marketing/mini.svg" alt="Примерна AI визуализация" /></div><figcaption>02 · Preview без плащане</figcaption></figure>
          <figure><div className="pmv2-transform-product"><img src="/marketing/pop.svg" alt="Примерна готова фигурка" /></div><figcaption>03 · Фигурката</figcaption></figure>
        </div>
      </section>

      <section className="pmv2-assurance">
        <div className="pmv2-assurance-copy"><h2>Не плащаш на сляпо.</h2><p>Плащането се случва след като одобриш визуализацията. Производството стартира едва тогава.</p></div>
        <div className="pmv2-assurance-grid"><div><span>✓</span><strong>Preview преди плащане</strong></div><div><span>2</span><strong>Нови опита включени</strong></div><div><span>★</span><strong>Ръчно обработена</strong></div><div><span>⌂</span><strong>Доставка в България</strong></div></div>
      </section>

      <section className="pmv2-pricing-gallery" id="prices">
        <div className="pmv2-gallery-mock" aria-label="Място за бъдещи реални клиентски снимки"><div className="pmv2-gallery-thumbs"><span /><span /><span /></div><div className="pmv2-gallery-main"><img src="/marketing/mini.svg" alt="Примерна POPME фигурка" /><small>Тук ще сложим реална клиентска галерия</small></div></div>
        <div className="pmv2-pricing-copy">
          <div className="pmv2-rating-line"><span>★★★★★</span><span>Визуализация преди плащане · до 2 нови опита</span></div>
          <h2>Стартови цени.<br />Без изненади.</h2><p>Един и същ процес за трите стила. Цената зависи само от размера, който избереш.</p>
          <div className="pmv2-price-cards">{prices.map(([size, price], index) => <div className={index === 1 ? "featured" : ""} key={size}><strong>{size}</strong><span>{price}</span></div>)}</div>
          <div className="pmv2-pricing-actions"><a className="pmv2-primary" href="/create">СЪЗДАЙ СВОЯТА →</a><a className="pmv2-outline" href="#how">Виж примерен preview</a></div>
        </div>
      </section>

      <section className="pmv2-social-proof">
        <h2><span>Твоята фигурка</span><br />заслужава публика</h2>
        <div className="pmv2-social-icons"><span>IG</span><span>TT</span><span>FB</span></div>
        <div className="pmv2-ugc-rail" aria-label="Място за бъдещо UGC съдържание">
          {["POP", "MINI", "BRICK", "YOU", "POPME"].map((label, index) => <div key={label}><img src={index % 3 === 0 ? "/marketing/pop.svg" : index % 3 === 1 ? "/marketing/mini.svg" : "/marketing/brick.svg"} alt="" /><span>{label}</span></div>)}
        </div>
      </section>

      <section className="pmv2-faq" id="faq">
        <div className="pmv2-section-title compact"><h2>Въпроси</h2></div>
        <div className="pmv2-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="pmv2-final">
        <div className="pmv2-final-copy">
          <div className="pmv2-rating-line inverse"><span>★★★★★</span><span>Стартови цени · <b>от €49</b></span></div>
          <h2>Една снимка.<br /><span>Твоята фигурка.</span></h2>
          <ul><li>✓ Визуализация преди плащане</li><li>✓ До 2 нови опита за същата снимка</li><li>✓ Сигурно плащане през Shopify</li></ul>
          <div className="pmv2-final-buttons"><a href="/create">СЪЗДАЙ ФИГУРКА →</a><a href="#styles">Виж стиловете</a></div>
        </div>
        <div className="pmv2-final-visual"><img src="/marketing/mini.svg" alt="MINI POPME фигурка" /></div>
      </section>

      <footer className="pmv2-footer-full">
        <div className="pmv2-footer-grid">
          <div className="pmv2-newsletter"><strong>Вземи 10% за първата</strong><div><input type="email" placeholder="Имейл" aria-label="Имейл" /><button type="button" aria-label="Изпрати">→</button></div><small>Формата ще бъде свързана при активиране на имейл маркетинга.</small></div>
          <div><h3>Продукт</h3><a href="#styles">POP</a><a href="#styles">MINI</a><a href="#styles">BRICK</a><a href="#prices">Размери и цени</a></div>
          <div><h3>Помощ</h3><a href="#faq">Често задавани въпроси</a><a href="#how">Как да избера снимка</a><a href="#faq">Доставка</a><a href="#faq">Контакт</a></div>
          <div><a className="pmv2-footer-logo" href="#top">popme<span>✦</span></a><p>Персонализирани 3D колекционерски фигурки. Made of you.</p></div>
        </div>
        <div className="pmv2-footer-bottom">© 2026 POPME · Стартови цени, валидни до второ нареждане.</div>
      </footer>

      <a className="pmv2-mobile-cta" href="/create"><span>СЪЗДАЙ ФИГУРКА</span><strong>от €49 →</strong></a>
    </main>
  );
}
