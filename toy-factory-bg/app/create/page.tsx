import ToyBuilder from "@/components/toy-builder";

export default function CreatePage() {
  return (
    <main className="popme-site create-page">
      <nav className="popme-nav create-nav">
        <a className="popme-logo" href="/" aria-label="POPME начало">popme<span>✦</span></a>
        <a className="create-nav-back" href="/">← Назад към сайта</a>
      </nav>
      <ToyBuilder />
      <div className="create-trust-strip">
        <span>PREVIEW ПРЕДИ ПЛАЩАНЕ</span>
        <span>SHOPIFY CHECKOUT</span>
        <span>10 / 15 / 20 CM</span>
      </div>
    </main>
  );
}
