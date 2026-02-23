"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Plus, Search, Building, MapPin, Pencil, Archive } from "lucide-react"

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useExtracted()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCenter, setEditingCenter] = useState<Center | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Center | null>(null)

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

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiUrl}/api/admin/centers/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] })
      setArchiveTarget(null)
    },
  })

  function openAdd() {
    setEditingCenter(null)
    setDialogOpen(true)
  }

  function openEdit(center: Center) {
    setEditingCenter(center)
    setDialogOpen(true)
  }

  function handleFormSuccess() {
    setDialogOpen(false)
    setEditingCenter(null)
    queryClient.invalidateQueries({ queryKey: ["admin", "centers"] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Quản lý cơ sở y tế")}</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          {t("Thêm cơ sở")}
        </Button>
      </div>

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
                <tr key={center.id} className="cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/30" onClick={() => router.push(`/admin/centers/${center.id}`)}>
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
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(center)}
                        title={t("Sửa")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {center.isActive && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setArchiveTarget(center)}
                          title={t("Ngưng hoạt động")}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setEditingCenter(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? t("Cập nhật cơ sở") : t("Thêm cơ sở mới")}
            </DialogTitle>
            <DialogDescription>
              {editingCenter
                ? t("Chỉnh sửa thông tin cơ sở y tế")
                : t("Nhập thông tin cơ sở y tế mới")}
            </DialogDescription>
          </DialogHeader>
          <CenterForm
            editingCenter={editingCenter}
            onSuccess={handleFormSuccess}
            onCancel={() => { setDialogOpen(false); setEditingCenter(null) }}
            centers={data?.items || []}
          />
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => {
        if (!open) setArchiveTarget(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ngưng hoạt động cơ sở")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Bạn có chắc muốn ngưng hoạt động cơ sở "{centerName}"? Cơ sở sẽ không còn hiển thị cho người dùng.', {
                centerName: archiveTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Hủy")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveMutation.isPending ? t("Đang xử lý...") : t("Ngưng hoạt động")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CenterForm({
  editingCenter,
  onSuccess,
  onCancel,
  centers,
}: {
  editingCenter: Center | null
  onSuccess: () => void
  onCancel: () => void
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

  useEffect(() => {
    if (editingCenter) {
      setForm({
        name: editingCenter.name,
        code: editingCenter.code,
        type: editingCenter.type,
        parentId: editingCenter.parent?.id || "",
        address: editingCenter.address || "",
        phone: editingCenter.phone || "",
        email: editingCenter.email || "",
        licenseNumber: "",
      })
    } else {
      setForm({
        name: "",
        code: "",
        type: "commune",
        parentId: "",
        address: "",
        phone: "",
        email: "",
        licenseNumber: "",
      })
    }
  }, [editingCenter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body: Record<string, any> = { ...form }
    if (!body.parentId) delete body.parentId
    if (!body.email) delete body.email

    try {
      const url = editingCenter
        ? `${apiUrl}/api/admin/centers/${editingCenter.id}`
        : `${apiUrl}/api/admin/centers`
      const res = await fetch(url, {
        method: editingCenter ? "PUT" : "POST",
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
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
              .filter((c) => c.id !== editingCenter?.id && c.type === "commune")
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Hủy")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("Đang lưu...") : editingCenter ? t("Cập nhật") : t("Tạo mới")}
        </Button>
      </DialogFooter>
    </form>
  )
}
