import React, { useState } from "react";
import { Layout, Row, Col, Card, Space, Tag, Typography, Button, Input, Upload, message } from "antd";
import { ArrowLeftOutlined, SendOutlined, PaperClipOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import PatientActionsForm from "../components/PatientActionsForm";
import type { Patient, Note, Task, RouteEvent, ChatMsg } from "../types";

const { Content } = Layout;
const { Text } = Typography;

const ChatPage: React.FC<{
  getById: (id: string) => Patient | undefined;
  upsert: (id: string, patch: Partial<Patient>) => void;
}> = ({ getById, upsert }) => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const patient = getById(id);
  const [msg, setMsg] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const onAddFile = (file: any) => { setFiles((prev) => [...prev, file]); return false; };
  const onRemoveFile = (file: any) => setFiles((prev) => prev.filter((f) => f.uid !== file.uid));

  if (!patient) {
    return (
      <Content className="p-4">
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>Назад</Button> Пациент не найден
      </Content>
    );
  }

  // левый блок: действия
  const addNote = (text: string) => {
    if (!text?.trim()) return;
    const note: Note = { id: crypto.randomUUID(), text: text.trim(), at: new Date().toISOString() };
    upsert(patient.id, { notes: [note, ...(patient.notes ?? [])] });
    message.success("Заметка добавлена");
  };
  const addTask = (text: string, due?: string, kind: "task" | "consult" = "task") => {
    if (!text?.trim()) return;
    const task: Task = { id: crypto.randomUUID(), text: kind === "consult" ? `Консультация: ${text.trim()}` : text.trim(), due, done: false };
    upsert(patient.id, { tasks: [...(patient.tasks ?? []), task] });
    message.success(kind === "consult" ? "Консультация запланирована" : "Задача создана");
  };
  const addRoute = (dateISO: string, toOrg: string, comment?: string) => {
    const ev: RouteEvent = { id: crypto.randomUUID(), date: dateISO, toOrg, comment };
    upsert(patient.id, { routes: [ev, ...(patient.routes ?? [])] });
    message.success("Маршрутизация запланирована");
  };

  // правый чат
  const send = () => {
    const text = msg.trim();
    if (!text && files.length === 0) return;
    const payloadFiles = files.map((f) => ({ uid: f.uid, name: f.name, size: f.size }));
    const m: ChatMsg = { id: crypto.randomUUID(), who: "Вы", text, at: new Date().toLocaleTimeString().slice(0, 5), files: payloadFiles.length ? payloadFiles : undefined };
    upsert(patient.id, { chat: [...(patient.chat ?? []), m] });
    setMsg(""); setFiles([]);
  };

  // лента
  const feedTasks  = (patient.tasks ?? []).map((t) => ({ type: "tasks" as const,  date: t.due ?? new Date().toISOString(), title: t.text }));
  const feedRoutes = (patient.routes ?? []).map((r) => ({ type: "routes" as const, date: r.date, title: `Перевод → ${r.toOrg}${r.comment ? ` (${r.comment})` : ""}` }));
  const feedNotes  = (patient.notes ?? []).map((n) => ({ type: "notes" as const,  date: n.at, title: n.text }));
  const feed       = [...feedTasks, ...feedRoutes, ...feedNotes].sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <Content className="p-4" style={{ overflow: "auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Назад</Button>
        <Text strong>Действие над пациентом</Text>
      </Space>

      <Row gutter={16}>
        {/* Левая колонка */}
        <Col span={12}>
          <PatientActionsForm
            onAddNote={(text) => addNote(text)}
            onAddTask={(t, d) => addTask(t, d, "task")}
            onAddConsult={(t, d) => addTask(t, d, "consult")}
            onAddRoute={addRoute}
          />
          <Card className="rounded-xl" title="Лента событий" style={{ marginTop: 12 }}>
            <Space direction="vertical" className="w-full">
              {feed.map((i, idx) => (
                <div key={idx} style={{ borderRadius: 10, padding: "10px 12px", background: i.type === "tasks" ? "#e7e9ff" : i.type === "routes" ? "#ffe9e2" : "#f3f4f6" }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Tag bordered>{new Date(i.date).toLocaleDateString()}</Tag>
                    <div style={{ opacity: 0.6 }}>{i.type === "tasks" ? "Задача" : i.type === "routes" ? "Маршрутизация" : "Заметка"}</div>
                  </Space>
                  <div style={{ marginTop: 6 }}>{i.title}</div>
                </div>
              ))}
              {!feed.length && <Text type="secondary">Нет записей.</Text>}
            </Space>
          </Card>
        </Col>

        {/* Правая колонка: чат пациента */}
        <Col span={12}>
          <Card className="rounded-xl" title={<Space wrap size={8}>
            <Tag bordered>{patient.name}</Tag><Tag bordered>{patient.code}</Tag><Tag bordered>{patient.unit}</Tag>
            <Tag bordered>{patient.bed}</Tag><Tag bordered>{patient.caseId}</Tag></Space>}
          >
            <div style={{ height: 520, overflow: "auto", paddingRight: 8, marginBottom: 8 }}>
              <Space direction="vertical" className="w-full">
                {(patient.chat ?? []).map((m) => (
                  <Card size="small" key={m.id} className="rounded-lg">
                    <Text strong>{m.who}</Text>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>{m.at}</div>
                    <div style={{ marginTop: 6 }}>{m.text}</div>
                    {m.files?.length ? (
                      <Space wrap style={{ marginTop: 8 }}>
                        {m.files.map((f, i) => (
                          <Tag key={`${m.id}-${i}`} icon={<PaperClipOutlined />}>
                            {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </Card>
                ))}
              </Space>
            </div>

            <div style={{ position: "sticky", bottom: 0, background: "#fff", paddingTop: 8 }}>
              {files.length > 0 && (
                <Space wrap style={{ marginBottom: 8 }}>
                  {files.map((f: any) => (
                    <Tag key={f.uid} closable onClose={(e) => { e.preventDefault(); onRemoveFile(f); }} icon={<PaperClipOutlined />}>
                      {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                    </Tag>
                  ))}
                </Space>
              )}
              <div style={{ border: "1px solid #e6efec", background: "#f7f9f8", borderRadius: 14, padding: 6, display: "flex", alignItems: "flex-end", gap: 6 }}>
                <Upload multiple showUploadList={false} beforeUpload={onAddFile}><Button type="text" icon={<PaperClipOutlined />} /></Upload>
                <Input.TextArea value={msg} onChange={(e) => setMsg(e.target.value)} autoSize={{ minRows: 1, maxRows: 4 }} placeholder="Введите сообщение" bordered={false}
                  onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }} style={{ background: "transparent" }} />
                <Button type="text" shape="circle" icon={<SendOutlined />} onClick={send} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default ChatPage;
