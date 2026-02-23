"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const medicineSchema = z.object({
  name: z.string().min(1, "Tên thuốc không được để trống"),
  nameVi: z.string().optional(),
  brandName: z.string().optional(),
  activeIngredient: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  unit: z.string().optional(),
  packagingSpec: z.string().optional(),
  registrationNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  storageCondition: z.string().optional(),
  isNarcotics: z.boolean().optional(),
  isPsychotropic: z.boolean().optional(),
  isPrescriptionOnly: z.boolean().optional(),
  isEssentialDrug: z.boolean().optional(),
  dinhMucBhyt: z.string().optional(),
  barcode: z.string().optional(),
  contraindications: z.string().optional(),
  sideEffects: z.string().optional(),
})

type MedicineForm = z.infer<typeof medicineSchema>

const dosageForms = [
  { value: "tablet", label: "Viên nén" },
  { value: "capsule", label: "Viên nang" },
  { value: "syrup", label: "Siro" },
  { value: "injection", label: "Tiêm" },
  { value: "cream", label: "Kem" },
  { value: "ointment", label: "Mỡ" },
  { value: "drops", label: "Nhỏ giọt" },
  { value: "powder", label: "Bột" },
  { value: "suspension", label: "Hỗn dịch" },
  { value: "solution", label: "Dung dịch" },
  { value: "suppository", label: "Đặt" },
  { value: "inhaler", label: "Hít" },
  { value: "patch", label: "Miếng dán" },
  { value: "gel", label: "Gel" },
  { value: "other", label: "Khác" },
]

const units = [
  { value: "tablet", label: "Viên" },
  { value: "capsule", label: "Viên nang" },
  { value: "bottle", label: "Chai" },
  { value: "ampoule", label: "Ống" },
  { value: "vial", label: "Lọ" },
  { value: "tube", label: "Tuýp" },
  { value: "sachet", label: "Gói" },
  { value: "box", label: "Hộp" },
  { value: "strip", label: "Vỉ" },
  { value: "ml", label: "ml" },
  { value: "g", label: "g" },
  { value: "mg", label: "mg" },
  { value: "piece", label: "Cái" },
  { value: "set", label: "Bộ" },
]

export default function NewMedicinePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicineForm>({
    resolver: zodResolver(medicineSchema),
  })

  const mutation = useMutation({
    mutationFn: async (data: MedicineForm) => {
      const res = await api.api.medicines.$post({ json: data as any })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] })
      router.push("/medicines")
    },
  })

  const inputClass =
    "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/medicines">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Thêm thuốc mới</h1>
          <p className="text-muted-foreground">Nhập thông tin thuốc</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        {mutation.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            Có lỗi xảy ra khi thêm thuốc
          </div>
        )}

        {/* Basic info */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Thông tin cơ bản</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên thuốc *</label>
              <input className={inputClass} {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên tiếng Việt</label>
              <input className={inputClass} {...register("nameVi")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên thương mại</label>
              <input className={inputClass} {...register("brandName")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hoạt chất</label>
              <input className={inputClass} {...register("activeIngredient")} />
            </div>
          </div>
        </div>

        {/* Formulation */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Bào chế & Đóng gói</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dạng bào chế</label>
              <select className={inputClass} {...register("dosageForm")}>
                <option value="">Chọn...</option>
                {dosageForms.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hàm lượng</label>
              <input className={inputClass} placeholder="500mg" {...register("strength")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Đơn vị tính</label>
              <select className={inputClass} {...register("unit")}>
                <option value="">Chọn...</option>
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quy cách đóng gói</label>
            <input
              className={inputClass}
              placeholder="Hộp 10 vỉ x 10 viên"
              {...register("packagingSpec")}
            />
          </div>
        </div>

        {/* Manufacturing */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Sản xuất & Đăng ký</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nhà sản xuất</label>
              <input className={inputClass} {...register("manufacturer")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nước sản xuất</label>
              <input className={inputClass} {...register("countryOfOrigin")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số đăng ký</label>
              <input className={inputClass} {...register("registrationNumber")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mã vạch</label>
              <input className={inputClass} {...register("barcode")} />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Phân loại quản lý</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isNarcotics")} />
              <span className="text-sm">Thuốc gây nghiện</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isPsychotropic")} />
              <span className="text-sm">Thuốc hướng thần</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isPrescriptionOnly")} />
              <span className="text-sm">Thuốc kê đơn</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isEssentialDrug")} />
              <span className="text-sm">Thuốc thiết yếu</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mã BHYT (Định mức)</label>
            <input className={inputClass} {...register("dinhMucBhyt")} />
          </div>
        </div>

        {/* Safety info */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Thông tin an toàn</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Chống chỉ định</label>
            <textarea
              className={`${inputClass} h-20`}
              {...register("contraindications")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tác dụng phụ</label>
            <textarea
              className={`${inputClass} h-20`}
              {...register("sideEffects")}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu thuốc"}
          </Button>
          <Link href="/medicines">
            <Button variant="outline">Hủy</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
