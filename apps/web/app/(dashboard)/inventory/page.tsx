"use client"

import { useQuery } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { useCenter } from "@/components/center-context"
import { api } from "@/lib/api"
import { Package, AlertTriangle, Clock, TrendingDown } from "lucide-react"
import Link from "next/link"

export default function InventoryPage() {
  const { currentCenter } = useCenter()
  const t = useExtracted()

  const { data: stock, isLoading } = useQuery({
    queryKey: ["inventory", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.inventory.$get({
        query: { centerId: currentCenter?.id || "" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const { data: expiring } = useQuery({
    queryKey: ["inventory-expiring", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.inventory.expiring.$get({
        query: { centerId: currentCenter?.id || "", days: "90" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const { data: lowStock } = useQuery({
    queryKey: ["inventory-low-stock", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.inventory["low-stock"].$get({
        query: { centerId: currentCenter?.id || "" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  if (!currentCenter) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">{t("Chọn cơ sở")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("Vui lòng chọn cơ sở y tế ở thanh trên để xem kho thuốc")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Kho thuốc")}</h1>
        <p className="text-muted-foreground">
          {t("Quản lý tồn kho tại {centerName}", { centerName: currentCenter.name })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Package className="text-primary h-5 w-5" />
            <span className="text-sm font-medium">{t("Tổng mặt hàng")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {Array.isArray(stock) ? stock.length : 0}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">{t("Sắp hết hạn")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-500">
            {Array.isArray(expiring) ? expiring.length : 0}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">{t("Dưới mức tồn kho")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-500">
            {Array.isArray(lowStock) ? lowStock.length : 0}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-muted-foreground h-5 w-5" />
            <span className="text-sm font-medium">{t("Tổng giá trị")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {Array.isArray(stock)
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  stock.reduce(
                    (sum: number, s: any) => sum + Number(s.totalValue || 0),
                    0
                  )
                )
              : "0 ₫"}
          </p>
        </div>
      </div>

      {/* Stock list */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-semibold">{t("Danh sách tồn kho")}</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Đang tải...")}
          </div>
        ) : Array.isArray(stock) && stock.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t("Mã thuốc")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Tổng SL")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Số lô")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("HSD gần nhất")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("Giá trị")}</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/medicines/${item.medicineId}`}
                        className="text-primary hover:underline"
                      >
                        {item.medicineId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3">{item.totalQuantity}</td>
                    <td className="px-4 py-3">{item.batchCount}</td>
                    <td className="px-4 py-3">{item.earliestExpiry}</td>
                    <td className="px-4 py-3 text-right">
                      {new Intl.NumberFormat("vi-VN").format(
                        Number(item.totalValue || 0)
                      )}{" "}
                      ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Chưa có dữ liệu tồn kho")}
          </div>
        )}
      </div>
    </div>
  )
}
