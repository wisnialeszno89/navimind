"use client";

import AppShell from "../components/AppShell";
import ContactForm from "../components/ContactForm";
import { useLanguage } from "../lib/useLanguage";

export const dynamic = "force-dynamic";

export default function KontaktPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <main className="min-h-screen flex items-center justify-center px-4">
        <ContactForm
          title={t("contactTitle")}
          subtitle={t("contactSubtitle")}
          namePlaceholder={t("contactName")}
          emailPlaceholder={t("contactEmail")}
          messagePlaceholder={t("contactMessage")}
          sendLabel={t("contactSend")}
          successMsg={t("contactSuccess")}
          errorMsg={t("contactError")}
          footerNote={t("contactFooter")}
        />
      </main>
    </AppShell>
  );
}