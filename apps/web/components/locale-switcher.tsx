"use client"

import { useLocale } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

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
    <Select value={locale} onValueChange={switchLocale}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
