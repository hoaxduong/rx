"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Package, Pill, BarChart3, Shield, ArrowRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useSession } from "@/lib/auth-client"

export default function Page() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && session?.user) {
      const user = session.user as any
      router.replace(user.role === "super_admin" ? "/admin/centers" : "/inventory")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">
          Đang tải...
        </div>
      </div>
    )
  }

  if (session?.user) return null

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary h-6 w-6" />
            <span className="text-lg font-bold">RX Pharmacy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Quản lý dược phẩm
              <br />
              <span className="text-primary">hiện đại & hiệu quả</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-lg">
              Theo dõi tồn kho, quản lý giao dịch, kiểm soát hạn sử dụng và
              báo cáo thống kê cho hệ thống y tế cơ sở.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Bắt đầu sử dụng
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Package}
              title="Quản lý tồn kho"
              description="Theo dõi số lượng, lô hàng và hạn sử dụng theo thời gian thực."
            />
            <FeatureCard
              icon={Pill}
              title="Danh mục thuốc"
              description="Quản lý thông tin thuốc, phân loại và quy cách đóng gói."
            />
            <FeatureCard
              icon={BarChart3}
              title="Báo cáo thống kê"
              description="Phân tích tiêu thụ, dự báo hết hạn và tổng hợp tồn kho."
            />
            <FeatureCard
              icon={Shield}
              title="Cảnh báo tự động"
              description="Nhận thông báo khi thuốc sắp hết hạn hoặc tồn kho thấp."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        RX Pharmacy &mdash; Hệ thống quản lý dược phẩm
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
        <Icon className="text-primary h-5 w-5" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  )
}
