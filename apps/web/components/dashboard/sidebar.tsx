"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useExtracted } from "next-intl"
import {
  Package,
  Pill,
  ArrowLeftRight,
  Truck,
  Bell,
  BarChart3,
  ScanLine,
  Settings,
  ClipboardList,
  Building2,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const t = useExtracted()

  const navItems = [
    { href: "/inventory", label: t("Kho thuốc"), icon: Package },
    { href: "/medicines", label: t("Danh mục thuốc"), icon: Pill },
    { href: "/transactions", label: t("Giao dịch"), icon: ArrowLeftRight },
    { href: "/suppliers", label: t("Nhà cung cấp"), icon: Truck },
    { href: "/prescriptions", label: t("Đơn thuốc"), icon: ClipboardList },
    { href: "/alerts", label: t("Cảnh báo"), icon: Bell },
    { href: "/reports", label: t("Báo cáo"), icon: BarChart3 },
    { href: "/scanner", label: t("Quét mã"), icon: ScanLine },
  ]

  const bottomItems = [
    { href: "/settings", label: t("Cài đặt"), icon: Settings },
  ]

  return (
    <aside className="bg-card flex h-screen w-60 shrink-0 flex-col border-r">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Building2 className="text-primary h-5 w-5" />
        <span className="font-semibold">RxStation</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div className="border-t p-2">
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
  pathname: string
}) {
  const isActive = pathname.startsWith(item.href)
  return (
    <Link
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
}
