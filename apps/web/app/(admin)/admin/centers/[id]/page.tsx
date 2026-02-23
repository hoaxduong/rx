"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ArrowLeft, Plus, Search, Building, MapPin, Phone, Pencil, Trash2, Users } from "lucide-react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const ROLES = ["admin", "center_manager", "pharmacist", "doctor", "nurse"] as const
type CenterRole = (typeof ROLES)[number]

const ROLE_LABELS: Record<CenterRole, string> = {
  admin: "Admin",
  center_manager: "Quản lý",
  pharmacist: "Dược sĩ",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
}

const ROLE_COLORS: Record<CenterRole, string> = {
  admin: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  center_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pharmacist: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  doctor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  nurse: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
}

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

type Member = {
  id: string
  userId: string
  centerId: string
  role: CenterRole
  isActive: boolean
  canAccessChildren: boolean
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
    fullNameVi?: string | null
  }
}

type UserItem = {
  id: string
  name: string
  email: string
}

export default function CenterDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useExtracted()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)

  const { data: center, isLoading: centerLoading } = useQuery({
    queryKey: ["admin", "centers", params.id],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/admin/centers?search=`, { credentials: "include" })
      const data = await res.json() as { items: Center[] }
      return data.items.find((c) => c.id === params.id) ?? null
    },
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["admin", "centers", params.id, "members"],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/admin/centers/${params.id}/members`, { credentials: "include" })
      return res.json() as Promise<Member[]>
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`${apiUrl}/api/admin/centers/${params.id}/members/${memberId}`, {
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
      queryClient.invalidateQueries({ queryKey: ["admin", "centers", params.id, "members"] })
      setRemoveTarget(null)
    },
  })

  if (centerLoading) {
    return <div className="text-muted-foreground py-12 text-center text-sm">{t("Đang tải...")}</div>
  }

  if (!center) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/centers")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("Quay lại")}
        </Button>
        <div className="text-muted-foreground py-12 text-center text-sm">{t("Không tìm thấy cơ sở")}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/centers")}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t("Quay lại danh sách")}
      </Button>

      {/* Center info header */}
      <div className="rounded-lg border p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Building className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{center.name}</h1>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span className="font-mono text-xs">{center.code}</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  center.type === "commune"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                }`}>
                  {center.type === "commune" ? t("Xã") : t("Trạm")}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  center.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {center.isActive ? t("Hoạt động") : t("Ngưng")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          {center.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {center.address}
            </span>
          )}
          {center.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {center.phone}
            </span>
          )}
          {center.parent && (
            <span>
              {t("Trực thuộc")}: <span className="font-medium text-foreground">{center.parent.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Members section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            {t("Thành viên")}
            {members && <span className="text-muted-foreground text-sm font-normal">({members.length})</span>}
          </h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("Thêm thành viên")}
          </Button>
        </div>

        {membersLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">{t("Đang tải...")}</div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">{t("Thành viên")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Vai trò")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("Truy cập trạm con")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("Thao tác")}</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{member.user.fullNameVi || member.user.name}</div>
                        <div className="text-muted-foreground text-xs">{member.user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${member.canAccessChildren ? "text-green-600" : "text-muted-foreground"}`}>
                        {member.canAccessChildren ? t("Có") : t("Không")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingMember(member)}
                          title={t("Sửa")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRemoveTarget(member)}
                          title={t("Xóa")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground px-4 py-12 text-center">
                      {t("Chưa có thành viên nào")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Thêm thành viên")}</DialogTitle>
            <DialogDescription>{t("Tìm người dùng và gán vai trò tại cơ sở này")}</DialogDescription>
          </DialogHeader>
          <AddMemberForm
            centerId={params.id}
            existingUserIds={members?.map((m) => m.userId) ?? []}
            onSuccess={() => {
              setAddDialogOpen(false)
              queryClient.invalidateQueries({ queryKey: ["admin", "centers", params.id, "members"] })
            }}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) setEditingMember(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Cập nhật vai trò")}</DialogTitle>
            <DialogDescription>
              {editingMember && (editingMember.user.fullNameVi || editingMember.user.name)}
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <EditMemberForm
              centerId={params.id}
              member={editingMember}
              onSuccess={() => {
                setEditingMember(null)
                queryClient.invalidateQueries({ queryKey: ["admin", "centers", params.id, "members"] })
              }}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Xóa thành viên")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Xóa "{memberName}" khỏi cơ sở này? Người dùng sẽ mất quyền truy cập.', {
                memberName: removeTarget?.user.fullNameVi || removeTarget?.user.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Hủy")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? t("Đang xử lý...") : t("Xóa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddMemberForm({
  centerId,
  existingUserIds,
  onSuccess,
  onCancel,
}: {
  centerId: string
  existingUserIds: string[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const t = useExtracted()
  const [userSearch, setUserSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [role, setRole] = useState<CenterRole>("pharmacist")
  const [canAccessChildren, setCanAccessChildren] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { data: searchResults } = useQuery({
    queryKey: ["admin", "users", "search", userSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ search: userSearch, limit: "20" })
      const res = await fetch(`${apiUrl}/api/admin/users?${params}`, { credentials: "include" })
      const data = await res.json() as { items: UserItem[] }
      return data.items.filter((u) => !existingUserIds.includes(u.id))
    },
    enabled: userSearch.length >= 2,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${apiUrl}/api/admin/centers/${centerId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: selectedUser.id, role, canAccessChildren }),
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

      {/* User picker */}
      <div>
        <label className="text-sm font-medium">{t("Người dùng")} *</label>
        {selectedUser ? (
          <div className="mt-1 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">{selectedUser.name}</div>
              <div className="text-muted-foreground text-xs">{selectedUser.email}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setUserSearch("") }}>
              {t("Đổi")}
            </Button>
          </div>
        ) : (
          <div className="mt-1 space-y-1">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("Tìm theo tên hoặc email...")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border pl-9 pr-3 text-sm"
                autoFocus
              />
            </div>
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
            {userSearch.length >= 2 && searchResults?.length === 0 && (
              <div className="text-muted-foreground px-3 py-2 text-xs">{t("Không tìm thấy người dùng")}</div>
            )}
          </div>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="text-sm font-medium">{t("Vai trò")} *</label>
        <Select value={role} onValueChange={(value) => setRole(value as CenterRole)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* canAccessChildren */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={canAccessChildren}
          onChange={(e) => setCanAccessChildren(e.target.checked)}
          className="rounded"
        />
        {t("Cho phép truy cập trạm con")}
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Hủy")}
        </Button>
        <Button type="submit" disabled={loading || !selectedUser}>
          {loading ? t("Đang lưu...") : t("Thêm")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditMemberForm({
  centerId,
  member,
  onSuccess,
  onCancel,
}: {
  centerId: string
  member: Member
  onSuccess: () => void
  onCancel: () => void
}) {
  const t = useExtracted()
  const [role, setRole] = useState<CenterRole>(member.role)
  const [canAccessChildren, setCanAccessChildren] = useState(member.canAccessChildren)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${apiUrl}/api/admin/centers/${centerId}/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, canAccessChildren }),
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

      <div>
        <label className="text-sm font-medium">{t("Vai trò")}</label>
        <Select value={role} onValueChange={(value) => setRole(value as CenterRole)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={canAccessChildren}
          onChange={(e) => setCanAccessChildren(e.target.checked)}
          className="rounded"
        />
        {t("Cho phép truy cập trạm con")}
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Hủy")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("Đang lưu...") : t("Cập nhật")}
        </Button>
      </DialogFooter>
    </form>
  )
}
