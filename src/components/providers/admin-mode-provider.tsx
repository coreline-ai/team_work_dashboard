"use client"

import * as React from "react"
import type { AdminModeState } from "@/types/domain"

const AdminModeContext = React.createContext<AdminModeState | null>(null)

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(false)
  const toggle = React.useCallback(() => setEnabled((prev) => !prev), [])

  const value = React.useMemo(
    () => ({
      enabled,
      toggle,
      setEnabled,
    }),
    [enabled, toggle],
  )

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>
}

export function useAdminMode() {
  const context = React.useContext(AdminModeContext)
  if (!context) {
    throw new Error("useAdminMode must be used within AdminModeProvider")
  }
  return context
}
