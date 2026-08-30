"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Step = "upload" | "generating" | "preview" | "order";
type ModelKind = "pop" | "mini" | "brick";

type PrototypeTask = {
  id?: string;
  status?: string;
  progress?: number;
  image_urls?: string[];
  task_error?: { message?: string } | null;
  error?: string;
};

type StoredPreview = {
  sourceImage: string;
  previewImage: string;
  prototypeTaskId: string;
  modelKind: ModelKind;
  regenerations: number;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REGENERATIONS = 2;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const PREVIEW_STORAGE_KEY = "popme-preview-session";

const MODEL_OPTIONS: Array<{ value: ModelKind; name: string; subtitle: string }> = [
  { value: "pop", name: "POP", subtitle: "Vinyl collectible" },
  { value: "mini", name: "MINI", subtitle: "Chibi figure" },
  { value: "brick", name: "BRICK", subtitle: "Brick-style figure" },
];

const MODEL_COPY: Record<ModelKind, { title: string; text: string }> = {
  pop: { title: "Колекционерска POP фигурка", text: "Vinyl визия с по-голяма глава и опростени форми." },
  mini: { title: "Колекционерска MINI фигурка", text: "Chibi визия с по-мек силует и повече характер." },
  brick: { title: "Колекционерска BRICK фигурка", text: "Геометрична brick-style версия, създадена по твоята снимка." },
};

function isModelKind(value: string | null): value is ModelKind {
  return value === "pop" || value === "mini" || value === "brick";
}

function prepareImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не успяхме да прочетем снимката."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Невалидна снимка."));
      img.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Не успяхме да обработим снимката."));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ToyBuilder({ initialView = "upload" }: { initialView?: "upload" | "preview" }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>(initialView === "preview" ? "preview" : "upload");
  const [modelKind, setModelKind] = useState<ModelKind>("pop");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [prototypeTaskId, setPrototypeTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState("15");
  const [regenerations, setRegenerations] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hydrated, setHydrated] = useState(initialView !== "preview");

  const mockMode = process.env.NEXT_PUBLIC_MOCK_AI === "true";
  const price = useMemo(() => (size === "10" ? 49 : size === "20" ? 89 : 69), [size]);

  useEffect(() => {
    if (initialView === "preview") {
      try {
        const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
        const saved = raw ? (JSON.parse(raw) as StoredPreview) : null;
        if (!saved?.sourceImage || !saved.previewImage || !saved.prototypeTaskId || !isModelKind(saved.modelKind)) {
          window.location.replace("/create");
          return;
        }
        setSourceImage(saved.sourceImage);
        setPreviewImage(saved.previewImage);
        setPrototypeTaskId(saved.prototypeTaskId);
        setModelKind(saved.modelKind);
        setRegenerations(saved.regenerations || 0);
        setConsent(true);
        setStep("preview");
      } catch {
        window.location.replace("/create");
        return;
      }
      setHydrated(true);
      return;
    }

    const selected = new URLSearchParams(window.location.search).get("style");
    if (isModelKind(selected)) setModelKind(selected);
  }, [initialView]);

  function storePreview(image: string, taskId: string, nextRegenerations = regenerations) {
    const payload: StoredPreview = { sourceImage: sourceImage || "", previewImage: image, prototypeTaskId: taskId, modelKind, regenerations: nextRegenerations };
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  }

  function completePreview(image: string, taskId: string, nextRegenerations = regenerations) {
    setPreviewImage(image);
    setPrototypeTaskId(taskId);
    setProgress(100);
    storePreview(image, taskId, nextRegenerations);
    if (window.location.pathname !== "/create/preview") {
      window.location.assign("/create/preview");
      return;
    }
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseModelKind(value: ModelKind) {
    setModelKind(value);
    setPreviewImage(null);
    setPrototypeTaskId(null);
    setRegenerations(0);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.set("style", value);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  async function acceptFile(file?: File) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError("Качи JPG, PNG или WEBP снимка.");
    if (file.size > MAX_FILE_BYTES) return setError("Снимката трябва да е до 8 MB.");
    const dataUri = await prepareImage(file);
    setSourceImage(dataUri);
    setPreviewImage(null);
    setPrototypeTaskId(null);
  }

  async function handleInput(event: ChangeEvent<HTMLInputElement>) { await acceptFile(event.target.files?.[0]); }
  async function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); await acceptFile(event.dataTransfer.files?.[0]); }

  async function generatePreview(isRegeneration = false) {
    if (!sourceImage) return setError("Първо качи снимка.");
    if (!consent) return setError("Потвърди, че имаш право да използваш снимката.");
    if (isRegeneration && regenerations >= MAX_REGENERATIONS) return setError("Използва двата допълнителни опита за тази снимка.");

    const nextRegenerations = isRegeneration ? regenerations + 1 : regenerations;
    if (isRegeneration) setRegenerations(nextRegenerations);
    setError(null);
    setStep("generating");
    setProgress(8);

    try {
      if (mockMode) {
        for (const p of [22, 43, 67, 84, 100]) { await sleep(260); setProgress(p); }
        completePreview(sourceImage, "mock-prototype-task", nextRegenerations);
        return;
      }

      const response = await fetch("/api/meshy/prototype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: sourceImage, modelKind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Не успяхме да стартираме генерацията.");

      setPrototypeTaskId(data.taskId);
      for (let attempt = 0; attempt < 90; attempt += 1) {
        await sleep(2000);
        const taskResponse = await fetch(`/api/meshy/task/prototype/${data.taskId}?modelKind=${modelKind}`, { cache: "no-store" });
        const task: PrototypeTask = await taskResponse.json();
        if (!taskResponse.ok) throw new Error(task.error || "Грешка при проверка на генерацията.");
        setProgress(Math.max(10, task.progress ?? 10));

        if (task.status === "SUCCEEDED") {
          const image = task.image_urls?.[0];
          if (!image) throw new Error("Meshy завърши, но не върна preview изображение.");
          completePreview(image, data.taskId, nextRegenerations);
          return;
        }
        if (["FAILED", "EXPIRED", "CANCELED"].includes(task.status || "")) throw new Error(task.task_error?.message || "Генерацията не успя. Опитай с друга снимка.");
      }
      throw new Error("Генерацията отне твърде дълго. Опитай отново.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка.");
      setStep(initialView === "preview" ? "preview" : "upload");
    }
  }

  async function goToCheckout() {
    if (!prototypeTaskId) return setError("Липсва одобрена визуализация.");
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shopify/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prototypeTaskId, size, modelKind, previewImage: mockMode ? previewImage : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Не успяхме да създадем checkout.");
      if (!data?.checkoutUrl) throw new Error("Shopify не върна checkout URL.");
      window.location.assign(data.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка при checkout.");
      setCheckoutLoading(false);
    }
  }

  function reset() {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    if (window.location.pathname === "/create/preview") {
      window.location.assign(`/create?style=${modelKind}`);
      return;
    }
    setStep("upload"); setSourceImage(null); setPreviewImage(null); setPrototypeTaskId(null); setProgress(0); setConsent(false); setRegenerations(0); setError(null); setCheckoutLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!hydrated) return <section className="builder-shell builder-loading"><div className="spinner" /></section>;

  return (
    <section className={`builder-shell builder-step-${step}`} id="create">
      <div className="builder-header">
        <p className="eyebrow">CUSTOM 3D COLLECTIBLE</p>
        <h2>{step === "preview" || step === "order" ? "Това е твоят POPME." : "Избери стил. Качи снимка."}</h2>
        <p className="subtle">{step === "preview" || step === "order" ? "Харесай визията, избери размер и поръчай." : "POP, MINI или BRICK — виждаш визуализацията преди плащане."}</p>
      </div>

      <div className="builder-card">
        <div className="steps" aria-label="Стъпки">
          <span className={step === "upload" ? "active" : "done"}>1. Снимка</span>
          <span className={step === "generating" || step === "preview" ? "active" : step === "order" ? "done" : ""}>2. Визуализация</span>
          <span className={step === "order" ? "active" : ""}>3. Размер + плащане</span>
        </div>

        {step === "upload" && (
          <div className="panel-grid">
            <div>
              <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}>
                <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} />
                {sourceImage ? <img className="source-preview" src={sourceImage} alt="Качена снимка" /> : <div className="dropzone-copy"><div className="upload-icon">+</div><strong>Качи снимка</strong><span>JPG, PNG или WEBP · до 8 MB</span></div>}
              </div>
              <p className="photo-tip">Най-добър резултат: цял ръст, добро осветление и видимо лице.</p>
            </div>

            <div className="control-panel">
              <div><p className="control-label">Стил</p><div className="size-options model-options">{MODEL_OPTIONS.map((option) => <button type="button" key={option.value} className={modelKind === option.value ? `size active model-${option.value}` : `size model-${option.value}`} onClick={() => chooseModelKind(option.value)}><strong>{option.name}</strong><span>{option.subtitle}</span></button>)}</div></div>
              <div><p className="control-label">Твоята версия</p><h3>{MODEL_COPY[modelKind].title}</h3><p>{MODEL_COPY[modelKind].text}</p></div>
              <div className="builder-price-note"><strong>От €49</strong><span>10 / 15 / 20 cm</span></div>
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Имам право да използвам тази снимка за създаване на персонализирана фигурка.</span></label>
              {error && <div className="error-box">{error}</div>}
              <button className="primary-button" disabled={!sourceImage || !consent} onClick={() => generatePreview()}>ГЕНЕРИРАЙ {modelKind.toUpperCase()} →</button>
            </div>
          </div>
        )}

        {step === "generating" && <div className="generating-panel"><div className="spinner" /><h3>Правим твоята {modelKind.toUpperCase()} фигурка…</h3><p>След малко ще те прехвърлим към визуализацията.</p><div className="progress-track"><div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} /></div><strong>{Math.round(progress)}%</strong></div>}

        {step === "preview" && previewImage && (
          <div className="panel-grid preview-grid dedicated-preview-grid">
            <div className="comparison"><div><span>Твоята снимка</span><img src={sourceImage || ""} alt="Оригинална снимка" /></div><div><span>{modelKind.toUpperCase()} визуализация</span><img src={previewImage} alt="AI визуализация на фигурка" /></div></div>
            <div className="control-panel"><div><p className="control-label">СТЪПКА 2</p><h3>Харесва ли ти?</h3><p>Това е одобрената визия, по която ще създадем 3D модела след плащане.</p><p className="preview-disclaimer">Фонът е илюстративен и не е част от крайния продукт.</p></div>{error && <div className="error-box">{error}</div>}<button className="primary-button" onClick={() => setStep("order")}>ДА, ИЗБИРАМ РАЗМЕР →</button><button className="secondary-button" onClick={() => generatePreview(true)} disabled={regenerations >= MAX_REGENERATIONS}>Генерирай отново ({MAX_REGENERATIONS - regenerations} останали)</button><button className="text-button" onClick={reset}>Качи друга снимка</button></div>
          </div>
        )}

        {step === "order" && (
          <div className="panel-grid order-grid">
            <div className="approved-card"><div className="approved-badge">{modelKind.toUpperCase()} · ОДОБРЕНО</div><img src={previewImage || sourceImage || ""} alt="Одобрена визуализация" /></div>
            <div className="control-panel"><div><p className="control-label">РАЗМЕР</p><div className="size-options">{[["10", "10 cm", "€49"], ["15", "15 cm", "€69"], ["20", "20 cm", "€89"]].map(([value, label, amount]) => <button type="button" key={value} className={size === value ? "size active" : "size"} onClick={() => setSize(value)}><strong>{label}</strong><span>{amount}</span></button>)}</div></div><div className="total-row"><span>Общо</span><strong>€{price}</strong></div>{error && <div className="error-box">{error}</div>}<button className="primary-button" disabled={checkoutLoading} onClick={goToCheckout}>{checkoutLoading ? "Отваряме плащането…" : "ПРОДЪЛЖИ КЪМ ПЛАЩАНЕ →"}</button><p className="security-note">Сигурно плащане през Shopify Checkout.</p><button className="text-button" onClick={() => setStep("preview")}>Назад към визуализацията</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
