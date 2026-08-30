import ToyBuilder from "@/components/toy-builder";

export default function PreviewPage() {
  return (
    <main className="popme-site create-page preview-page">
      <nav className="popme-nav create-nav">
        <a className="popme-logo" href="/" aria-label="POPME начало">popme<span>✦</span></a>
        <a className="create-nav-back" href="/create">← Нова снимка</a>
      </nav>
      <ToyBuilder initialView="preview" />
    </main>
  );
}
