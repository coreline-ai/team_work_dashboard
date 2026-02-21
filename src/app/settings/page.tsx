"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SettingsPayload = {
  notificationInApp: boolean
  defaultStartPage: "/" | "/tasks" | "/projects" | "/team-members" | "/settings"
  locale: string
  timezone: string
}

const defaultSettings: SettingsPayload = {
  notificationInApp: true,
  defaultStartPage: "/",
  locale: "ko-KR",
  timezone: "Asia/Seoul",
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsPayload>(defaultSettings)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    const run = async () => {
      setLoading(true)
      const res = await fetch("/api/profile/settings")
      if (!res.ok) {
        setLoading(false)
        return
      }
      const payload = await res.json()
      setSettings({ ...defaultSettings, ...payload.settings })
      setLoading(false)
    }
    run()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage("")

    const res = await fetch("/api/profile/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })

    setSaving(false)
    if (!res.ok) {
      setMessage("저장에 실패했습니다.")
      return
    }
    setMessage("저장되었습니다.")
  }

  if (loading) {
    return <div className="text-sm text-slate-500">설정을 불러오는 중...</div>
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">설정</h1>
        <p className="text-sm text-slate-500">개인 환경설정</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">개인 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-700">인앱 알림</span>
            <input
              type="checkbox"
              checked={settings.notificationInApp}
              onChange={(event) => setSettings((prev) => ({ ...prev, notificationInApp: event.target.checked }))}
              className="h-4 w-4 accent-blue-600"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">기본 시작 페이지</span>
            <select
              value={settings.defaultStartPage}
              onChange={(event) => setSettings((prev) => ({
                ...prev,
                defaultStartPage: event.target.value as SettingsPayload["defaultStartPage"],
              }))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="/">Dashboard</option>
              <option value="/tasks">Tasks</option>
              <option value="/projects">Projects</option>
              <option value="/team-members">Team Members</option>
              <option value="/settings">Settings</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">언어</span>
            <input
              value={settings.locale}
              onChange={(event) => setSettings((prev) => ({ ...prev, locale: event.target.value }))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">타임존</span>
            <input
              value={settings.timezone}
              onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <Button onClick={onSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
            <span className="text-xs text-slate-500">{message}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
