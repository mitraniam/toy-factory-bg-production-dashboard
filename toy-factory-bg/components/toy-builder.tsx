"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Step = "upload" | "generating" | "preview";
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

const MODEL_OPTIONS: Array<{
  value: ModelKind;
  name: string;
  subtitle: string;
  image: string;
  copy: string;
}> = [
  { value: "pop", name: "POP", subtitle: "Vinyl", image: "/marketing/pop.svg", copy: "Vinyl визия с по-голяма глава и опростени форми." },
  { value: "mini", name: "MINI", subtitle: "Chibi", image: "/marketing/mini.svg", copy: "Chibi визия с по-мек силует и повече характер." },
  { value: "brick", name: "BRICK", subtitle: "Brick", image: "/marketing/brick.svg", copy: "Геометрична brick-style версия, създадена по твоята снимка." },
];

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
  const selectedModel = MODEL_OPTIONS.find((item) => item.value === modelKind) || MODEL_OPTIONS[0];
  const attemptsLeft = Math.max(0, MAX_REGENERATIONS - regenerations);

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
    const payload: StoredPreview = {
      sourceImage: sourceImage || "",
      previewImage: image,
      prototypeTaskId: taskId,
      modelKind,
      regenerations: nextRegenerations,
    };
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

  async function handleInput(event: ChangeEvent<HTMLInputElement>) {
    await acceptFile(event.target.files?.[0]);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    await acceptFile(event.dataTransfer.files?.[0]);
  }

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
        for (const p of [22, 43, 67, 84, 100]) {
          await sleep(260);
          setProgress(p);
        }
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
        if (["FAILED", "EXPIRED", "CANCELED"].includes(task.status || "")) {
          throw new Error(task.task_error?.message || "Генерацията не успя. Опитай с друга снимка.");
        }
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
        body: JSON.stringify({
          prototypeTaskId,
          size,
          modelKind,
          previewImage: mockMode ? previewImage : undefined,
        }),
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
    setStep("upload");
    setSourceImage(null);
    setPreviewImage(null);
    setPrototypeTaskId(null);
    setProgress(0);
    setConsent(false);
    setRegenerations(0);
    setError(null);
    setCheckoutLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!hydrated) {
    return <section className="pmv2-builder-loading"><div className="pmv2-spinner" /><p>Зареждаме твоя POPME…</p></section>;
  }

  if (step === "generating") {
    return (
      <section className="pmv2-builder pmv2-generating">
        <div className="pmv2-progress-copy">
          <div className="pmv2-steps-mini"><b>1 СТИЛ</b><span>—</span><b>2 СНИМКА</b><span>—</span><strong>3 PREVIEW</strong></div>
          <p>СЪЗДАВАМЕ ТВОЯ {modelKind.toUpperCase()}</p>
          <h1>Малко магия.<br /><span>После си ти.</span></h1>
          <div className="pmv2-progress-track"><i style={{ width: `${Math.max(8, Math.min(progress, 100))}%` }} /></div>
          <div className="pmv2-progress-meta"><span>Генериране</span><strong>{Math.round(progress)}%</strong></div>
          <p className="pmv2-progress-note">Остани на тази страница. Ще те прехвърлим автоматично към визуализацията.</p>
          {error && <div className="pmv2-error">{error}</div>}
        </div>
        <div className={`pmv2-generating-figure ${modelKind}`}>
          <img src={selectedModel.image} alt={`${selectedModel.name} стил`} />
          <span>{selectedModel.name}</span>
        </div>
      </section>
    );
  }

  if (step === "preview" && previewImage) {
    return (
      <section className="pmv2-preview-builder">
        <div className="pmv2-preview-visual-wrap">
          <div className="pmv2-preview-visual">
            <span className="pmv2-preview-style">{modelKind.toUpperCase()}</span>
            <img src={previewImage} alt={`Твоята ${modelKind.toUpperCase()} POPME визуализация`} />
          </div>
          <div className="pmv2-preview-source-row">
            {sourceImage && <img src={sourceImage} alt="Оригиналната качена снимка" />}
            <p>Фонът е илюстративен и не е част от крайния 3D продукт.</p>
          </div>
        </div>

        <div className="pmv2-preview-controls">
          <p className="pmv2-builder-kicker">ТВОЯТ РЕЗУЛТАТ</p>
          <h1>Това е<br /><span>твоят POPME.</span></h1>
          <div className="pmv2-selected-style-line"><span>Стил</span><strong>{modelKind.toUpperCase()}</strong></div>

          <div className="pmv2-size-selector">
            <p>ИЗБЕРИ РАЗМЕР</p>
            <div>
              {[{ value: "10", price: 49 }, { value: "15", price: 69 }, { value: "20", price: 89 }].map((option) => (
                <button key={option.value} type="button" className={size === option.value ? "active" : ""} onClick={() => setSize(option.value)}>
                  <strong>{option.value} cm</strong><span>€{option.price}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="pmv2-preview-benefits">
            <li><span>✓</span>3D производството стартира след плащане</li>
            <li><span>✓</span>Сигурно плащане през Shopify</li>
          </ul>

          {error && <div className="pmv2-error">{error}</div>}
          <button type="button" className="pmv2-regenerate" onClick={() => generatePreview(true)} disabled={attemptsLeft <= 0}>
            {attemptsLeft > 0 ? `Генерирай отново (${attemptsLeft} останали)` : "Няма останали нови опити"}
          </button>
          <button type="button" className="pmv2-reset-link" onClick={reset}>Качи друга снимка</button>
        </div>

        <div className="pmv2-preview-checkout-bar">
          <div><span>{modelKind.toUpperCase()} · {size} CM</span><strong>€{price}</strong></div>
          <button type="button" onClick={goToCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? "ОТВАРЯМЕ CHECKOUT…" : "ПОРЪЧАЙ МОЯТА ФИГУРКА →"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="pmv2-builder">
      <div className="pmv2-builder-steps"><strong>1 СТИЛ</strong><span>—</span><strong>2 СНИМКА</strong><span>—</span><b>3 PREVIEW</b></div>
      <h1>Избери стил.<br /><span>Качи снимка.</span></h1>

      <div className="pmv2-builder-grid">
        <div className="pmv2-style-picker">
          <p className="pmv2-builder-kicker">СТЪПКА 1 · СТИЛ</p>
          <div className="pmv2-style-picker-rail">
            {MODEL_OPTIONS.map((option) => (
              <button key={option.value} type="button" className={`${option.value} ${modelKind === option.value ? "active" : ""}`} onClick={() => chooseModelKind(option.value)}>
                <div><img src={option.image} alt={`${option.name} стил`} /></div>
                <strong>{option.name}</strong>
                <span>{option.subtitle}</span>
              </button>
            ))}
          </div>
          <div className="pmv2-style-description">
            <p>ИЗБРАН СТИЛ</p>
            <strong>{selectedModel.name}</strong>
            <span>{selectedModel.copy}</span>
          </div>
          <label className="pmv2-consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>Имам право да използвам тази снимка за създаване на персонализирана фигурка.</span>
          </label>
        </div>

        <div className="pmv2-upload-panel">
          <p className="pmv2-builder-kicker">СТЪПКА 2 · СНИМКА</p>
          <div
            className={`pmv2-dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
          >
            <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} />
            {sourceImage ? (
              <img src={sourceImage} alt="Качена снимка" />
            ) : (
              <div className="pmv2-dropzone-copy">
                <span>+</span>
                <strong>Качи снимка</strong>
                <small>JPG, PNG или WEBP · до 8 MB</small>
              </div>
            )}
          </div>
          <p className="pmv2-photo-tip">Най-добър резултат: цял ръст, добро осветление и видимо лице.</p>
          {error && <div className="pmv2-error">{error}</div>}
        </div>
      </div>

      <div className="pmv2-generate-bar">
        <div><span>СТИЛ</span><strong>{modelKind.toUpperCase()}</strong><small> · цени от €49</small></div>
        <button type="button" onClick={() => generatePreview(false)}>ГЕНЕРИРАЙ МОЯТА {modelKind.toUpperCase()} →</button>
      </div>
    </section>
  );
}
