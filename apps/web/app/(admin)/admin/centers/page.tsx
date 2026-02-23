"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Plus, Search, Building, MapPin } from "lucide-react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type Center = {
  id: string
  name: string
  code: string
  type: "commune" | "satellite"
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string }[]
}

export default function AdminCentersPage() {
  const queryClient = useQueryClient()
  const t = useExtracted()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "centers", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", "100")
      const res = await fetch(`${apiUrl}/api/admin/centers?${params}`, { credentials: "include" })
      return res.json() as Promise<{ items: Center[]; total: number }>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiUrl}/api/admin/centers/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "centers"] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Quản lý cơ sở y tế")}</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null) }}>
          <Plus className="mr-1 h-4 w-4" />
          {t("Thêm cơ sở")}
        </Button>
      </div>

      {showForm && (
        <CenterForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          onSuccess={() => {
            setShowForm(false)
            setEditingId(null)
            queryClient.invalidateQueries({ queryKey: ["admin", "centers"] })
          }}
          centers={data?.items || []}
        />
      )}

      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("Tìm kiếm cơ sở...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background h-9 w-full rounded-md border pl-9 pr-3 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">{t("Đang tải...")}</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">{t("Mã")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("Tên cơ sở")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("Loại")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("Trực thuộc")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("Trạng thái")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Thao tác")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((center) => (
                <tr key={center.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{center.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building className="text-muted-foreground h-4 w-4" />
                      <div>
                        <div className="font-medium">{center.name}</div>
                        {center.address && (
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {center.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      center.type === "commune"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {center.type === "commune" ? t("Xã") : t("Trạm")}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {center.parent?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      center.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {center.isActive ? t("Hoạt động") : t("Ngưng")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingId(center.id); setShowForm(true) }}
                      >
                        {t("Sửa")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(t('Ngưng hoạt động cơ sở "{centerName}"?', { centerName: center.name }))) {
                            deleteMutation.mutate(center.id)
                          }
                        }}
                      >
                        {t("Ngưng")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                    {t("Chưa có cơ sở nào")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CenterForm({
  editingId,
  onClose,
  onSuccess,
  centers,
}: {
  editingId: string | null
  onClose: () => void
  onSuccess: () => void
  centers: Center[]
}) {
  const t = useExtracted()
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "commune" as "commune" | "satellite",
    parentId: "",
    address: "",
    phone: "",
    email: "",
    licenseNumber: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load existing data when editing
  useState(() => {
    if (editingId) {
      const center = centers.find((c) => c.id === editingId)
      if (center) {
        setForm({
          name: center.name,
          code: center.code,
          type: center.type,
          parentId: center.parent?.id || "",
          address: center.address || "",
          phone: center.phone || "",
          email: center.email || "",
          licenseNumber: "",
        })
      }
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body: Record<string, any> = { ...form }
    if (!body.parentId) delete body.parentId
    if (!body.email) delete body.email

    try {
      const url = editingId
        ? `${apiUrl}/api/admin/centers/${editingId}`
        : `${apiUrl}/api/admin/centers`
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("Lỗi khi lưu"))
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-4">
      <h2 className="font-medium">{editingId ? t("Cập nhật cơ sở") : t("Thêm cơ sở mới")}</h2>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-sm font-medium">{t("Tên cơ sở")} *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Mã cơ sở")} *</label>
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Loại")}</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="commune">{t("Xã")}</option>
            <option value="satellite">{t("Trạm vệ tinh")}</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t("Trực thuộc")}</label>
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">{t("Không")}</option>
            {centers
              .filter((c) => c.id !== editingId && c.type === "commune")
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t("Địa chỉ")}</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Số điện thoại")}</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Số giấy phép")}</label>
          <input
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("Đang lưu...") : editingId ? t("Cập nhật") : t("Tạo mới")}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("Hủy")}
        </Button>
      </div>
    </form>
  )
}
