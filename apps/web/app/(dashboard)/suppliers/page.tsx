"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { Plus, Search, Truck } from "lucide-react"

export default function SuppliersPage() {
  const queryClient = useQueryClient()
  const t = useExtracted()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", code: "", contactPerson: "", phone: "", email: "", address: "", taxId: "", licenseNumber: "" })

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const res = await api.api.suppliers.$get({ query: { search } })
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.api.suppliers.$post({ json: formData })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      setShowForm(false)
      setFormData({ name: "", code: "", contactPerson: "", phone: "", email: "", address: "", taxId: "", licenseNumber: "" })
    },
  })

  const inputClass = "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Nhà cung cấp")}</h1>
          <p className="text-muted-foreground">{t("Quản lý nhà cung cấp dược phẩm")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> {t("Thêm NCC")}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t("Thêm nhà cung cấp mới")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Tên NCC")} *</label>
              <input className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Mã NCC")} *</label>
              <input className={inputClass} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Người liên hệ")}</label>
              <input className={inputClass} value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Điện thoại")}</label>
              <input className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Mã số thuế")}</label>
              <input className={inputClass} value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Số GDP")}</label>
              <input className={inputClass} value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Địa chỉ")}</label>
              <input className={inputClass} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.name || !formData.code}>
              {createMutation.isPending ? t("Đang lưu...") : t("Lưu")}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t("Hủy")}</Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          placeholder={t("Tìm nhà cung cấp...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} pl-10`}
        />
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t("Đang tải...")}</div>
        ) : Array.isArray(suppliers) && suppliers.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t("Mã")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Tên NCC")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Liên hệ")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("SĐT")}</th>
                  <th className="px-4 py-3 text-left font-medium">GDP</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.contactPerson || "-"}</td>
                    <td className="px-4 py-3">{s.phone || "-"}</td>
                    <td className="px-4 py-3">{s.licenseNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center p-12">
            <Truck className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">{t("Chưa có nhà cung cấp")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
