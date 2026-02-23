"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useExtracted } from "next-intl"
import { signIn, useSession } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"

export default function LoginPage() {
  const router = useRouter()
  const t = useExtracted()
  const [error, setError] = useState("")

  const loginSchema = z.object({
    email: z.string().email(t("Email không hợp lệ")),
    password: z.string().min(6, t("Mật khẩu phải có ít nhất 6 ký tự")),
  })

  type LoginForm = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError("")
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    })
    if (result.error) {
      setError(result.error.message || t("Đăng nhập thất bại"))
      return
    }
    const user = result.data?.user as any
    if (user?.role === "super_admin") {
      router.push("/admin/centers")
    } else {
      router.push("/inventory")
    }
  }

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold">{t("Đăng nhập")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Nhập thông tin tài khoản của bạn")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="email@example.com"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {t("Mật khẩu")}
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("Đang đăng nhập...") : t("Đăng nhập")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        {t("Chưa có tài khoản?")}{" "}
        <Link href="/register" className="text-primary underline">
          {t("Đăng ký")}
        </Link>
      </p>
    </>
  )
}
