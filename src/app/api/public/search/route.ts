import { NextResponse } from "next/server"
import { SearchScope, TaskStatus } from "@prisma/client"
import { z } from "zod"
import { runSearch } from "@/lib/search"

const querySchema = z.object({
  q: z.string().optional().default(""),
  scope: z.enum(SearchScope).optional(),
  status: z.enum(TaskStatus).optional(),
  phase: z.string().optional(),
  projectId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    scope: searchParams.get("scope") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    phase: searchParams.get("phase") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({
      tasks: [],
      projects: [],
      members: [],
      meta: { query: "", normalizedQuery: "", tokens: [], tookMs: 0 },
    })
  }

  const { limit, ...filters } = parsed.data
  const payload = await runSearch({ filters, limit })
  return NextResponse.json(payload)
}
