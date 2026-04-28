'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Task {
  id: number
  title: string
  status: string
  parentId: number | null
  children: Task[]
  report?: { id: number; status: string } | null
}

interface Log {
  id: number
  message: string
  level: string
  step?: number | null
  totalSteps?: number | null
  createdAt: string
  task?: { id: number; title: string } | null
}

interface Project {
  id: number
  name: string
  status: string
  techStack: string | null
  tasks: Task[]
}

const statusConfig: Record<string, { dot: string; text: string; badge?: string }> = {
  done:           { dot: 'bg-green-500', text: 'line-through text-[#9CA3AF]' },
  in_progress:    { dot: 'border-2 border-blue-500 bg-blue-50', text: 'text-blue-700 font-semibold', badge: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  pending_review: { dot: 'border-2 border-red-500 bg-red-50',  text: 'text-red-700 font-semibold', badge: 'bg-red-100 text-red-700 border-red-300' },
  blocked:        { dot: 'border-2 border-yellow-500 bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  todo:           { dot: 'border border-[#CDD2DA]', text: 'text-[#6B7280]' },
}

const levelConfig: Record<string, { label: string; color: string }> = {
  INFO: { label: 'INFO', color: 'text-blue-600' },
  DONE: { label: 'DONE', color: 'text-green-600' },
  WARN: { label: 'WARN', color: 'text-yellow-600' },
  WAIT: { label: 'WAIT', color: 'text-red-600' },
  STEP: { label: 'STEP', color: 'text-[#9CA3AF]' },
}

function TaskRow({ task, depth = 0 }: { task: Task; depth?: number }) {
  const [open, setOpen] = useState(depth === 0)
  const cfg = statusConfig[task.status] || statusConfig.todo
  const hasChildren = task.children && task.children.length > 0
  const badgeLabel = task.status === 'pending_review' ? 'Review' : task.status === 'in_progress' ? 'Active' : null

  return (
    <div>
      <div
        className={`flex items-center border-b border-[#E2E6EC] transition-colors hover:bg-blue-50 cursor-pointer ${
          task.status === 'pending_review' ? 'bg-red-50/60' : ''
        }`}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <div style={{ paddingLeft: `${depth * 24 + 14}px` }} className="flex items-center gap-2 flex-1 py-2 pr-3">
          {hasChildren ? (
            <span className={`text-[8px] text-[#9CA3AF] w-4 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <div className={`w-[14px] h-[14px] rounded-full shrink-0 flex items-center justify-center ${cfg.dot}`}>
            {task.status === 'done' && <span className="text-white text-[8px]">✓</span>}
          </div>
          <span className={`text-[12.5px] flex-1 ${cfg.text}`}>{task.title}</span>
          {badgeLabel && (
            <span className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded border ${cfg.badge}`}>{badgeLabel}</span>
          )}
        </div>
      </div>
      {open && hasChildren && (
        <div>
          {task.children.map((child) => (
            <TaskRow key={child.id} task={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [activeTab, setActiveTab] = useState<'activity' | 'detail' | 'history'>('activity')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then(setProject)
    fetch(`/api/projects/${id}/activity`)
      .then((r) => r.json())
      .then(setLogs)
  }, [id])

  // SSE for real-time logs
  useEffect(() => {
    const es = new EventSource(`/api/projects/${id}/events`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'activity') {
        setLogs((prev) => prev.some((l) => l.id === data.log.id) ? prev : [data.log, ...prev])
      }
    }
    return () => es.close()
  }, [id])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">Loading...</div>
    )
  }

  const allTasks = project.tasks.flatMap((t) => [t, ...t.children])
  const pendingReviews = allTasks.filter((t) => t.status === 'pending_review')

  // Group logs by date
  const groupedLogs: { date: string; logs: Log[] }[] = []
  for (const log of logs) {
    const date = new Date(log.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' })
    const last = groupedLogs[groupedLogs.length - 1]
    if (last?.date === date) {
      last.logs.push(log)
    } else {
      groupedLogs.push({ date, logs: [log] })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <button onClick={() => router.push('/')} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">← Dashboard</button>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold truncate max-w-[200px]">{project.name}</span>
        {project.techStack && (
          <span className="text-[11px] text-[#9CA3AF] border border-[#E2E6EC] px-2 py-0.5 rounded">{project.techStack}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            project.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
            project.status === 'planning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
            'bg-gray-100 text-gray-500 border border-gray-300'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />{project.status}
          </span>
          <Link href={`/projects/${id}/tasks/new`} className="text-xs font-semibold border border-[#E2E6EC] px-3 py-1.5 rounded hover:bg-[#F7F8FA] transition-colors">
            + Add Task
          </Link>
        </div>
      </div>

      {/* Pending review alert */}
      {pendingReviews.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2 text-sm text-red-700 shrink-0">
          <strong>{pendingReviews[0].title}</strong> เสร็จแล้ว — รอ review จากคุณ
          <Link href={`/projects/${id}/reviews`} className="ml-auto bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-700 transition-colors">
            View Report →
          </Link>
        </div>
      )}

      {project.status === 'planning' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-2 flex items-center gap-2 text-sm text-yellow-700 shrink-0">
          <span>ℹ</span> โปรเจดอยู่ในขั้น Planning — รอ AI สร้างแผนหรือ approve plan ที่มีอยู่
          <Link href={`/projects/${id}/plan`} className="ml-auto bg-yellow-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-yellow-700 transition-colors">
            Review Plan →
          </Link>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
        {/* Task Tree */}
        <div className="border-r border-[#E2E6EC] bg-white flex flex-col overflow-hidden">
          <div className="bg-[#F7F8FA] px-3.5 py-2 border-b border-[#E2E6EC] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Task Tree</span>
            <span className="text-[11px] font-semibold text-[#9CA3AF]">
              {allTasks.filter((t) => t.status === 'done').length} / {allTasks.length}
            </span>
          </div>
          <div className="overflow-y-auto flex-1">
            {project.tasks.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#9CA3AF]">
                ยังไม่มี tasks
                <br />
                <Link href={`/projects/${id}/tasks/new`} className="text-blue-600 hover:underline text-xs mt-1 inline-block">+ เพิ่ม task</Link>
              </div>
            ) : (
              project.tasks.map((t) => <TaskRow key={t.id} task={t} depth={0} />)
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col overflow-hidden bg-white">
          {/* Tabs */}
          <div className="flex border-b border-[#E2E6EC] bg-[#F7F8FA] px-3.5 shrink-0">
            {(['activity', 'detail', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-[#9CA3AF] border-transparent hover:text-[#6B7280]'
                }`}
              >
                {tab === 'activity' ? 'Activity Log' : tab === 'detail' ? 'Task Detail' : 'History'}
              </button>
            ))}
            {activeTab === 'activity' && (
              <div className="ml-auto flex items-center gap-2 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11.5px] font-semibold text-[#4B5563]">Live</span>
              </div>
            )}
          </div>

          {/* Activity Log */}
          {activeTab === 'activity' && (
            <div className="flex-1 overflow-y-auto" ref={logRef}>
              {groupedLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#9CA3AF]">ยังไม่มี activity</div>
              ) : (
                groupedLogs.map((group) => (
                  <div key={group.date}>
                    <div className="bg-[#F7F8FA] px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF] border-b border-[#E2E6EC]">
                      {group.date}
                    </div>
                    {group.logs.map((log) => {
                      const cfg = levelConfig[log.level] || levelConfig.INFO
                      const time = new Date(log.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={log.id} className="grid grid-cols-[52px_40px_1fr] border-b border-[#E2E6EC] hover:bg-[#F7F8FA] transition-colors">
                          <div className="font-mono text-[10.5px] text-[#9CA3AF] px-3 py-2.5 border-r border-[#E2E6EC]">{time}</div>
                          <div className={`font-mono text-[9.5px] font-bold ${cfg.color} flex items-start justify-center pt-2.5 border-r border-[#E2E6EC]`}>
                            {cfg.label}
                          </div>
                          <div className="px-3 py-2">
                            <div className="text-[12.5px] text-[#111827] leading-snug">{log.message}</div>
                            {log.step != null && log.totalSteps != null && (
                              <div className="flex gap-1 mt-1.5 items-center">
                                {Array.from({ length: log.totalSteps }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-[4px] w-4 rounded-full ${i < log.step! ? 'bg-blue-500' : 'bg-[#E2E6EC]'}`}
                                  />
                                ))}
                                <span className="text-[10px] text-[#9CA3AF] ml-1">{log.step}/{log.totalSteps}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Task detail placeholder */}
          {activeTab === 'detail' && (
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm text-[#9CA3AF]">คลิก task ใน tree เพื่อดูรายละเอียด</p>
            </div>
          )}

          {/* History placeholder */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm text-[#9CA3AF]">History ของทุก review จะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
