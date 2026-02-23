"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { Settings } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const { currentCenter } = useCenter()
  const queryClient = useQueryClient()
  const t = useExtracted()

  const { data: thresholds } = useQuery({
    queryKey: ["thresholds", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.inventory.thresholds.$get({
        query: { centerId: currentCenter?.id || "" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Cài đặt")}</h1>
        <p className="text-muted-foreground">{t("Cấu hình hệ thống và ngưỡng tồn kho")}</p>
      </div>

      {currentCenter ? (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">{t("Thông tin cơ sở:")} {currentCenter.name}</h2>
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("Mã cơ sở")}</dt>
                <dd className="font-medium">{currentCenter.code}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("Loại")}</dt>
                <dd className="font-medium">{currentCenter.type === "commune" ? t("Trạm y tế xã") : t("Trạm y tế vệ tinh")}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">{t("Ngưỡng tồn kho")}</h2>
            {Array.isArray(thresholds) && thresholds.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">{t("Thuốc")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Tối thiểu")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Tối đa")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Đặt lại")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Cảnh báo HSD (ngày)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((th: any) => (
                      <tr key={th.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{th.medicine?.nameVi || th.medicine?.name || th.medicineId}</td>
                        <td className="px-4 py-3 text-right">{th.minimumQuantity}</td>
                        <td className="px-4 py-3 text-right">{th.maximumQuantity || "-"}</td>
                        <td className="px-4 py-3 text-right">{th.reorderQuantity || "-"}</td>
                        <td className="px-4 py-3 text-right">{th.expiryWarningDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("Chưa cấu hình ngưỡng tồn kho")}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Settings className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">{t("Chọn cơ sở y tế để cấu hình")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
