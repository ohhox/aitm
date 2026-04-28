'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    goals: '',
    techStack: '',
    constraints: '',
    context: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        const parsed = p.constraints ? JSON.parse(p.constraints) : []
        const constraintsText = Array.isArray(parsed) ? parsed.join('\n') : String(parsed)
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          goals: p.goals ?? '',
          techStack: p.techStack ?? '',
          constraints: constraintsText,
          context: p.context ?? '',
        })
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const constraints = form.constraints
        ? form.constraints.split('\n').map((s) => s.trim()).filter(Boolean)
        : []
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, constraints }),
      })
      router.push(`/projects/${id}`)
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5'
  const inputClass = 'w-full bg-white border border-[#E2E6EC] rounded-md px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all'

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">Loading...</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[52px] bg-white border-b border-[#E2E6EC] flex items-center gap-2 px-5 shrink-0">
        <Link href={`/projects/${id}`} className="text-[#9CA3AF] hover:text-[#6B7280] text-xs">← back</Link>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-[#9CA3AF] text-xs truncate max-w-[180px]">{form.name}</span>
        <span className="text-[#9CA3AF] text-xs">/</span>
        <span className="text-sm font-semibold">Edit Project</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-[#E2E6EC] rounded-md overflow-hidden shadow-sm">
            <div className="bg-[#1A2535] px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-white/60">
              Project Details
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>Project Name *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Goals / Deliverables</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Tech Stack</label>
                <input
                  className={inputClass}
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Constraints / Rules
                  <span className="text-[#9CA3AF] font-normal ml-1 normal-case">(1 ข้อต่อบรรทัด)</span>
                </label>
                <textarea
                  className={`${inputClass} resize-none font-mono text-[12px]`}
                  rows={4}
                  value={form.constraints}
                  onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Context / Background
                  <span className="text-[#9CA3AF] font-normal ml-1 normal-case">(ข้อมูลเพิ่มเติมสำหรับ AI)</span>
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={form.context}
                  onChange={(e) => setForm({ ...form, context: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-[#E2E6EC] rounded-md text-sm font-semibold text-[#6B7280] hover:bg-[#F7F8FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
