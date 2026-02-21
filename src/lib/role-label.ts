import type { Role } from "@/types/domain"

export function getRoleLabel(role?: Role | null) {
  if (role === "ADMIN") return "팀장"
  if (role === "MEMBER") return "팀원"
  return "게스트"
}
