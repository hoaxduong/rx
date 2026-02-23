"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

export default function InwardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentCenter } = useCenter()
  const t = useExtracted()

  const inwardSchema = z.object({
    supplierId: z.string().min(1, t("Chọn nhà cung cấp")),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          medicineId: z.string().min(1, t("Chọn thuốc")),
          batchNumber: z.string().min(1, t("Nhập số lô")),
          expiryDate: z.string().min(1, t("Nhập HSD")),
          quantity: z.coerce.number().int().positive(t("SL phải > 0")),
          unitPrice: z.string().optional(),
        })
      )
      .min(1, t("Cần ít nhất 1 dòng")),
  })

  type InwardForm = z.infer<typeof inwardSchema>

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InwardForm>({
    resolver: zodResolver(inwardSchema),
    defaultValues: {
      items: [{ medicineId: "", batchNumber: "", expiryDate: "", quantity: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await api.api.suppliers.$get({ query: {} })
      return res.json()
    },
  })

  const { data: medicines } = useQuery({
    queryKey: ["medicines-all"],
    queryFn: async () => {
      const res = await api.api.medicines.$get({ query: { limit: "500" } })
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: InwardForm) => {
      const res = await api.api.transactions.$post({
        json: {
          type: "inward_supplier",
          centerId: currentCenter!.id,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          notes: data.notes,
          items: data.items.map((item) => ({
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      router.push("/transactions")
    },
  })

  const inputClass =
    "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"

  if (!currentCenter) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t("Vui lòng chọn cơ sở y tế trước")}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("Nhập kho")}</h1>
          <p className="text-muted-foreground">
            {t("Nhập thuốc từ nhà cung cấp vào {centerName}", { centerName: currentCenter.name })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {mutation.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {t("Có lỗi xảy ra khi tạo phiếu nhập")}
          </div>
        )}

        {/* Supplier & Invoice */}
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("Nhà cung cấp")} *</label>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Chọn NCC...")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(suppliers) &&
                      suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplierId && (
              <p className="text-destructive text-sm">{errors.supplierId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("Số hóa đơn")}</label>
            <input className={inputClass} {...register("invoiceNumber")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("Ngày hóa đơn")}</label>
            <input type="date" className={inputClass} {...register("invoiceDate")} />
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Danh sách thuốc nhập")}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ medicineId: "", batchNumber: "", expiryDate: "", quantity: 0 })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              {t("Thêm dòng")}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 border-b pb-4 last:border-0 md:grid-cols-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">{t("Thuốc")} *</label>
                <Controller
                  name={`items.${index}.medicineId`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Chọn thuốc...")} />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines &&
                          "data" in medicines &&
                          medicines.data.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nameVi || m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("Số lô")} *</label>
                <input className={inputClass} {...register(`items.${index}.batchNumber`)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("HSD")} *</label>
                <input type="date" className={inputClass} {...register(`items.${index}.expiryDate`)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("Số lượng")} *</label>
                <input type="number" className={inputClass} {...register(`items.${index}.quantity`)} />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">{t("Đơn giá")}</label>
                  <input type="number" className={inputClass} {...register(`items.${index}.unitPrice`)} />
                </div>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {errors.items && (
            <p className="text-destructive text-sm">
              {typeof errors.items.message === "string" ? errors.items.message : t("Kiểm tra lại thông tin")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Ghi chú")}</label>
          <textarea className={`${inputClass} h-20`} {...register("notes")} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t("Đang lưu...") : t("Tạo phiếu nhập")}
          </Button>
          <Link href="/transactions">
            <Button variant="outline">{t("Hủy")}</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
