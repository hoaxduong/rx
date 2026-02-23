"use client"

import { useExtracted } from "next-intl"
import { ClipboardList } from "lucide-react"

export default function PrescriptionsPage() {
  const t = useExtracted()

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <h1 className="text-2xl font-bold">{t("Quản lý đơn thuốc")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("Module đơn thuốc sẽ được triển khai trong giai đoạn tiếp theo")}
        </p>
      </div>
    </div>
  )
}
