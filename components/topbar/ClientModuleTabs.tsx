"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const MODULES = [
  { key: "brief",            label: "Brief" },
  { key: "strategy",         label: "Strategy" },
  { key: "creative-requests",label: "Creative" },
  { key: "financials",       label: "Financials" },
  { key: "email-flows",      label: "Emails" },
  { key: "attraction-matrix",label: "Attraction" },
  { key: "test-lab",         label: "Test Lab" },
  { key: "settings",         label: "⚙" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

export function ClientModuleTabs({ slug, clientStatus }: { slug: string; clientStatus: string }) {
  const t = useTranslations();
  const pathname = usePathname() ?? "";
  const currentModule = (pathname.split("/")[3] ?? "brief") as ModuleKey;

  return (
    <div className="module-tabs-scroll px-1">
      {MODULES.map(({ key, label }) => {
        const isActive = currentModule === key;
        const gated = key !== "brief" && key !== "settings" && clientStatus === "onboarding";
        return (
          <Link
            key={key}
            href={gated ? `/clients/${slug}/brief` : `/clients/${slug}/${key}`}
            aria-disabled={gated}
            title={gated ? t("onboarding.gated") : undefined}
            className={`module-tab ${isActive ? "module-tab-active" : ""} ${gated ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
