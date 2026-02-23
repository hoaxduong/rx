"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useExtracted } from "next-intl"
import { Building2, Building, Users, LogOut, Shield } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useSession, signOut } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useExtracted()

  const navItems = [
    { href: "/admin/centers", label: t("Cơ sở y tế"), icon: Building },
    { href: "/admin/users", label: t("Người dùng"), icon: Users },
  ]
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && (!session?.user || (session.user as any).role !== "super_admin")) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">{t("Đang tải...")}</div>
      </div>
    )
  }

  if (!session?.user || (session.user as any).role !== "super_admin") return null

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="bg-card flex w-60 shrink-0 flex-col border-r">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Shield className="text-primary h-5 w-5" />
          <span className="font-semibold">Super Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t p-2">
          <Link
            href="/inventory"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <Building2 className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card flex h-14 shrink-0 items-center justify-end border-b px-6">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{session.user.name}</span>
            <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title={t("Đăng xuất")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
