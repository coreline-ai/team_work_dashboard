import { hash } from "bcryptjs"
import { PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client"
import { project, tasks, teamMembers } from "../src/data/mock-data"

const prisma = new PrismaClient()

function toTaskStatus(value: string): TaskStatus {
  switch (value) {
    case "completed":
      return TaskStatus.COMPLETED
    case "in_progress":
      return TaskStatus.IN_PROGRESS
    case "pending":
      return TaskStatus.PENDING
    case "delayed":
      return TaskStatus.DELAYED
    default:
      return TaskStatus.PENDING
  }
}

function toTaskPriority(value: string): TaskPriority {
  switch (value) {
    case "high":
      return TaskPriority.HIGH
    case "medium":
      return TaskPriority.MEDIUM
    case "low":
      return TaskPriority.LOW
    default:
      return TaskPriority.MEDIUM
  }
}

async function main() {
  const defaultPassword = await hash("Password123!", 10)

  await prisma.notification.deleteMany()
  await prisma.searchHistory.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.profileSettings.deleteMany()
  await prisma.user.deleteMany()

  const memberIdToUserId = new Map<string, string>()

  for (const [index, member] of teamMembers.entries()) {
    const email = `user${index + 1}@richprop.local`
    const role = index === 0 ? Role.ADMIN : Role.MEMBER

    const user = await prisma.user.create({
      data: {
        email,
        name: member.name,
        role,
        isActive: true,
        passwordHash: defaultPassword,
        settings: {
          create: {
            notificationInApp: true,
            defaultStartPage: "/",
            locale: "ko-KR",
            timezone: "Asia/Seoul",
          },
        },
      },
    })

    memberIdToUserId.set(member.id, user.id)
  }

  const adminUserId = memberIdToUserId.get("1")
  if (!adminUserId) throw new Error("Admin user seed failed")

  const seededProject = await prisma.project.create({
    data: {
      name: project.name,
      description: project.description,
      createdById: adminUserId,
      isArchived: false,
    },
  })

  const legacyTaskIdToDbTaskId = new Map<string, string>()

  for (const task of tasks) {
    const assigneeId = memberIdToUserId.get(task.assignee.id)
    if (!assigneeId) throw new Error(`Unknown assignee for task ${task.id}`)

    const created = await prisma.task.create({
      data: {
        projectId: seededProject.id,
        title: task.title,
        description: null,
        phase: task.phase,
        status: toTaskStatus(task.status),
        priority: toTaskPriority(task.priority),
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        progress: task.progress,
        parentId: null,
        assigneeId,
        createdById: adminUserId,
        updatedById: adminUserId,
      },
    })

    legacyTaskIdToDbTaskId.set(task.id, created.id)
  }

  for (const task of tasks) {
    if (!task.parentId) continue
    const dbTaskId = legacyTaskIdToDbTaskId.get(task.id)
    const dbParentId = legacyTaskIdToDbTaskId.get(task.parentId)
    if (!dbTaskId || !dbParentId) continue

    await prisma.task.update({
      where: { id: dbTaskId },
      data: { parentId: dbParentId },
    })
  }

  console.log("Seed complete")
  console.log("Admin login: user1@richprop.local / Password123!")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
