import type { ActivityDiffRow } from "@/types/domain"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false
  return !Array.isArray(value)
}

function normalizeObject(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {}
  return value
}

function stableStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function buildActivityDiff(beforeValue: unknown, afterValue: unknown): ActivityDiffRow[] {
  const rows: ActivityDiffRow[] = []

  const walk = (beforeNode: unknown, afterNode: unknown, path: string) => {
    const beforeObj = normalizeObject(beforeNode)
    const afterObj = normalizeObject(afterNode)
    const beforeKeys = Object.keys(beforeObj)
    const afterKeys = Object.keys(afterObj)
    const keys = new Set([...beforeKeys, ...afterKeys])

    for (const key of keys) {
      const nextPath = path ? `${path}.${key}` : key
      const beforeChild = beforeObj[key]
      const afterChild = afterObj[key]
      const beforeExists = Object.prototype.hasOwnProperty.call(beforeObj, key)
      const afterExists = Object.prototype.hasOwnProperty.call(afterObj, key)

      if (beforeExists && afterExists && isPlainObject(beforeChild) && isPlainObject(afterChild)) {
        walk(beforeChild, afterChild, nextPath)
        continue
      }

      if (!beforeExists && afterExists) {
        rows.push({
          fieldPath: nextPath,
          beforeValue: null,
          afterValue: afterChild,
          changeType: "added",
        })
        continue
      }

      if (beforeExists && !afterExists) {
        rows.push({
          fieldPath: nextPath,
          beforeValue: beforeChild,
          afterValue: null,
          changeType: "removed",
        })
        continue
      }

      if (stableStringify(beforeChild) !== stableStringify(afterChild)) {
        rows.push({
          fieldPath: nextPath,
          beforeValue: beforeChild,
          afterValue: afterChild,
          changeType: "changed",
        })
      }
    }
  }

  walk(beforeValue, afterValue, "")
  return rows.sort((a, b) => a.fieldPath.localeCompare(b.fieldPath))
}
