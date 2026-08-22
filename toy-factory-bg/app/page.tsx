import ToyBuilder from "@/components/toy-builder";

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <a className="wordmark" href="#top">TOY FACTORY <span>BG</span></a>
        <a className="nav-link" href="#create">Създай фигурка</a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FROM PHOTO TO REAL OBJECT</p>
          <h1>Ти.<br />Като фигурка.</h1>
          <p className="hero-text">Качи снимка, виж своята AI визуализация и поръчай персонализирана 3D фигурка, произведена специално за теб.</p>
          <a className="primary-button hero-button" href="#create">Създай моята</a>
        </div>
        <div className="hero-object" aria-hidden="true">
          <div className="toy-head"><div className="eye left" /><div className="eye right" /><div className="smile" /></div>
          <div className="toy-body" />
          <div className="toy-base">01</div>
        </div>
      </section>

      <section className="how-it-works">
        <div><strong>01</strong><h3>Качи снимка</h3><p>Една ясна снимка е достатъчна за първата визуализация.</p></div>
        <div><strong>02</strong><h3>Одобри визията</h3><p>Виж резултата преди да поръчаш. Ако трябва — генерирай отново.</p></div>
        <div><strong>03</strong><h3>Ние я произвеждаме</h3><p>След плащане създаваме 3D модела и го подготвяме за многоцветен печат.</p></div>
      </section>

      <ToyBuilder />

      <footer>
        <span>TOY FACTORY BG · MVP</span>
        <span>Персонализирани колекционерски фигурки</span>
      </footer>
    </main>
  );
}
