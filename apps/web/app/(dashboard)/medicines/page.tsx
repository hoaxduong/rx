"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { Plus, Search, Pill } from "lucide-react"
import Link from "next/link"

export default function MedicinesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const t = useExtracted()

  const { data, isLoading } = useQuery({
    queryKey: ["medicines", search, page],
    queryFn: async () => {
      const res = await api.api.medicines.$get({
        query: { search, page: String(page), limit: "20" },
      })
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Danh mục thuốc")}</h1>
          <p className="text-muted-foreground">
            {t("Quản lý danh mục thuốc và vật tư y tế")}
          </p>
        </div>
        <Link href="/medicines/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("Thêm thuốc")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            placeholder={t("Tìm theo tên, hoạt chất, mã vạch...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border py-2 pl-10 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* Medicine list */}
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
                    <th className="px-4 py-3 text-left font-medium">{t("Tên thuốc")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Hoạt chất")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Dạng bào chế")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Hàm lượng")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Nhà SX")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Phân loại")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((med: any) => (
                    <tr key={med.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/medicines/${med.id}`}
                          className="text-primary hover:underline"
                        >
                          <div>{med.nameVi || med.name}</div>
                          {med.brandName && (
                            <div className="text-muted-foreground text-xs">
                              {med.brandName}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{med.activeIngredient || "-"}</td>
                      <td className="px-4 py-3">{med.dosageForm || "-"}</td>
                      <td className="px-4 py-3">{med.strength || "-"}</td>
                      <td className="px-4 py-3">{med.manufacturer || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {med.isNarcotics && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                              {t("Ma túy")}
                            </span>
                          )}
                          {med.isPsychotropic && (
                            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                              {t("Hướng thần")}
                            </span>
                          )}
                          {med.isPrescriptionOnly && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                              {t("Kê đơn")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-muted-foreground text-sm">
                {t("Tổng: {count} thuốc", { count: String(data.total) })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t("Trước")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * Number(data.limit) >= data.total}
                  onClick={() => setPage(page + 1)}
                >
                  {t("Sau")}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center p-12">
            <Pill className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">{t("Chưa có thuốc nào")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
