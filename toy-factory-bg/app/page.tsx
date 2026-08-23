import ToyBuilder from "@/components/toy-builder";

const styles = [
  { name: "POP", copy: "Графична vinyl визия с голяма глава и силен collectible характер.", tone: "coral" },
  { name: "MINI", copy: "По-мека chibi интерпретация с човешки силует и много характер.", tone: "blue" },
  { name: "BRICK", copy: "Твоята снимка, превърната в playful brick-style колекционерска фигурка.", tone: "lime" },
];

export default function Home() {
  return (
    <main className="popme-site">
      <nav className="popme-nav" id="top">
        <a className="popme-logo" href="#top" aria-label="popme home">
          popme<span className="popme-spark">✦</span>
        </a>
        <div className="popme-nav-links">
          <a href="#styles">Стилове</a>
          <a href="#how">Как работи</a>
          <a className="popme-nav-cta" href="#create">CREATE MY POP</a>
        </div>
      </nav>

      <section className="popme-hero">
        <div className="popme-hero-copy">
          <p className="popme-tag">MADE OF YOU.</p>
          <h1>MEET<br />YOUR MINI.</h1>
          <p className="popme-hero-text">Качи снимка, избери своя стил и виж как изглеждаш като персонализирана 3D колекционерска фигурка — преди да поръчаш.</p>
          <div className="popme-hero-actions">
            <a className="popme-primary" href="#create">CREATE MY POP <span>↗</span></a>
            <a className="popme-secondary" href="#styles">Виж стиловете</a>
          </div>
          <div className="popme-proof">
            <span>01 · PREVIEW FIRST</span>
            <span>02 · MADE TO ORDER</span>
            <span>03 · 3D PRINTED</span>
          </div>
        </div>

        <div className="popme-hero-art" aria-hidden="true">
          <div className="popme-card popme-card-pop">
            <span>POP</span>
            <div className="visual pop-visual"><i className="head" /><i className="body" /><i className="feet" /></div>
            <small>01</small>
          </div>
          <div className="popme-card popme-card-mini">
            <span>MINI</span>
            <div className="visual mini-visual"><i className="head" /><i className="body" /><i className="feet" /></div>
            <small>02</small>
          </div>
          <div className="popme-card popme-card-brick">
            <span>BRICK</span>
            <div className="visual brick-visual"><i className="head" /><i className="body" /><i className="feet" /></div>
            <small>03</small>
          </div>
          <div className="popme-orbit">MADE OF YOU · MADE OF YOU ·</div>
        </div>
      </section>

      <section className="popme-marquee" aria-label="brand statement">
        <div>YOUR FACE. YOUR STYLE. YOUR POP. ✦ YOUR FACE. YOUR STYLE. YOUR POP. ✦</div>
      </section>

      <section className="popme-styles" id="styles">
        <div className="popme-section-head">
          <p>CHOOSE YOUR CHARACTER</p>
          <h2>Три начина<br />да бъдеш ти.</h2>
        </div>
        <div className="popme-style-grid">
          {styles.map((style, index) => (
            <article className={`popme-style-card ${style.tone}`} key={style.name}>
              <div className="popme-style-top"><span>0{index + 1}</span><strong>{style.name}</strong></div>
              <div className={`style-figure style-figure-${style.name.toLowerCase()}`} aria-hidden="true"><i /><b /><em /></div>
              <p>{style.copy}</p>
              <a href="#create">Избери {style.name} →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="popme-how" id="how">
        <div className="popme-section-head inverted">
          <p>FROM PHOTO TO OBJECT</p>
          <h2>Създадено<br />специално за теб.</h2>
        </div>
        <div className="popme-how-grid">
          <article><span>01</span><h3>Качи снимка</h3><p>Избери ясна снимка, на която лицето и визията ти се виждат добре.</p></article>
          <article><span>02</span><h3>Виж своя POP</h3><p>Генерираме preview в избрания стил. Можеш да одобриш или да опиташ отново.</p></article>
          <article><span>03</span><h3>Ние го правим реален</h3><p>След плащането създаваме 3D модела, подготвяме го за печат и произвеждаме твоята фигурка.</p></article>
        </div>
      </section>

      <ToyBuilder />

      <section className="popme-facts">
        <div><strong>10 / 15 / 20</strong><span>CM · THREE SIZES</span></div>
        <div><strong>ONE OF ONE</strong><span>MADE TO ORDER</span></div>
        <div><strong>YOU → MINI</strong><span>MADE OF YOU.</span></div>
      </section>

      <footer className="popme-footer">
        <div className="popme-footer-logo">popme<span>✦</span></div>
        <p>Personalized 3D collectibles.<br />Made of you.</p>
        <div className="popme-footer-links"><a href="#create">Create yours</a><a href="#how">How it works</a></div>
        <small>© 2026 POPME</small>
      </footer>
    </main>
  );
}
