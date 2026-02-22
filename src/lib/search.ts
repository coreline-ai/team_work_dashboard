import { Prisma, Role, SearchScope, TaskStatus } from "@prisma/client"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 30

const STATIC_TOKEN_ALIASES: Record<string, string[]> = {
  "\uC548\uB4DC\uB85C\uC774\uB4DC": ["android"],
  android: ["\uC548\uB4DC\uB85C\uC774\uB4DC"],
  "\uC544\uC774\uC624\uC5D0\uC2A4": ["ios"],
  ios: ["\uC544\uC774\uC624\uC5D0\uC2A4"],
  "\uC544\uC774\uD3F0": ["iphone"],
  iphone: ["\uC544\uC774\uD3F0"],
}

type SearchUserContext = {
  id: string
  role: Role
}

export interface SearchFiltersInput {
  q?: string
  scope?: SearchScope
  status?: TaskStatus
  phase?: string
  projectId?: string
}

export interface RunSearchOptions {
  user?: SearchUserContext
  filters: SearchFiltersInput
  limit?: number
}

export interface SearchResponseMeta {
  query: string
  normalizedQuery: string
  tokens: string[]
  tookMs: number
}

export interface SearchResponsePayload {
  tasks: Array<{ id: string; title: string; phase: string; status: TaskStatus; projectId: string }>
  projects: Array<{ id: string; name: string; description: string | null }>
  members: Array<{ id: string; name: string; role: Role }>
  meta: SearchResponseMeta
}

type AliasDictionary = Record<string, string[]>

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function toNonEmpty(value?: string | null) {
  return value ? value.trim() : ""
}

function containsInsensitive(term: string) {
  return { contains: term, mode: "insensitive" as const }
}

function clampLimit(limit?: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit as number)))
}

