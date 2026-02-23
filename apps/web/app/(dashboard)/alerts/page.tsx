"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useCenter } from "@/components/center-context"
import { Button } from "@workspace/ui/components/button"
import { Bell, AlertTriangle, Clock, Package, Check, X } from "lucide-react"

const typeIcons: Record<string, typeof Bell> = {
  expiry_warning: Clock,
  expired: AlertTriangle,
  low_stock: Package,
  out_of_stock: Package,
  overstock: Package,
  recall: AlertTriangle,
}

const typeLabels: Record<string, string> = {
  expiry_warning: "Sắp hết hạn",
  expired: "Đã hết hạn",
  low_stock: "Tồn kho thấp",
  out_of_stock: "Hết hàng",
  overstock: "Tồn kho cao",
  recall: "Thu hồi",
}

const typeColors: Record<string, string> = {
  expiry_warning: "text-orange-500 bg-orange-50",
  expired: "text-red-500 bg-red-50",
  low_stock: "text-yellow-600 bg-yellow-50",
  out_of_stock: "text-red-500 bg-red-50",
  overstock: "text-blue-500 bg-blue-50",
  recall: "text-red-700 bg-red-100",
}

export default function AlertsPage() {
  const { currentCenter } = useCenter()
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts", currentCenter?.id],
    queryFn: async () => {
      const res = await api.api.alerts.$get({
        query: { centerId: currentCenter?.id || "", status: "active" },
      })
      return res.json()
    },
    enabled: !!currentCenter,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.alerts[":id"].acknowledge.$patch({
        param: { id },
        json: {},
      })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  })

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.alerts[":id"].dismiss.$patch({ param: { id } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  })

  if (!currentCenter) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">Chọn cơ sở</h2>
          <p className="text-muted-foreground mt-1">Chọn cơ sở y tế để xem cảnh báo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cảnh báo</h1>
        <p className="text-muted-foreground">
          Cảnh báo hết hạn, tồn kho thấp tại {currentCenter.name}
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
      ) : Array.isArray(alerts) && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const Icon = typeIcons[alert.type] || Bell
            const color = typeColors[alert.type] || "text-gray-500 bg-gray-50"
            return (
              <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-4">
                <div className={`rounded-lg p-2 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {typeLabels[alert.type] || alert.type}
                      </span>
                      <h3 className="font-medium">{alert.title}</h3>
                      {alert.message && (
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      )}
                      {alert.medicine && (
                        <p className="text-sm mt-1">
                          Thuốc: <span className="font-medium">{alert.medicine.nameVi || alert.medicine.name}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        title="Xác nhận"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => dismissMutation.mutate(alert.id)}
                        title="Bỏ qua"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(alert.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-lg border p-12">
          <Check className="text-green-500 mb-4 h-12 w-12" />
          <p className="font-medium">Không có cảnh báo</p>
          <p className="text-muted-foreground text-sm">Kho thuốc hoạt động bình thường</p>
        </div>
      )}
    </div>
  )
}
