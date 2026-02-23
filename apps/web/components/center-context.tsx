"use client"

import { createContext, useContext, useState, useCallback } from "react"

type Center = {
  id: string
  name: string
  code: string
  type: "commune" | "satellite"
}

type CenterContextType = {
  currentCenter: Center | null
  setCurrentCenter: (center: Center | null) => void
  centers: Center[]
  setCenters: (centers: Center[]) => void
}

const CenterContext = createContext<CenterContextType>({
  currentCenter: null,
  setCurrentCenter: () => {},
  centers: [],
  setCenters: () => {},
})

export function CenterProvider({ children }: { children: React.ReactNode }) {
  const [currentCenter, setCurrentCenter] = useState<Center | null>(null)
  const [centers, setCenters] = useState<Center[]>([])

  return (
    <CenterContext.Provider
      value={{ currentCenter, setCurrentCenter, centers, setCenters }}
    >
      {children}
    </CenterContext.Provider>
  )
}

export function useCenter() {
  return useContext(CenterContext)
}
