/**
 * TaskFlow MCP Server
 *
 * เชื่อมต่อกับ TaskFlow API ผ่าน MCP protocol (stdio)
 * ให้ AI ใช้เครื่องมือเหล่านี้เพื่อจัดการ task และรายงานความคืบหน้า
 *
 * ใช้งาน: node mcp-server.mjs [BASE_URL]
 * ค่าเริ่มต้น: http://localhost:3000
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = process.argv[2] || 'http://localhost:3000'

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch {
    return { ok: res.ok, status: res.status, data: text }
  }
}

const server = new McpServer({
  name: 'taskflow',
  version: '1.0.0',
})

// ─── get_project_context ────────────────────────────────────────────────────
server.tool(
  'get_project_context',
  'อ่านข้อมูล project ทั้งหมด รวมถึง current task, task tree, goals, constraints และคำแนะนำขั้นตอนต่อไป',
  { project_id: z.number().describe('ID ของ project') },
  async ({ project_id }) => {
    const { ok, data } = await api(`/api/ai/projects/${project_id}/context`)
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    }
  }
)

// ─── submit_plan ────────────────────────────────────────────────────────────
server.tool(
  'submit_plan',
  'ส่ง task tree ที่วางแผนไว้ให้ human review ก่อนเริ่มทำงาน (ใช้ตอน project status = planning)',
  {
    project_id: z.number().describe('ID ของ project'),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      acceptanceCriteria: z.array(z.string()).optional(),
      notes: z.string().optional(),
      subtasks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        acceptanceCriteria: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })).optional(),
    })).describe('รายการ tasks ระดับ root (อาจมี subtasks ซ้อน)'),
  },
  async ({ project_id, tasks }) => {
    const { ok, data } = await api(`/api/ai/projects/${project_id}/plan`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return {
      content: [{
        type: 'text',
        text: `Plan submitted. ${data.created} tasks created. Status: ${data.projectStatus}\n\nรอ human approve plan ก่อนจึงจะเริ่มทำงานได้`,
      }],
    }
  }
)

// ─── log_activity ────────────────────────────────────────────────────────────
server.tool(
  'log_activity',
  'บันทึก activity log ขณะทำงาน เพื่อให้ human เห็น real-time progress',
  {
    project_id: z.number().describe('ID ของ project'),
    message: z.string().describe('ข้อความที่ต้องการบันทึก'),
    task_id: z.number().optional().describe('ID ของ task ที่กำลังทำ (ถ้ามี)'),
    level: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional().describe('ระดับความสำคัญ (default: INFO)'),
    step: z.number().optional().describe('ขั้นตอนปัจจุบัน เช่น 1'),
    total_steps: z.number().optional().describe('จำนวนขั้นตอนทั้งหมด เช่น 5'),
  },
  async ({ project_id, message, task_id, level, step, total_steps }) => {
    const { ok, data } = await api('/api/ai/activity', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project_id,
        taskId: task_id,
        message,
        level: level || 'INFO',
        step,
        totalSteps: total_steps,
      }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return { content: [{ type: 'text', text: `Logged: ${message}` }] }
  }
)

// ─── update_task_status ──────────────────────────────────────────────────────
server.tool(
  'update_task_status',
  'อัพเดตสถานะของ task: todo → in_progress → pending_review (ห้ามตั้งเป็น done เอง)',
  {
    task_id: z.number().describe('ID ของ task'),
    status: z.enum(['in_progress', 'pending_review', 'todo']).describe('สถานะใหม่'),
  },
  async ({ task_id, status }) => {
    const { ok, data } = await api(`/api/ai/tasks/${task_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return { content: [{ type: 'text', text: `Task ${task_id} status → ${status}` }] }
  }
)

// ─── submit_report ───────────────────────────────────────────────────────────
server.tool(
  'submit_report',
  'ส่ง completion report หลังทำ task เสร็จ พร้อมรายงานว่าทำอะไรไป และจะตั้ง task status เป็น pending_review โดยอัตโนมัติ',
  {
    task_id: z.number().describe('ID ของ task ที่ทำเสร็จ'),
    summary: z.string().describe('สรุปว่าทำอะไรไปบ้าง'),
    files_changed: z.array(z.object({
      path: z.string(),
      action: z.enum(['created', 'modified', 'deleted']),
      description: z.string().optional(),
    })).optional().describe('รายการไฟล์ที่แก้ไข'),
    concerns: z.string().optional().describe('ข้อควรระวัง หรือปัญหาที่อาจเกิดขึ้น'),
  },
  async ({ task_id, summary, files_changed, concerns }) => {
    const { ok, data } = await api(`/api/ai/tasks/${task_id}/report`, {
      method: 'POST',
      body: JSON.stringify({ summary, filesChanged: files_changed, concerns }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return {
      content: [{
        type: 'text',
        text: `Report submitted for task ${task_id}. Status → pending_review\n\nรอ human review ก่อนจึงจะทำ task ถัดไปได้`,
      }],
    }
  }
)

// ─── read_review ─────────────────────────────────────────────────────────────
server.tool(
  'read_review',
  'อ่านผลการ review จาก human หลังส่ง report ไปแล้ว — ใช้เพื่อตรวจสอบว่า approved หรือต้อง revision',
  {
    task_id: z.number().describe('ID ของ task ที่ส่ง report ไปแล้ว'),
  },
  async ({ task_id }) => {
    const { ok, data } = await api(`/api/ai/tasks/${task_id}/review`)
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    }
  }
)

// ─── list_projects ───────────────────────────────────────────────────────────
server.tool(
  'list_projects',
  'ดูรายการ projects ทั้งหมดในระบบ',
  {},
  async () => {
    const { ok, data } = await api('/api/projects')
    if (!ok) return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }] }
    const summary = data.map((p) =>
      `[${p.id}] ${p.name} — status: ${p.status}, tasks: ${p.taskCount}, done: ${p.doneCount}`
    ).join('\n')
    return { content: [{ type: 'text', text: summary || 'ไม่มี projects' }] }
  }
)

// ─── Start server ────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`TaskFlow MCP Server started — BASE_URL: ${BASE_URL}`)
