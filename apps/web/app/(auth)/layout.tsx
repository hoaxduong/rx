import Link from "next/link"
import { Building2 } from "lucide-react"
import { getExtracted } from "next-intl/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getExtracted()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Building2 className="text-primary h-7 w-7" />
        <span className="text-xl font-bold">RxStation</span>
      </Link>
      <div className="bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm">
        {children}
      </div>
      <p className="text-muted-foreground mt-6 text-center text-xs">
        {t("Hệ thống quản lý trạm y tế cơ sở")}
      </p>
    </div>
  )
}
