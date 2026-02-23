"use client"

import { useLocale } from "next-intl"

const locales = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
]

export function LocaleSwitcher() {
  const locale = useLocale()

  function switchLocale(newLocale: string) {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="border-input bg-background h-8 rounded-md border px-2 text-sm"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
