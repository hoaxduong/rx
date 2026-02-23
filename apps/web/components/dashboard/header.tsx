"use client"

import { useRouter } from "next/navigation"
import { useExtracted } from "next-intl"
import { LogOut, User, Building } from "lucide-react"
import { useSession, signOut } from "@/lib/auth-client"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { LocaleSwitcher } from "@/components/locale-switcher"

export function Header() {
  const router = useRouter()
  const t = useExtracted()
  const { data: session } = useSession()
  const { currentCenter, centers, setCurrentCenter } = useCenter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <header className="bg-card flex h-14 shrink-0 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        {centers.length > 0 && (
          <div className="flex items-center gap-2">
            <Building className="text-muted-foreground h-4 w-4" />
            <select
              value={currentCenter?.id || ""}
              onChange={(e) => {
                const center = centers.find((c) => c.id === e.target.value)
                setCurrentCenter(center || null)
              }}
              className="border-input bg-background h-8 rounded-md border px-2.5 pr-8 text-sm"
            >
              <option value="">{t("Chọn cơ sở")}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "commune" ? t("Xã") : t("Trạm")})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <User className="h-3.5 w-3.5" />
          <span>{session?.user?.name || t("Người dùng")}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title={t("Đăng xuất")}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
