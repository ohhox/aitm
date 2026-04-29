# TaskFlow — AI Task Manager

ระบบจัดการงาน AI แบบ local สำหรับติดตามความคืบหน้า, review รายงาน, และสื่อสารกับ AI ผ่าน MCP

## เริ่มต้นใช้งาน

```bash
cd aitm
node start.mjs
```

เปิด browser ที่ `http://localhost:3000`

---

## การ Config MCP สำหรับ Claude

### 1. เพิ่ม MCP Server ใน Claude Desktop

เปิดไฟล์ config ของ Claude Desktop:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

เพิ่ม config นี้:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["D:\\DEV\\task\\aitm\\mcp-server.mjs", "http://localhost:3000"]
    }
  }
}
```

> แก้ path ให้ตรงกับตำแหน่งจริงในเครื่อง

### 2. เพิ่ม MCP Server ใน Claude Code (CLI)

เพิ่มใน `.claude/settings.json` ของ project หรือ global settings:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["D:\\DEV\\task\\aitm\\mcp-server.mjs", "http://localhost:3000"],
      "type": "stdio"
    }
  }
}
```

หรือรันผ่าน command line:

```bash
claude mcp add taskflow -- node "D:\DEV\task\aitm\mcp-server.mjs" http://localhost:3000
```

### 3. ตรวจสอบว่า MCP ทำงาน

รัน TaskFlow ก่อน แล้วทดสอบ:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node mcp-server.mjs http://localhost:3000
```

ถ้าได้ response `{"result":{"protocolVersion":"2024-11-05",...}}` แสดงว่าใช้งานได้

---

## MCP Tools ที่มี

| Tool | คำอธิบาย |
|------|----------|
| `list_projects` | ดูรายการ projects ทั้งหมด |
| `get_project_context` | อ่าน context, tasks, และ instructions ของ project |
| `submit_plan` | AI ส่ง task tree ให้ human review (ใช้ตอน status = planning) |
| `log_activity` | บันทึก activity log แบบ real-time |
| `update_task_status` | อัพเดตสถานะ task (todo → in_progress → done) |
| `submit_report` | ส่งรายงานสรุปเมื่อ task เสร็จ |
| `read_review` | อ่านผล review จาก human |

---

## Prompt สำหรับใช้กับ Claude

### เริ่ม project ใหม่ (planning phase)

```
คุณเป็น AI developer ที่ทำงานผ่านระบบ TaskFlow

กฎ:
1. เริ่มด้วย get_project_context (project_id: [ID])
2. วิเคราะห์ project แล้วเรียก submit_plan พร้อม task tree
3. หยุดรอ human approve plan ก่อนเริ่มทำงาน
4. ทำงานทีละ task: update_task_status → in_progress, log ทุก step, submit_report เมื่อเสร็จ
5. หยุดรอ review ก่อน task ถัดไปเสมอ

เริ่มเลย
```

### ทำงานต่อจาก task ที่ approve แล้ว

```
คุณเป็น AI developer ที่ทำงานผ่านระบบ TaskFlow
เรียก get_project_context (project_id: [ID]) แล้วทำ task ถัดไปที่ยังไม่เสร็จ
log ทุก step และ submit_report เมื่อ task เสร็จ
```

---

## วิธีหา Project ID

เปิด browser → คลิก project → ดู URL: `http://localhost:3000/projects/[ID]`

หรือสั่ง Claude ให้เรียก `list_projects` เพื่อดู ID ทั้งหมด
