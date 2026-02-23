"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

const STORAGE_KEY = "rx-selected-center-id"

type Center = {
  id: string
  name: string
  code: string
  type: "commune" | "satellite"
}

type CenterContextType = {
  currentCenter: Center | null
  setCurrentCenter: (center: Center) => void
  centers: Center[]
  isLoading: boolean
}

const CenterContext = createContext<CenterContextType>({
  currentCenter: null,
  setCurrentCenter: () => {},
  centers: [],
  isLoading: false,
})

export function CenterProvider({ children }: { children: React.ReactNode }) {
  const [currentCenter, setCurrentCenterState] = useState<Center | null>(null)

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ["centers"],
    queryFn: async () => {
      const res = await api.api.centers.$get()
      return (await res.json()) as Center[]
    },
  })

  // Restore persisted center or auto-select first center
  useEffect(() => {
    if (centers.length === 0) return
    if (currentCenter && centers.some((c) => c.id === currentCenter.id)) return

    const savedId = localStorage.getItem(STORAGE_KEY)
    const saved = savedId ? centers.find((c) => c.id === savedId) : null
    setCurrentCenterState(saved ?? centers[0] ?? null)
  }, [centers, currentCenter])

  function setCurrentCenter(center: Center) {
    setCurrentCenterState(center)
    localStorage.setItem(STORAGE_KEY, center.id)
  }

  return (
    <CenterContext.Provider
      value={{ currentCenter, setCurrentCenter, centers, isLoading }}
    >
      {children}
    </CenterContext.Provider>
  )
}

export function useCenter() {
  return useContext(CenterContext)
}
