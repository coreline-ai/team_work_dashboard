"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoleLabel } from "@/lib/role-label"
import type { PublicTeamMember, Role } from "@/types/domain"

interface TeamUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
}

const emptyCreateForm = {
  name: "",
  email: "",
  password: "",
  role: "MEMBER" as Role,
}

export default function TeamMembersPage() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [publicMembers, setPublicMembers] = React.useState<PublicTeamMember[]>([])
  const [publicLoading, setPublicLoading] = React.useState(true)
  const [expandedMembers, setExpandedMembers] = React.useState<Record<string, boolean>>({})

  const [adminUsers, setAdminUsers] = React.useState<TeamUser[]>([])
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [message, setMessage] = React.useState("")
  const [createForm, setCreateForm] = React.useState(emptyCreateForm)

  const fetchPublicMembers = React.useCallback(async () => {
    setPublicLoading(true)
    const res = await fetch("/api/public/team-members")
    if (!res.ok) {
      setPublicLoading(false)
      return
    }
    const payload = await res.json()
    setPublicMembers(payload.members ?? [])
    setPublicLoading(false)
  }, [])

  const fetchAdminUsers = React.useCallback(async () => {
    if (!isAdmin) return
    const res = await fetch("/api/users")
    if (!res.ok) return
    const payload = await res.json()
    setAdminUsers(payload.users ?? [])
  }, [isAdmin])

  React.useEffect(() => {
    fetchPublicMembers()
  }, [fetchPublicMembers])

  React.useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return
    fetchAdminUsers()
  }, [status, isAdmin, fetchAdminUsers])

  const createUser = async () => {
    if (!isAdmin) return
    setMessage("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "팀원 생성에 실패했습니다.")
      return
    }
    setCreateForm(emptyCreateForm)
    setMessage("팀원이 생성되었습니다.")
    fetchAdminUsers()
    fetchPublicMembers()
  }

  const updateUser = async (id: string, patch: Partial<Pick<TeamUser, "role" | "isActive">>) => {
    if (!isAdmin) return
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "팀원 수정에 실패했습니다.")
      return
    }
    fetchAdminUsers()
    fetchPublicMembers()
  }

  const deactivateUser = async (id: string) => {
    if (!isAdmin) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "비활성화에 실패했습니다.")
      return
    }
    fetchAdminUsers()
    fetchPublicMembers()
  }

  const filteredAdminUsers = adminUsers.filter((user) => {
    const statusMatched =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive)
    const queryLower = query.trim().toLowerCase()
    const queryMatched =
      queryLower.length === 0 ||
      user.name.toLowerCase().includes(queryLower) ||
      user.email.toLowerCase().includes(queryLower)
    return statusMatched && queryMatched
  })

  const toggleMemberExpanded = (memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }))
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">팀 멤버</h1>
        <p className="text-sm text-slate-500">공개 조직 구성원 목록</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">멤버 목록(공개)</CardTitle>
        </CardHeader>
        <CardContent>
          {publicLoading ? (
            <p className="text-sm text-slate-500">팀원 목록을 불러오는 중...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs uppercase text-slate-500 border-r border-slate-100">이름</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500 border-r border-slate-100">구분</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500 border-r border-slate-100">역할</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">업무명</th>
                  </tr>
                </thead>
                <tbody>
                  {publicMembers.map((member) => {
                    const isExpanded = Boolean(expandedMembers[member.id])
                    const visibleTasks = isExpanded ? member.tasks : member.tasks.slice(0, 2)
                    const hiddenCount = Math.max(member.taskCount - 2, 0)

                    return (
                      <tr key={member.id} className="border-b border-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-100">{member.name}</td>
                        <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{member.category}</td>
                        <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{getRoleLabel(member.role)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex flex-wrap items-center gap-2">
                            {visibleTasks.map((task) => (
                              <span
                                key={task.id}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                              >
                                <span className="mr-1 text-slate-500">{task.phase}</span>
                                <span>{task.title}</span>
                              </span>
                            ))}
                            {member.taskCount === 0 ? <span className="text-xs text-slate-400">배정된 업무 없음</span> : null}
                            {hiddenCount > 0 && !isExpanded ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => toggleMemberExpanded(member.id)}
                              >
                                +{hiddenCount} more
                              </Button>
                            ) : null}
                            {member.taskCount > 2 && isExpanded ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleMemberExpanded(member.id)}
                              >
                                접기
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {publicMembers.length === 0 ? <p className="text-sm text-slate-500 mt-3">표시할 팀원이 없습니다.</p> : null}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">팀원 생성 (관리자 전용)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <input
                placeholder="이름"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="email"
                placeholder="이메일"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="password"
                placeholder="비밀번호(8자 이상)"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as Role }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="MEMBER">팀원</option>
                <option value="ADMIN">팀장</option>
              </select>
              <Button onClick={createUser}>생성</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">팀원 관리 (관리자 전용)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  placeholder="이름/이메일 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="ALL">전체</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">이름</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">이메일</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">역할</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">상태</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(event) => updateUser(user.id, { role: event.target.value as Role })}
                            className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white"
                          >
                            <option value="MEMBER">팀원</option>
                            <option value="ADMIN">팀장</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={user.isActive ? "text-emerald-600" : "text-slate-400"}>
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.isActive ? (
                            <Button variant="outline" size="sm" onClick={() => deactivateUser(user.id)}>
                              비활성화
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateUser(user.id, { isActive: true })}>
                              재활성화
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAdminUsers.length === 0 ? <p className="text-sm text-slate-500 mt-3">조건에 맞는 팀원이 없습니다.</p> : null}
                {message ? <p className="text-xs text-slate-500 mt-3">{message}</p> : null}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
