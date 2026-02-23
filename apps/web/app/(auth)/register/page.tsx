"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useExtracted } from "next-intl"
import { signUp } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"

export default function RegisterPage() {
  const router = useRouter()
  const t = useExtracted()
  const [error, setError] = useState("")

  const registerSchema = z
    .object({
      name: z.string().min(1, t("Tên không được để trống")),
      email: z.string().email(t("Email không hợp lệ")),
      password: z.string().min(6, t("Mật khẩu phải có ít nhất 6 ký tự")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("Mật khẩu xác nhận không khớp"),
      path: ["confirmPassword"],
    })

  type RegisterForm = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    setError("")
    const result = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    })
    if (result.error) {
      setError(result.error.message || t("Đăng ký thất bại"))
      return
    }
    router.push("/inventory")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("Đăng ký tài khoản")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("Hệ thống quản lý trạm y tế cơ sở")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t("Họ và tên")}
            </label>
            <input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="email@example.com"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t("Xác nhận mật khẩu")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("Đang đăng ký...") : t("Đăng ký")}
          </Button>
        </form>

        <p className="text-center text-sm">
          {t("Đã có tài khoản?")}{" "}
          <Link href="/login" className="text-primary underline">
            {t("Đăng nhập")}
          </Link>
        </p>
      </div>
    </div>
  )
}
