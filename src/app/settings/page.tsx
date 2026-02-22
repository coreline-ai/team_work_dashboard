"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminMode } from "@/components/providers/admin-mode-provider"
import type { SearchSynonymItem } from "@/types/domain"

type SettingsPayload = {
  notificationInApp: boolean
  defaultStartPage: "/" | "/tasks" | "/projects" | "/team-members" | "/settings"
  locale: string
  timezone: string
}

interface ProjectOption {
  id: string
  name: string
  isArchived: boolean
}

const defaultSettings: SettingsPayload = {
  notificationInApp: true,
  defaultStartPage: "/",
  locale: "ko-KR",
  timezone: "Asia/Seoul",
}

const GLOBAL_SCOPE = "__GLOBAL__"
const ALL_SCOPE = "__ALL__"

function parseSynonymsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { enabled: adminModeEnabled } = useAdminMode()
  const isAdmin = session?.user?.role === "ADMIN"
  const showAdminSection = isAdmin && adminModeEnabled

  const [settings, setSettings] = React.useState<SettingsPayload>(defaultSettings)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState("")

  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [synonyms, setSynonyms] = React.useState<SearchSynonymItem[]>([])
  const [synonymsLoading, setSynonymsLoading] = React.useState(false)
  const [synonymsMessage, setSynonymsMessage] = React.useState("")
  const [viewScope, setViewScope] = React.useState<string>(ALL_SCOPE)
  const [selectedSynonymId, setSelectedSynonymId] = React.useState("")

  const [createScope, setCreateScope] = React.useState<string>(GLOBAL_SCOPE)
  const [createKeyword, setCreateKeyword] = React.useState("")
  const [createSynonymsText, setCreateSynonymsText] = React.useState("")
  const [createIsActive, setCreateIsActive] = React.useState(true)

  const [editScope, setEditScope] = React.useState<string>(GLOBAL_SCOPE)
  const [editKeyword, setEditKeyword] = React.useState("")
  const [editSynonymsText, setEditSynonymsText] = React.useState("")
  const [editIsActive, setEditIsActive] = React.useState(true)
  const [adminSaving, setAdminSaving] = React.useState(false)

  const fetchSettings = React.useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/profile/settings")
    if (!res.ok) {
      setLoading(false)
      return
    }
    const payload = await res.json()
    setSettings({ ...defaultSettings, ...payload.settings })
    setLoading(false)
  }, [])

  const fetchSynonyms = React.useCallback(async () => {
    if (!showAdminSection) {
      setSynonyms([])
      return
    }
    setSynonymsLoading(true)
    const res = await fetch("/api/projects/settings/synonyms")
    if (!res.ok) {
      setSynonyms([])
      setSynonymsLoading(false)
      return
    }
    const payload = await res.json()
    setSynonyms(payload.items ?? [])
    setSynonymsLoading(false)
  }, [showAdminSection])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  React.useEffect(() => {
    if (!showAdminSection) {
      setProjects([])
      return
    }

    const run = async () => {
      const res = await fetch("/api/projects?includeArchived=true")
      if (!res.ok) return
      const payload = await res.json()
      setProjects(payload.projects ?? [])
    }
    run()
  }, [showAdminSection])

  React.useEffect(() => {
    fetchSynonyms()
  }, [fetchSynonyms])

  React.useEffect(() => {
    if (!selectedSynonymId) {
      setEditScope(GLOBAL_SCOPE)
      setEditKeyword("")
      setEditSynonymsText("")
      setEditIsActive(true)
      return
    }

    const selected = synonyms.find((item) => item.id === selectedSynonymId)
    if (!selected) return
    setEditScope(selected.projectId ?? GLOBAL_SCOPE)
    setEditKeyword(selected.keyword)
    setEditSynonymsText(selected.synonyms.join(", "))
    setEditIsActive(selected.isActive)
  }, [selectedSynonymId, synonyms])

  const onSaveSettings = async () => {
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

  const onCreateSynonym = async () => {
    const keyword = createKeyword.trim()
    const synonymsList = parseSynonymsInput(createSynonymsText)
    if (!keyword || synonymsList.length === 0) {
      setSynonymsMessage("키워드와 동의어를 입력하세요.")
      return
    }

    setAdminSaving(true)
    setSynonymsMessage("")

    const res = await fetch("/api/projects/settings/synonyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: createScope === GLOBAL_SCOPE ? null : createScope,
        keyword,
        synonyms: synonymsList,
        isActive: createIsActive,
      }),
    })
    setAdminSaving(false)

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setSynonymsMessage(payload?.message ?? "동의어 생성에 실패했습니다.")
      return
    }

    setCreateKeyword("")
    setCreateSynonymsText("")
    setCreateScope(GLOBAL_SCOPE)
    setCreateIsActive(true)
    setSynonymsMessage("동의어가 생성되었습니다.")
    await fetchSynonyms()
  }

  const onUpdateSynonym = async () => {
    if (!selectedSynonymId) return
    const keyword = editKeyword.trim()
    const synonymsList = parseSynonymsInput(editSynonymsText)
    if (!keyword || synonymsList.length === 0) {
      setSynonymsMessage("키워드와 동의어를 입력하세요.")
      return
    }

    setAdminSaving(true)
    setSynonymsMessage("")
    const res = await fetch(`/api/projects/settings/synonyms/${selectedSynonymId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: editScope === GLOBAL_SCOPE ? null : editScope,
        keyword,
        synonyms: synonymsList,
        isActive: editIsActive,
      }),
    })
    setAdminSaving(false)

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setSynonymsMessage(payload?.message ?? "동의어 수정에 실패했습니다.")
      return
    }

    setSynonymsMessage("동의어가 수정되었습니다.")
    await fetchSynonyms()
  }

  const onDeleteSynonym = async () => {
    if (!selectedSynonymId) return
    setAdminSaving(true)
    setSynonymsMessage("")
    const res = await fetch(`/api/projects/settings/synonyms/${selectedSynonymId}`, {
      method: "DELETE",
    })
    setAdminSaving(false)

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setSynonymsMessage(payload?.message ?? "동의어 삭제에 실패했습니다.")
      return
    }

    setSelectedSynonymId("")
    setSynonymsMessage("동의어가 삭제되었습니다.")
    await fetchSynonyms()
  }

  const visibleSynonyms = React.useMemo(() => {
    if (viewScope === ALL_SCOPE) return synonyms
    if (viewScope === GLOBAL_SCOPE) return synonyms.filter((item) => !item.projectId)
    return synonyms.filter((item) => item.projectId === viewScope)
  }, [synonyms, viewScope])

  if (loading) {
    return <div className="text-sm text-slate-500">설정을 불러오는 중...</div>
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">설정</h1>
        <p className="text-sm text-slate-500">개인 설정과 관리자 프로젝트 검색 사전</p>
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
            <Button onClick={onSaveSettings} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
            <span className="text-xs text-slate-500">{message}</span>
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        showAdminSection ? (
          <Card id="project-search-synonyms" data-testid="project-synonyms-admin-panel">
            <CardHeader>
              <CardTitle className="text-base">프로젝트 검색 동의어 사전 (관리자)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2 md:grid-cols-4">
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-medium text-slate-600">목록 필터</span>
                  <select
                    value={viewScope}
                    onChange={(event) => setViewScope(event.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value={ALL_SCOPE}>전체 스코프</option>
                    <option value={GLOBAL_SCOPE}>전역</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}{project.isArchived ? " (ARCHIVED)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  키워드는 정규화(lowercase)되어 저장됩니다.
                  {" "}
                  검색 시 프로젝트가 지정되면 전역+해당 프로젝트 동의어가 함께 적용됩니다.
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-800">동의어 목록</p>
                {synonymsLoading ? <p className="text-sm text-slate-500">불러오는 중...</p> : null}
                {!synonymsLoading ? (
                  <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
                    {visibleSynonyms.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">등록된 동의어가 없습니다.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {visibleSynonyms.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedSynonymId(item.id)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                              selectedSynonymId === item.id ? "bg-blue-50/60" : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-800">{item.keyword}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {item.projectName ?? "GLOBAL"}
                              </span>
                              <span className={`rounded px-2 py-0.5 text-xs ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {item.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.synonyms.join(", ")}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">동의어 추가</p>
                  <select
                    value={createScope}
                    onChange={(event) => setCreateScope(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value={GLOBAL_SCOPE}>GLOBAL</option>
                    {projects.map((project) => (
                      <option key={`create-${project.id}`} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="keyword"
                    value={createKeyword}
                    onChange={(event) => setCreateKeyword(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <input
                    placeholder="synonyms (comma separated)"
                    value={createSynonymsText}
                    onChange={(event) => setCreateSynonymsText(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={createIsActive}
                      onChange={(event) => setCreateIsActive(event.target.checked)}
                    />
                    active
                  </label>
                  <Button data-testid="synonym-create-submit" onClick={onCreateSynonym} disabled={adminSaving}>추가</Button>
                </div>

                <div className="space-y-2 rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">선택 항목 수정</p>
                  <select
                    value={editScope}
                    onChange={(event) => setEditScope(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    disabled={!selectedSynonymId}
                  >
                    <option value={GLOBAL_SCOPE}>GLOBAL</option>
                    {projects.map((project) => (
                      <option key={`edit-${project.id}`} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="keyword"
                    value={editKeyword}
                    onChange={(event) => setEditKeyword(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                    disabled={!selectedSynonymId}
                  />
                  <input
                    placeholder="synonyms (comma separated)"
                    value={editSynonymsText}
                    onChange={(event) => setEditSynonymsText(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                    disabled={!selectedSynonymId}
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(event) => setEditIsActive(event.target.checked)}
                      disabled={!selectedSynonymId}
                    />
                    active
                  </label>
                  <div className="flex gap-2">
                    <Button data-testid="synonym-update-submit" onClick={onUpdateSynonym} disabled={adminSaving || !selectedSynonymId}>저장</Button>
                    <Button variant="outline" data-testid="synonym-delete-submit" onClick={onDeleteSynonym} disabled={adminSaving || !selectedSynonymId}>삭제</Button>
                  </div>
                </div>
              </div>

              {synonymsMessage ? <p className="text-xs text-slate-500">{synonymsMessage}</p> : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">관리자 프로젝트 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                헤더의
                {" "}
                <span className="font-semibold text-slate-700">관리 모드 ON</span>
                {" "}
                상태에서 프로젝트 검색 동의어 사전을 수정할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )
      ) : null}
    </div>
  )
}
