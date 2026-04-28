'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Task {
  id: number
  title: string
  parentId: number | null
}

export default function NewTaskPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    parentId: '',
    acceptanceCriteria: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => setTasks(p.tasks || []))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const criteria = form.acceptanceCriteria
        ? form.acceptanceCriteria.split('\n').map((s) => s.trim()).filter(Boolean)
        : []
      await fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          parentId: form.parentId ? Number(form.parentId) : null,
          acceptanceCriteria: criteria,
          notes: form.notes || null,
        }),
      })
      router.push(`/projects/${id}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full bg-white border border-[#E2E6EC] rounded-md px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href={`/projects/${id}`} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">← back</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold">Add Task</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
            <div className="bg-[#1A2535] px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-white/60">Task Details</div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input className={inputClass} placeholder="ชื่อ task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div>
                <label className={labelClass}>Parent Task <span className="normal-case font-normal text-[#9CA3AF]">(ว่างไว้ = root task)</span></label>
                <select className={inputClass} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">— Root Task —</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="รายละเอียดของ task" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>
                  Acceptance Criteria
                  <span className="text-[#9CA3AF] font-normal ml-1 normal-case">(1 ข้อต่อบรรทัด)</span>
                </label>
                <textarea
                  className={`${inputClass} resize-none font-mono text-[12px]`}
                  rows={4}
                  placeholder={"GET /products returns paginated list\nPOST /products validates input\nUnit tests coverage > 80%"}
                  value={form.acceptanceCriteria}
                  onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Notes <span className="text-[#9CA3AF] font-normal normal-case">(ข้อควรระวัง, hints สำหรับ AI)</span></label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="ระวัง N+1 query, cache TTL ยังไม่กำหนด..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[#E2E6EC] rounded-md text-sm font-semibold text-[#6B7280] hover:bg-[#F7F8FA] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
