"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Step = "upload" | "generating" | "preview" | "order";

type PrototypeTask = {
  id?: string;
  status?: string;
  progress?: number;
  image_urls?: string[];
  task_error?: { message?: string } | null;
  error?: string;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REGENERATIONS = 2;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

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

export default function ToyBuilder() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>("upload");
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

  const mockMode = process.env.NEXT_PUBLIC_MOCK_AI === "true";

  const price = useMemo(() => {
    if (size === "10") return 49;
    if (size === "20") return 89;
    return 69;
  }, [size]);

  useEffect(() => {
    return () => {
      if (sourceImage?.startsWith("blob:")) URL.revokeObjectURL(sourceImage);
    };
  }, [sourceImage]);

  async function acceptFile(file?: File) {
    setError(null);
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Качи JPG, PNG или WEBP снимка.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("Снимката трябва да е до 8 MB.");
      return;
    }

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

    if (isRegeneration && regenerations >= MAX_REGENERATIONS) {
      return setError("Използва двата безплатни нови опита за тази снимка.");
    }

    if (isRegeneration) setRegenerations((count) => count + 1);
    setError(null);
    setStep("generating");
    setProgress(8);

    try {
      if (mockMode) {
        for (const p of [22, 43, 67, 84, 100]) {
          await sleep(260);
          setProgress(p);
        }
        // In mock mode we reuse the source photo only to exercise the product flow.
        setPreviewImage(sourceImage);
        setPrototypeTaskId("mock-prototype-task");
        setStep("preview");
        return;
      }

      const response = await fetch("/api/meshy/prototype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: sourceImage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Не успяхме да стартираме генерацията.");

      setPrototypeTaskId(data.taskId);

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await sleep(2000);
        const taskResponse = await fetch(`/api/meshy/task/prototype/${data.taskId}`, {
          cache: "no-store",
        });
        const task: PrototypeTask = await taskResponse.json();
        if (!taskResponse.ok) throw new Error(task.error || "Грешка при проверка на генерацията.");

        setProgress(Math.max(10, task.progress ?? 10));

        if (task.status === "SUCCEEDED") {
          const image = task.image_urls?.[0];
          if (!image) throw new Error("Meshy завърши, но не върна preview изображение.");
          setPreviewImage(image);
          setProgress(100);
          setStep("preview");
          return;
        }

        if (["FAILED", "EXPIRED"].includes(task.status || "")) {
          throw new Error(task.task_error?.message || "Генерацията не успя. Опитай с друга снимка.");
        }
      }

      throw new Error("Генерацията отне твърде дълго. Опитай отново.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка.");
      setStep("upload");
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
          // Used only in local mock-AI mode. Production derives preview from Meshy.
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

  return (
    <section className="builder-shell" id="create">
      <div className="builder-header">
        <p className="eyebrow">CUSTOM 3D FIGURE</p>
        <h2>Качи снимка. Виж фигурката си.</h2>
        <p className="subtle">Първо правим визуализация. 3D моделът се генерира чак след поръчка.</p>
      </div>

      <div className="builder-card">
        <div className="steps" aria-label="Стъпки">
          <span className={step === "upload" ? "active" : "done"}>1. Снимка</span>
          <span className={step === "generating" ? "active" : step === "preview" || step === "order" ? "done" : ""}>2. Визуализация</span>
          <span className={step === "order" ? "active" : ""}>3. Поръчка</span>
        </div>

        {step === "upload" && (
          <div className="panel-grid">
            <div>
              <div
                className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              >
                <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} />
                {sourceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="source-preview" src={sourceImage} alt="Качена снимка" />
                ) : (
                  <div className="dropzone-copy">
                    <div className="upload-icon">+</div>
                    <strong>Качи снимка</strong>
                    <span>JPG, PNG или WEBP · до 8 MB</span>
                  </div>
                )}
              </div>
              <p className="photo-tip">Най-добър резултат: човекът да се вижда цял, с добро осветление и без закрито лице.</p>
            </div>

            <div className="control-panel">
              <div>
                <p className="control-label">Какво ще направим</p>
                <h3>Колекционерска vinyl фигурка</h3>
                <p>Голяма глава, опростени форми и цветове, подходящи за последващ многоцветен 3D печат.</p>
              </div>

              <label className="consent-row">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>Имам право да използвам тази снимка за създаване на персонализирана фигурка.</span>
              </label>

              {error && <div className="error-box">{error}</div>}

              <button className="primary-button" disabled={!sourceImage || !consent} onClick={() => generatePreview()}>
                Генерирай визуализация
              </button>
              {mockMode && <p className="dev-note">DEV MODE: AI е симулиран и не харчи credits.</p>}
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="generating-panel">
            <div className="spinner" />
            <h3>Правим твоята фигурка…</h3>
            <p>Анализираме снимката и създаваме първата визуализация.</p>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
            <strong>{Math.round(progress)}%</strong>
          </div>
        )}

        {step === "preview" && previewImage && (
          <div className="panel-grid preview-grid">
            <div className="comparison">
              <div>
                <span>Твоята снимка</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceImage || ""} alt="Оригинална снимка" />
              </div>
              <div>
                <span>Визуализация</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImage} alt="AI визуализация на фигурка" />
              </div>
            </div>

            <div className="control-panel">
              <div>
                <p className="control-label">Харесва ли ти?</p>
                <h3>Това е визията за твоята фигурка.</h3>
                <p>След плащането от тази одобрена визуализация ще генерираме истинския 3D модел за производство.</p>
              </div>
              <button className="primary-button" onClick={() => setStep("order")}>Да, продължаваме</button>
              <button className="secondary-button" onClick={() => generatePreview(true)} disabled={regenerations >= MAX_REGENERATIONS}>Генерирай отново ({MAX_REGENERATIONS - regenerations} останали)</button>
              <button className="text-button" onClick={reset}>Качи друга снимка</button>
            </div>
          </div>
        )}

        {step === "order" && (
          <div className="panel-grid order-grid">
            <div className="approved-card">
              <div className="approved-badge">Одобрена визия</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage || sourceImage || ""} alt="Одобрена визуализация" />
              <small>Prototype: {prototypeTaskId}</small>
            </div>

            <div className="control-panel">
              <div>
                <p className="control-label">Размер</p>
                <div className="size-options">
                  {[
                    ["10", "10 cm", "€49"],
                    ["15", "15 cm", "€69"],
                    ["20", "20 cm", "€89"],
                  ].map(([value, label, amount]) => (
                    <button key={value} className={size === value ? "size active" : "size"} onClick={() => setSize(value)}>
                      <strong>{label}</strong><span>{amount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="total-row"><span>Общо</span><strong>€{price}</strong></div>
              {error && <div className="error-box">{error}</div>}
              <button className="primary-button" disabled={checkoutLoading} onClick={goToCheckout}>
                {checkoutLoading ? "Отваряме плащането…" : "Продължи към плащане"}
              </button>
              <p className="security-note">След плащането Shopify потвърждава поръчката, а 3D build се стартира автоматично на сървъра.</p>
              <button className="text-button" onClick={() => setStep("preview")}>Назад към визуализацията</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
