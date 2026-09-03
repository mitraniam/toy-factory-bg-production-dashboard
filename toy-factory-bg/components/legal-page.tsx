import type { ReactNode } from "react";
import { MERCHANT } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="pmv2-site">
      <article className="pmv2-legal">
        <a className="pmv2-legal-back" href="/">← {MERCHANT.brand}</a>
        <h1>{title}</h1>
        <p className="pmv2-legal-meta">Последна промяна: {MERCHANT.updatedAt}</p>
        {children}
      </article>
    </main>
  );
}

export function MerchantBlock() {
  return (
    <ul>
      <li><strong>Търговец:</strong> {MERCHANT.legalName}, ЕИК {MERCHANT.eik}</li>
      <li><strong>ДДС номер:</strong> {MERCHANT.vatNumber}</li>
      <li><strong>Адрес на управление:</strong> {MERCHANT.address}</li>
      <li><strong>Имейл:</strong> {MERCHANT.email}</li>
      <li><strong>Телефон:</strong> {MERCHANT.phone}</li>
      <li><strong>Търговска марка:</strong> {MERCHANT.brand}</li>
    </ul>
  );
}
