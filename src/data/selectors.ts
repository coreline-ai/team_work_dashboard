import { MemberSummary, PhaseSummary, Task, TaskStatus, TeamMember } from "@/data/types"

export function getPhaseSummaries(taskList: Task[]): PhaseSummary[] {
    const phaseMap = new Map<string, Omit<PhaseSummary, "progress">>()

    for (const task of taskList) {
        const current = phaseMap.get(task.phase) ?? {
            phase: task.phase,
            totalTasks: 0,
            completedTasks: 0,
            delayedTasks: 0,
        }

        current.totalTasks += 1
        if (task.status === TaskStatus.COMPLETED) current.completedTasks += 1
        if (task.status === TaskStatus.DELAYED) current.delayedTasks += 1

        phaseMap.set(task.phase, current)
    }

    return Array.from(phaseMap.values()).map((summary) => ({
        ...summary,
        progress: summary.totalTasks === 0
            ? 0
            : Math.round((summary.completedTasks / summary.totalTasks) * 100),
    }))
}

export function getMemberSummaries(taskList: Task[], members: TeamMember[]): MemberSummary[] {
    return members.map((member) => {
        const assignedTasks = taskList.filter((task) => task.assignee.id === member.id)
        const completedTasks = assignedTasks.filter((task) => task.status === TaskStatus.COMPLETED).length
        const inProgressTasks = assignedTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
        const delayedTasks = assignedTasks.filter((task) => task.status === TaskStatus.DELAYED).length

        return {
            memberId: member.id,
            name: member.name,
            role: member.role,
            totalTasks: assignedTasks.length,
            inProgressTasks,
            delayedTasks,
            completionRate: assignedTasks.length === 0
                ? 0
                : Math.round((completedTasks / assignedTasks.length) * 100),
        }
    })
}
