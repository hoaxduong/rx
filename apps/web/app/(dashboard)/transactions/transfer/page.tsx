"use client"

import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

const transferSchema = z.object({
  targetCenterId: z.string().min(1, "Chọn cơ sở nhận"),
  notes: z.string().optional(),
  items: z.array(z.object({
    medicineId: z.string().min(1, "Chọn thuốc"),
    quantity: z.coerce.number().int().positive("SL phải > 0"),
  })).min(1),
})

type TransferForm = z.infer<typeof transferSchema>

export default function TransferPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentCenter, centers } = useCenter()

  const { register, control, handleSubmit, formState: { errors } } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { items: [{ medicineId: "", quantity: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const { data: medicines } = useQuery({
    queryKey: ["medicines-all"],
    queryFn: async () => {
      const res = await api.api.medicines.$get({ query: { limit: "500" } })
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      const res = await api.api.transactions.$post({
        json: {
          type: "outward_transfer",
          centerId: currentCenter!.id,
          targetCenterId: data.targetCenterId,
          notes: data.notes,
          items: data.items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
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
    return <div className="p-8 text-center text-muted-foreground">Vui lòng chọn cơ sở y tế trước</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Chuyển kho</h1>
          <p className="text-muted-foreground">Chuyển thuốc từ {currentCenter.name} sang cơ sở khác</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {mutation.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">Có lỗi xảy ra</div>
        )}

        <div className="rounded-lg border p-4 space-y-2">
          <label className="text-sm font-medium">Cơ sở nhận *</label>
          <select className={inputClass} {...register("targetCenterId")}>
            <option value="">Chọn cơ sở nhận...</option>
            {centers.filter(c => c.id !== currentCenter.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.targetCenterId && (
            <p className="text-destructive text-sm">{errors.targetCenterId.message}</p>
          )}
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Danh sách thuốc chuyển</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ medicineId: "", quantity: 0 })}>
              <Plus className="mr-1 h-3 w-3" /> Thêm dòng
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 border-b pb-4 last:border-0 md:grid-cols-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Thuốc *</label>
                <select className={inputClass} {...register(`items.${index}.medicineId`)}>
                  <option value="">Chọn thuốc...</option>
                  {medicines && "data" in medicines && medicines.data.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nameVi || m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Số lượng *</label>
                <input type="number" className={inputClass} {...register(`items.${index}.quantity`)} />
              </div>
              <div className="flex items-end">
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ghi chú</label>
          <textarea className={`${inputClass} h-20`} {...register("notes")} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Tạo phiếu chuyển"}
          </Button>
          <Link href="/transactions"><Button variant="outline">Hủy</Button></Link>
        </div>
      </form>
    </div>
  )
}
