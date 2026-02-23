"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { Plus, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

export default function TransactionsPage() {
  const { currentCenter } = useCenter()
  const t = useExtracted()
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)

  const typeLabels: Record<string, string> = {
    inward_supplier: t("Nhập NCC"),
    inward_transfer: t("Nhập chuyển kho"),
    inward_return: t("Nhập hoàn trả"),
    outward_prescription: t("Xuất theo đơn"),
    outward_transfer: t("Xuất chuyển kho"),
    outward_disposal: t("Xuất hủy"),
    adjustment_increase: t("Điều chỉnh tăng"),
    adjustment_decrease: t("Điều chỉnh giảm"),
  }

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", currentCenter?.id, typeFilter, page],
    queryFn: async () => {
      const res = await api.api.transactions.$get({
        query: {
          centerId: currentCenter?.id || "",
          type: typeFilter,
          page: String(page),
          limit: "20",
        },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  if (!currentCenter) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ArrowLeftRight className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">{t("Chọn cơ sở")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("Vui lòng chọn cơ sở y tế để xem giao dịch")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Giao dịch kho")}</h1>
          <p className="text-muted-foreground">
            {t("Lịch sử nhập - xuất - điều chỉnh tại {centerName}", { centerName: currentCenter.name })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/inward">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("Nhập kho")}
            </Button>
          </Link>
          <Link href="/transactions/outward">
            <Button variant="outline">{t("Xuất kho")}</Button>
          </Link>
          <Link href="/transactions/transfer">
            <Button variant="outline">{t("Chuyển kho")}</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="border-input bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="">{t("Tất cả loại")}</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Đang tải...")}
          </div>
        ) : data && "data" in data && data.data.length > 0 ? (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t("Mã GD")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Loại")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Ngày")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Người thực hiện")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("Tổng tiền")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Ghi chú")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((txn: any) => (
                    <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/transactions/${txn.id}`}
                          className="text-primary hover:underline"
                        >
                          {txn.transactionCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            txn.type.startsWith("inward")
                              ? "bg-green-100 text-green-700"
                              : txn.type.startsWith("outward")
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {typeLabels[txn.type] || txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(txn.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">{txn.performer?.name || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {txn.totalAmount
                          ? `${new Intl.NumberFormat("vi-VN").format(Number(txn.totalAmount))} ₫`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px]">
                        {txn.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-muted-foreground text-sm">
                {t("Tổng: {count} giao dịch", { count: String(data.total) })}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t("Trước")}
                </Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
                  {t("Sau")}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Chưa có giao dịch nào")}
          </div>
        )}
      </div>
    </div>
  )
}
