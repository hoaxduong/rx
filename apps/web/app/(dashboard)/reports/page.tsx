"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"]

export default function ReportsPage() {
  const { currentCenter } = useCenter()
  const t = useExtracted()
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const { data: consumption } = useQuery({
    queryKey: ["reports-consumption", currentCenter?.id, dateFrom, dateTo],
    queryFn: async () => {
      const res = await api.api.reports.consumption.$get({
        query: {
          centerId: currentCenter?.id || "",
          from: dateFrom,
          to: dateTo,
        },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const { data: expiryForecast } = useQuery({
    queryKey: ["reports-expiry", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.reports["expiry-forecast"].$get({
        query: { centerId: currentCenter?.id || "" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const { data: summary } = useQuery({
    queryKey: ["reports-summary", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.reports["inventory-summary"].$get({
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
          <BarChart3 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">{t("Chọn cơ sở")}</h2>
          <p className="text-muted-foreground mt-1">{t("Chọn cơ sở y tế để xem báo cáo")}</p>
        </div>
      </div>
    )
  }

  const inputClass = "border-input bg-background h-10 rounded-md border px-3 text-sm"

  const periodLabels: Record<string, string> = {
    expired: t("Đã hết hạn"),
    "30_days": t("30 ngày"),
    "60_days": t("60 ngày"),
    "90_days": t("90 ngày"),
  }

  const expiryChartData = Array.isArray(expiryForecast)
    ? expiryForecast.map((item: any) => ({
        name: periodLabels[item.period] || item.period,
        value: Number(item.totalQuantity || 0),
        batches: Number(item.batchCount || 0),
      }))
    : []

  const consumptionChartData = Array.isArray(consumption)
    ? consumption.slice(0, 10).map((item: any) => ({
        name: (item.medicineNameVi || item.medicineName || "").substring(0, 20),
        quantity: Number(item.totalQuantity || 0),
      }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Báo cáo & Thống kê")}</h1>
        <p className="text-muted-foreground">{t("Phân tích dữ liệu kho thuốc tại {centerName}", { centerName: currentCenter.name })}</p>
      </div>

      {/* Summary cards */}
      {Array.isArray(summary) && summary.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {summary.map((s: any, i: number) => (
            <div key={i} className="rounded-lg border p-4 space-y-1">
              <p className="text-sm text-muted-foreground">{t("Tổng mặt hàng")}</p>
              <p className="text-2xl font-bold">{s.totalMedicines}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{s.totalBatches} {t("lô")}</span>
                <span>{new Intl.NumberFormat("vi-VN").format(Number(s.totalValue || 0))} ₫</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expiry forecast pie chart */}
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">{t("Dự báo hết hạn")}</h2>
          {expiryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expiryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {expiryChartData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t("Không có dữ liệu hết hạn trong 90 ngày tới")}
            </div>
          )}
        </div>

        {/* Consumption bar chart */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Top thuốc tiêu thụ")}</h2>
            <div className="flex gap-2">
              <input type="date" className={inputClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" className={inputClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          {consumptionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionChartData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t("Không có dữ liệu tiêu thụ")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
