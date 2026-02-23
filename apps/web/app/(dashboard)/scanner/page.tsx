"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { ScanLine, Search } from "lucide-react"

export default function ScannerPage() {
  const [code, setCode] = useState("")

  const lookupMutation = useMutation({
    mutationFn: async (searchCode: string) => {
      const res = await api.api.scanner.lookup.$get({ query: { code: searchCode } })
      return res.json()
    },
  })

  function handleSearch() {
    if (code.trim()) {
      lookupMutation.mutate(code.trim())
    }
  }

  const inputClass = "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quét mã</h1>
        <p className="text-muted-foreground">Tra cứu thuốc bằng mã vạch hoặc QR code</p>
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Nhập hoặc quét mã vạch..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className={inputClass}
          autoFocus
        />
        <Button onClick={handleSearch} disabled={lookupMutation.isPending}>
          <Search className="mr-2 h-4 w-4" />
          Tra cứu
        </Button>
      </div>

      {lookupMutation.isPending && (
        <div className="text-center text-muted-foreground">Đang tìm...</div>
      )}

      {lookupMutation.data && !("error" in lookupMutation.data) && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {lookupMutation.data.type === "medicine" ? "Thuốc" : "Lô hàng"}
            </span>
          </div>
          <pre className="bg-muted rounded-md p-4 text-sm overflow-auto">
            {JSON.stringify(lookupMutation.data.data, null, 2)}
          </pre>
        </div>
      )}

      {lookupMutation.data && "error" in lookupMutation.data && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <ScanLine className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Không tìm thấy kết quả cho mã này</p>
        </div>
      )}
    </div>
  )
}
