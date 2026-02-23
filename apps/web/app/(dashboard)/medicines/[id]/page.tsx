"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft, Edit, Package } from "lucide-react"
import Link from "next/link"

export default function MedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { currentCenter } = useCenter()
  const t = useExtracted()

  const { data: medicine, isLoading } = useQuery({
    queryKey: ["medicine", id],
    queryFn: async () => {
      const res = await api.api.medicines[":id"].$get({ param: { id } })
      return res.json()
    },
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const { data: stock } = useQuery({
    queryKey: ["medicine-stock", id, currentCenter?.id],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/medicines/${id}/stock?centerId=${currentCenter?.id}`, { credentials: "include" })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const { data: stockCard } = useQuery({
    queryKey: ["medicine-stock-card", id, currentCenter?.id],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/medicines/${id}/stock-card?centerId=${currentCenter?.id}`, { credentials: "include" })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t("Đang tải...")}</div>
  }

  if (!medicine || "error" in medicine) {
    return <div className="p-8 text-center text-muted-foreground">{t("Không tìm thấy thuốc")}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medicines">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{medicine.nameVi || medicine.name}</h1>
            {medicine.brandName && (
              <p className="text-muted-foreground">{medicine.brandName}</p>
            )}
          </div>
        </div>
        <Link href={`/medicines/${id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            {t("Chỉnh sửa")}
          </Button>
        </Link>
      </div>

      {/* Medicine details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t("Thông tin thuốc")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Hoạt chất")}</dt>
              <dd>{medicine.activeIngredient || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Dạng bào chế")}</dt>
              <dd>{medicine.dosageForm || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Hàm lượng")}</dt>
              <dd>{medicine.strength || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Nhà sản xuất")}</dt>
              <dd>{medicine.manufacturer || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Nước SX")}</dt>
              <dd>{medicine.countryOfOrigin || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Số đăng ký")}</dt>
              <dd>{medicine.registrationNumber || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Mã BHYT")}</dt>
              <dd>{medicine.dinhMucBhyt || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t("Phân loại & Bảo quản")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Bảo quản")}</dt>
              <dd>{medicine.storageCondition || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Gây nghiện")}</dt>
              <dd>{medicine.isNarcotics ? t("Có") : t("Không")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Hướng thần")}</dt>
              <dd>{medicine.isPsychotropic ? t("Có") : t("Không")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Kê đơn")}</dt>
              <dd>{medicine.isPrescriptionOnly ? t("Có") : t("Không")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("Thiết yếu")}</dt>
              <dd>{medicine.isEssentialDrug ? t("Có") : t("Không")}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stock by batch */}
      {currentCenter && (
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              {t("Tồn kho tại {centerName}", { centerName: currentCenter.name })}
            </h2>
          </div>
          {Array.isArray(stock) && stock.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t("Số lô")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("HSD")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("Số lượng")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("Đơn giá")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((batch: any) => (
                    <tr key={batch.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{batch.batchNumber}</td>
                      <td className="px-4 py-3">{batch.expiryDate}</td>
                      <td className="px-4 py-3 text-right">{batch.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {batch.unitPrice
                          ? `${new Intl.NumberFormat("vi-VN").format(Number(batch.unitPrice))} ₫`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("Không có tồn kho")}
            </div>
          )}
        </div>
      )}

      {/* Stock card */}
      {currentCenter && Array.isArray(stockCard) && stockCard.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">{t("Thẻ kho")}</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t("Ngày")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Mã GD")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Loại")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Số lô")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("SL")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("Tồn trước")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("Tồn sau")}</th>
                </tr>
              </thead>
              <tbody>
                {stockCard.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/transactions/${item.transactionId}`}
                        className="text-primary hover:underline"
                      >
                        {item.transactionCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{item.transactionType}</td>
                    <td className="px-4 py-3">{item.batchNumber || "-"}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{item.stockBefore}</td>
                    <td className="px-4 py-3 text-right">{item.stockAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
