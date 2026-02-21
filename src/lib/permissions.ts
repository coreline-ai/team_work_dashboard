import { Role, type Task } from "@prisma/client"

export function isAdmin(role: Role) {
  return role === "ADMIN"
}

export function canManageUsers(role: Role) {
  return isAdmin(role)
}

export function canManageProjects(role: Role) {
  return isAdmin(role)
}

export function canReadTask(role: Role, userId: string, task: Pick<Task, "assigneeId" | "createdById">) {
  if (isAdmin(role)) return true
  return task.assigneeId === userId || task.createdById === userId
}

export function canEditTask(role: Role, userId: string, task: Pick<Task, "assigneeId" | "createdById">) {
  if (isAdmin(role)) return true
  return task.assigneeId === userId || task.createdById === userId
}
