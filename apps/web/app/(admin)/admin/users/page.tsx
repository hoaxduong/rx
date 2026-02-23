"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useExtracted } from "next-intl"
import { useSession } from "@/lib/auth-client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Plus, Search, User, Shield, Trash2 } from "lucide-react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type UserItem = {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  fullNameVi?: string | null
  createdAt: string
}

type UserDetail = UserItem & {
  memberships: {
    id: string
    role: string
    isActive: boolean
    center: { id: string; name: string; code: string; type: string }
  }[]
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const t = useExtracted()
  const session = useSession()
  const currentUserId = session.data?.user?.id
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", "100")
      const res = await fetch(`${apiUrl}/api/admin/users?${params}`, { credentials: "include" })
      return res.json() as Promise<{ items: UserItem[]; total: number }>
    },
  })

  const { data: userDetail } = useQuery({
    queryKey: ["admin", "users", selectedUserId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/admin/users/${selectedUserId}`, { credentials: "include" })
      return res.json() as Promise<UserDetail>
    },
    enabled: !!selectedUserId,
  })

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      return res.json()
    },
    onSuccess: () => {
      setSelectedUserId(null)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Quản lý người dùng")}</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("Thêm người dùng")}
        </Button>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("Tìm theo tên hoặc email...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background h-9 w-full rounded-md border pl-9 pr-3 text-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User list */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-muted-foreground py-12 text-center text-sm">{t("Đang tải...")}</div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">{t("Người dùng")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Vai trò")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("Ngày tạo")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("Thao tác")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer border-b last:border-0 transition-colors ${
                        selectedUserId === user.id ? "bg-muted/50" : "hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            {user.role === "super_admin" ? (
                              <Shield className="text-primary h-4 w-4" />
                            ) : (
                              <User className="text-muted-foreground h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "super_admin"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {user.role === "super_admin" ? "Super Admin" : "User"}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {user.id !== currentUserId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleRoleMutation.mutate({
                                    id: user.id,
                                    role: user.role === "super_admin" ? "user" : "super_admin",
                                  })
                                }
                              >
                                {user.role === "super_admin" ? t("Hạ quyền") : t("Nâng quyền")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteTarget(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-muted-foreground px-4 py-12 text-center">
                        {t("Không tìm thấy người dùng")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User detail panel */}
        <div>
          {selectedUserId && userDetail ? (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                  {userDetail.role === "super_admin" ? (
                    <Shield className="text-primary h-5 w-5" />
                  ) : (
                    <User className="text-muted-foreground h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{userDetail.name}</div>
                  <div className="text-muted-foreground text-sm">{userDetail.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Vai trò hệ thống")}</span>
                  <span className="font-medium">{userDetail.role === "super_admin" ? "Super Admin" : "User"}</span>
                </div>
                {userDetail.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Điện thoại")}</span>
                    <span>{userDetail.phone}</span>
                  </div>
                )}
                {userDetail.fullNameVi && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Họ tên")}</span>
                    <span>{userDetail.fullNameVi}</span>
                  </div>
                )}
              </div>

              {userDetail.memberships.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">{t("Cơ sở trực thuộc")}</h3>
                  <div className="space-y-2">
                    {userDetail.memberships.map((m) => (
                      <div key={m.id} className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{m.center.name}</div>
                          <div className="text-muted-foreground text-xs">{m.center.code}</div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          m.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border text-sm">
              {t("Chọn người dùng để xem chi tiết")}
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Thêm người dùng mới")}</DialogTitle>
            <DialogDescription>{t("Nhập thông tin người dùng mới")}</DialogDescription>
          </DialogHeader>
          <UserForm
            onSuccess={() => {
              setDialogOpen(false)
              queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Xóa người dùng")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Xóa người dùng "{userName}"? Thao tác không thể hoàn tác.', {
                userName: deleteTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Hủy")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t("Đang xử lý...") : t("Xóa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const t = useExtracted()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "super_admin",
    phone: "",
    fullNameVi: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body: Record<string, any> = { ...form }
    if (!body.phone) delete body.phone
    if (!body.fullNameVi) delete body.fullNameVi

    try {
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        method: "POST",
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
          <label className="text-sm font-medium">{t("Tên")} *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Mật khẩu")} *</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("Vai trò")}</label>
          <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as "user" | "super_admin" })}>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
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
          <label className="text-sm font-medium">{t("Họ tên (tiếng Việt)")}</label>
          <input
            value={form.fullNameVi}
            onChange={(e) => setForm({ ...form, fullNameVi: e.target.value })}
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Hủy")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("Đang lưu...") : t("Tạo mới")}
        </Button>
      </DialogFooter>
    </form>
  )
}
