'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Task {
  id: number
  title: string
  description: string | null
  acceptanceCriteria: string | null
  notes: string | null
  children: Task[]
  order: number
}

interface Project {
  id: number
  name: string
  status: string
  techStack: string | null
  goals: string | null
  constraints: string | null
  tasks: Task[]
}

export default function PlanReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [open, setOpen] = useState<Set<number>>(new Set([0]))
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setProject(p)
        setOpen(new Set([p.tasks[0]?.id]))
      })
  }, [id])

  const approve = async () => {
    setApproving(true)
    await fetch(`/api/projects/${id}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    router.push(`/projects/${id}`)
  }

  const toggleTask = (taskId: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  if (!project) return <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">Loading...</div>

  const parsedConstraints = project.constraints ? JSON.parse(project.constraints) : []
  const constraints: string[] = Array.isArray(parsedConstraints)
    ? parsedConstraints
    : String(parsedConstraints).split('\n').filter(Boolean)
  const totalTasks = project.tasks.reduce((s, t) => s + 1 + t.children.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href="/" className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">Dashboard</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <Link href={`/projects/${id}`} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs truncate max-w-[160px]">{project.name}</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold">Plan Review</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded-full font-semibold">Planning</span>
          <span className="text-[12px] text-[#9CA3AF]">AI สร้างแผนแล้ว</span>
          <Link href={`/projects/${id}/tasks/new`} className="text-xs font-semibold border border-[#E2E6EC] px-3 py-1.5 rounded hover:bg-[#F7F8FA] transition-colors">
            ✏ Edit Tasks
          </Link>
          <button
            onClick={approve}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors disabled:opacity-60"
          >
            {approving ? 'Approving...' : '✓ Approve Plan'}
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 text-sm text-blue-700 shrink-0">
        ℹ ตรวจสอบ task plan — เมื่อ <strong>Approve</strong> แล้ว AI จะเริ่มทำงาน Task แรกทันที
      </div>

      {/* Main */}
      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_280px]">
        {/* Task plan */}
        <div className="overflow-y-auto p-5 border-r border-[#E2E6EC]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-3 pb-2 border-b border-[#E2E6EC]">
            AI-Generated Task Plan — {project.tasks.length} Phases · {totalTasks} Tasks
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#9CA3AF]">
              AI ยังไม่ได้สร้างแผน — รอ AI call{' '}
              <code className="font-mono text-xs bg-[#F7F8FA] px-1.5 py-0.5 rounded">POST /api/ai/projects/{id}/plan</code>
            </div>
          ) : (
            <div className="border border-[#E2E6EC] rounded-md overflow-hidden">
              {project.tasks.map((task, idx) => (
                <div key={task.id}>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#F7F8FA] border-b border-[#E2E6EC] cursor-pointer hover:bg-[#EEF0F4] transition-colors"
                    onClick={() => toggleTask(task.id)}
                  >
                    <span className="font-mono text-[11px] font-bold text-[#9CA3AF] w-6 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-[8px] text-[#9CA3AF] transition-transform ${open.has(task.id) ? 'rotate-90' : ''}`}>▶</span>
                    <span className="font-semibold text-[13px] text-[#111827] flex-1">{task.title}</span>
                    <span className="text-[11px] text-[#9CA3AF]">{task.children.length} subtasks</span>
                  </div>
                  {open.has(task.id) && (
                    <div>
                      {task.children.map((sub) => {
                        const criteria = sub.acceptanceCriteria ? JSON.parse(sub.acceptanceCriteria) as string[] : []
                        return (
                          <div key={sub.id} className="flex gap-2 items-start px-4 py-2.5 border-b border-[#E2E6EC] bg-white pl-12 hover:bg-[#F7F8FA] transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full border border-[#CDD2DA] mt-1.5 shrink-0" />
                            <div>
                              <div className="text-[12.5px] text-[#4B5563]">{sub.title}</div>
                              {sub.description && <div className="text-[11.5px] text-[#9CA3AF] mt-0.5">{sub.description}</div>}
                              {criteria.length > 0 && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  {criteria.map((c, i) => (
                                    <div key={i} className="text-[10.5px] text-[#9CA3AF] flex gap-1.5">
                                      <span className="text-[#D1D5DB]">→</span>{c}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="overflow-y-auto p-4 bg-white space-y-4">
          <div className="border border-[#E2E6EC] rounded-md overflow-hidden">
            <div className="bg-[#1A2535] px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-white/60">Project Info</div>
            <div className="divide-y divide-[#E2E6EC]">
              {[
                { key: 'Name', val: project.name },
                { key: 'Stack', val: project.techStack },
                { key: 'Goals', val: project.goals },
                { key: 'Status', val: project.status },
              ].map(({ key, val }) =>
                val ? (
                  <div key={key} className="flex gap-2 px-3 py-2 text-[12px]">
                    <span className="text-[#9CA3AF] font-semibold w-14 shrink-0">{key}</span>
                    <span className="text-[#111827]">{val}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-[#E2E6EC] rounded-md p-3 text-center">
              <div className="text-[22px] font-extrabold text-blue-600 tracking-tight">{project.tasks.length}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">phases</div>
            </div>
            <div className="bg-white border border-[#E2E6EC] rounded-md p-3 text-center">
              <div className="text-[22px] font-extrabold text-blue-600 tracking-tight">{totalTasks}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">total tasks</div>
            </div>
          </div>

          {constraints.length > 0 && (
            <div className="border border-[#E2E6EC] rounded-md overflow-hidden">
              <div className="bg-[#1A2535] px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-white/60">Constraints</div>
              <div className="p-3 space-y-1.5">
                {constraints.map((c, i) => (
                  <div key={i} className="flex gap-2 text-[12px] text-[#4B5563]">
                    <span className="text-blue-600 font-bold">→</span>{c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
