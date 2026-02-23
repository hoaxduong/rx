"use client"

import { ClipboardList } from "lucide-react"

export default function PrescriptionsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <h1 className="text-2xl font-bold">Quản lý đơn thuốc</h1>
        <p className="text-muted-foreground mt-2">
          Module đơn thuốc sẽ được triển khai trong giai đoạn tiếp theo
        </p>
      </div>
    </div>
  )
}
