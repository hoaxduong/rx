"use client"

import { useRouter } from "next/navigation"
import { useExtracted } from "next-intl"
import { LogOut, User, Building } from "lucide-react"
import { useSession, signOut } from "@/lib/auth-client"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { LocaleSwitcher } from "@/components/locale-switcher"

export function Header() {
  const router = useRouter()
  const t = useExtracted()
  const { data: session } = useSession()
  const { currentCenter, centers, setCurrentCenter, isLoading } = useCenter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <header className="bg-card flex h-14 shrink-0 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 animate-pulse" />
            <span>{t("Đang tải...")}</span>
          </div>
        ) : centers.length > 0 ? (
          <div className="flex items-center gap-2">
            <Building className="text-muted-foreground h-4 w-4" />
            <Select
              value={currentCenter?.id || ""}
              onValueChange={(value) => {
                const center = centers.find((c) => c.id === value)
                if (center) setCurrentCenter(center)
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.type === "commune" ? t("Xã") : t("Trạm")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
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
