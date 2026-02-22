"use client"

import { useParams } from "next/navigation"
import { ProjectDashboardPage } from "@/components/dashboard/project-dashboard-page"

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params?.id

  if (!projectId) {
    return <div className="w-full max-w-7xl mx-auto text-sm text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  return <ProjectDashboardPage projectId={projectId} source="projects" />
}