export function normalizeSearchQuery(raw: string) {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function tokenizeSearchQuery(normalized: string) {
  if (!normalized) return []
  const tokens = normalized
    .split(" ")
    .map((token) => token.replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean)
  return unique(tokens)
}

function mergeAliasMaps(...maps: AliasDictionary[]): AliasDictionary {
  const merged: AliasDictionary = {}
  for (const map of maps) {
    for (const [key, values] of Object.entries(map)) {
      const normalizedKey = normalizeSearchQuery(key)
      if (!normalizedKey) continue
      const normalizedValues = values.map((value) => normalizeSearchQuery(value)).filter(Boolean)
      if (!merged[normalizedKey]) merged[normalizedKey] = []
      merged[normalizedKey] = unique([...merged[normalizedKey], ...normalizedValues.filter((v) => v !== normalizedKey)])
    }
  }
  return merged
}

function appendAlias(dictionary: AliasDictionary, key: string, candidates: string[]) {
  if (!key) return
  if (!dictionary[key]) dictionary[key] = []
  dictionary[key] = unique([...dictionary[key], ...candidates.filter((item) => item && item !== key)])
}

async function loadDynamicAliasMap(tokens: string[], projectId?: string): Promise<AliasDictionary> {
  if (tokens.length === 0) return {}

  const normalizedProjectId = toNonEmpty(projectId)
  const scopeWhere: Prisma.SearchSynonymWhereInput = normalizedProjectId
    ? { OR: [{ projectId: null }, { projectId: normalizedProjectId }] }
    : { projectId: null }

  const rows = await prisma.searchSynonym.findMany({
    where: {
      isActive: true,
      ...scopeWhere,
      OR: [
        { keyword: { in: tokens } },
        { synonyms: { hasSome: tokens } },
      ],
    },
    select: {
      keyword: true,
      synonyms: true,
    },
  })

  const dictionary: AliasDictionary = {}
  for (const row of rows) {
    const keyword = normalizeSearchQuery(row.keyword)
    if (!keyword) continue
    const synonyms = unique(row.synonyms.map((value) => normalizeSearchQuery(value)).filter(Boolean))
    appendAlias(dictionary, keyword, synonyms)
    for (const synonym of synonyms) {
      appendAlias(dictionary, synonym, [keyword, ...synonyms.filter((item) => item !== synonym)])
    }
  }

  return dictionary
}

export function expandTokensWithAliases(tokens: string[], aliasMap: AliasDictionary = STATIC_TOKEN_ALIASES) {
  const normalizedTokens = unique(tokens.map((token) => normalizeSearchQuery(token)).filter(Boolean))
  const expanded: string[] = [...normalizedTokens]
  for (const token of normalizedTokens) {
    const aliases = aliasMap[token] ?? []
    expanded.push(...aliases)
  }
  return unique(expanded)
}

function buildTaskKeywordClauses(term: string, includeEmail: boolean): Prisma.TaskWhereInput[] {
  const clauses: Prisma.TaskWhereInput[] = [
    { title: containsInsensitive(term) },
    { phase: containsInsensitive(term) },
    { assignee: { name: containsInsensitive(term) } },
  ]

  if (includeEmail) {
    clauses.push({ assignee: { email: containsInsensitive(term) } })
  }

  return clauses
}

function buildProjectKeywordClauses(term: string): Prisma.ProjectWhereInput[] {
  return [
    { name: containsInsensitive(term) },
    { description: containsInsensitive(term) },
  ]
}

function buildMemberKeywordClauses(term: string, includeEmail: boolean): Prisma.UserWhereInput[] {
  const clauses: Prisma.UserWhereInput[] = [{ name: containsInsensitive(term) }]
  if (includeEmail) clauses.push({ email: containsInsensitive(term) })
  return clauses
}

export function buildTaskSearchWhere(params: {
  terms: string[]
  status?: TaskStatus
  phase?: string
  projectId?: string
  user?: SearchUserContext
}): Prisma.TaskWhereInput {
  const and: Prisma.TaskWhereInput[] = []
  const phase = toNonEmpty(params.phase)
  const projectId = toNonEmpty(params.projectId)
  const includeEmail = Boolean(params.user)

  if (params.terms.length > 0) {
    and.push({
      OR: params.terms.flatMap((term) => buildTaskKeywordClauses(term, includeEmail)),
    })
  }

  if (params.status) and.push({ status: params.status })
  if (phase) and.push({ phase: containsInsensitive(phase) })
  if (projectId) and.push({ projectId })

  if (params.user && !isAdmin(params.user.role)) {
    and.push({
      OR: [{ assigneeId: params.user.id }, { createdById: params.user.id }],
    })
  }

  return {
    deletedAt: null,
    project: { isArchived: false, completedAt: null },
    ...(and.length > 0 ? { AND: and } : {}),
  }
}

export function buildProjectSearchWhere(terms: string[]): Prisma.ProjectWhereInput {
  return {
    isArchived: false,
    completedAt: null,
    ...(terms.length > 0
      ? {
          OR: terms.flatMap((term) => buildProjectKeywordClauses(term)),
        }
      : {}),
  }
}

export function buildMemberSearchWhere(terms: string[], includeEmail: boolean): Prisma.UserWhereInput {
  return {
    isActive: true,
    ...(terms.length > 0
      ? {
          OR: terms.flatMap((term) => buildMemberKeywordClauses(term, includeEmail)),
        }
      : {}),
  }
}

function emptySearchResponse(rawQuery: string): SearchResponsePayload {
  return {
    tasks: [],
    projects: [],
    members: [],
    meta: {
      query: rawQuery,
      normalizedQuery: "",
      tokens: [],
      tookMs: 0,
    },
  }
}

export async function runSearch(options: RunSearchOptions): Promise<SearchResponsePayload> {
  const started = Date.now()
  const query = options.filters.q ?? ""
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return emptySearchResponse(query)

  const baseTokens = tokenizeSearchQuery(normalizedQuery)
  const dynamicAliasMap = await loadDynamicAliasMap(baseTokens, options.filters.projectId)
  const aliasMap = mergeAliasMaps(STATIC_TOKEN_ALIASES, dynamicAliasMap)
  const expandedTokens = expandTokensWithAliases(baseTokens, aliasMap)
  const searchTerms = unique([normalizedQuery, ...expandedTokens])

  const scope = options.filters.scope
  const canApplyTaskFilter = !scope || scope === SearchScope.TASK
  const limit = clampLimit(options.limit)

  const [tasks, projects, members] = await Promise.all([
    !scope || scope === SearchScope.TASK
      ? prisma.task.findMany({
          where: buildTaskSearchWhere({
            terms: searchTerms,
            status: canApplyTaskFilter ? options.filters.status : undefined,
            phase: canApplyTaskFilter ? options.filters.phase : undefined,
            projectId: canApplyTaskFilter ? options.filters.projectId : undefined,
            user: options.user,
          }),
          select: { id: true, title: true, phase: true, status: true, projectId: true },
          take: limit,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !scope || scope === SearchScope.PROJECT
      ? prisma.project.findMany({
          where: buildProjectSearchWhere(searchTerms),
          select: { id: true, name: true, description: true },
          take: limit,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !scope || scope === SearchScope.MEMBER
      ? prisma.user.findMany({
          where: buildMemberSearchWhere(searchTerms, Boolean(options.user)),
          select: { id: true, name: true, role: true },
          take: limit,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ])

  return {
    tasks,
    projects,
    members,
    meta: {
      query,
      normalizedQuery,
      tokens: searchTerms,
      tookMs: Date.now() - started,
    },
  }
}
