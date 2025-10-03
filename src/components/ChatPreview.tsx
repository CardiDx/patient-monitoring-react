// src/components/ChatPreview.tsx
import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Space,
  Tabs,
  Tag,
  Typography,
  Upload,
} from "antd";
import { PaperClipOutlined, SendOutlined } from "@ant-design/icons";

const { Text } = Typography;

/* ---- минимальные типы ---- */
export type RiskLevel = "high" | "medium" | "low";

export type ChatMsg = {
  id: string;
  who: string;
  text: string;
  at: string; // HH:MM
  files?: { uid?: string; name: string; size?: number }[];
};

export type Note = { id: string; text: string; at: string };
export type Task = { id: string; text: string; due?: string; done?: boolean };
export type RouteEvent = { id: string; date: string; toOrg: string; comment?: string };

export type Patient = {
  id: string;
  unit: string;
  bed: string;
  caseId: string;
  name: string;
  age: string;
  code: string;
  risk: RiskLevel;
  chat?: ChatMsg[];
  tasks?: Task[];
  routes?: RouteEvent[];
  notes?: Note[];
};

export type CommonMessage = {
  id: string;
  who: string;
  text: string;
  at: string;
  files?: { name: string; size?: number }[];
};

type Props = {
  patients?: Patient[]; // ← делаю необязательным, дальше — дефолтное []
  commonMessages?: CommonMessage[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
};

const ChatPreview: React.FC<Props> = ({
  patients = [],
  commonMessages = [],
  onSendCommon,
}) => {
  const [active, setActive] = useState<
    "all" | "patient" | "routes" | "consults" | "tasks" | "notes" | "common"
  >("all");

  // собираем данные
  const patientChats = useMemo(() => {
    return (patients ?? [])
      .map((p) => ({ p, msgs: p.chat ?? [] }))
      .filter((x) => x.msgs.length)
      .map(({ p, msgs }) => ({ p, last: msgs[msgs.length - 1]! }));
  }, [patients]);

  const tasksAll = useMemo(
    () => (patients ?? []).flatMap((p) => (p.tasks ?? []).map((t) => ({ p, t }))),
    [patients]
  );

  const consults = useMemo(
    () => tasksAll.filter((x) => x.t.text?.trim().toLowerCase().startsWith("консультация")),
    [tasksAll]
  );

  const tasks = useMemo(
    () => tasksAll.filter((x) => !x.t.text?.trim().toLowerCase().startsWith("консультация")),
    [tasksAll]
  );

  const routes = useMemo(
    () => (patients ?? []).flatMap((p) => (p.routes ?? []).map((r) => ({ p, r }))),
    [patients]
  );

  const notes = useMemo(
    () => (patients ?? []).flatMap((p) => (p.notes ?? []).map((n) => ({ p, n }))),
    [patients]
  );

  // общий чат — ввод
  const [commonText, setCommonText] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const addFile = (file: any) => {
    setFiles((prev) => [...prev, file]);
    return false;
  };
  const removeFile = (f: any) => setFiles((prev) => prev.filter((x) => x.uid !== f.uid));
  const send = () => {
    const trimmed = commonText.trim();
    const payload = files.map((f) => ({ name: f.name, size: f.size }));
    if (!trimmed && payload.length === 0) return;
    onSendCommon(trimmed, payload);
    setCommonText("");
    setFiles([]);
  };

  // мини-карточка
  const ItemCard: React.FC<{
    title: React.ReactNode;
    meta?: React.ReactNode;
    hint?: "blue" | "orange" | "gray";
    children?: React.ReactNode;
  }> = ({ title, meta, hint, children }) => (
    <Card
      size="small"
      className="rounded-xl"
      styles={{
        body: {
          background:
            hint === "blue" ? "#eef3ff" :
            hint === "orange" ? "#fff2e8" :
            hint === "gray" ? "#f7f7f8" : "#fff",
        },
      }}
    >
      <Space direction="vertical" className="w-full">
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          {meta ? <div style={{ opacity: 0.6 }}>{meta}</div> : null}
        </Space>
        {children}
      </Space>
    </Card>
  );

  // секция с «Показать все»
  const Section: React.FC<{
    title: string;
    target: "patient" | "routes" | "consults" | "tasks" | "notes" | "common";
    children: React.ReactNode;
  }> = ({ title, target, children }) => (
    <div style={{ marginBottom: 12 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Text strong>{title}</Text>
        <Button type="link" size="small" onClick={() => setActive(target)}>
          Показать все
        </Button>
      </Space>
      <Space direction="vertical" className="w-full">{children}</Space>
    </div>
  );

  return (
    <Card
      title="Чаты и планирование"
      className="rounded-xl"
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 210px)",
          paddingBottom: 0,
        },
      }}
    >
      {/* прокручиваемая часть с табами */}
      <div style={{ overflow: "auto", paddingRight: 8 }}>
        <Tabs
          type="scrollable"
          tabBarGutter={20}
          activeKey={active}
          onChange={(k) => setActive(k as any)}
          items={[
            {
              key: "all",
              label: "Все",
              children: (
                <Space direction="vertical" className="w-full">
                  <Section title={`Сообщения пациента • ${patientChats.length}`} target="patient">
                    {patientChats.slice(0, 4).map(({ p, last }) => (
                      <ItemCard
                        key={p.id}
                        title={<>{p.unit} • {p.caseId} • <strong>{p.name}</strong></>}
                        meta={last.at}
                      >
                        <div style={{ opacity: 0.85 }}>{last.text}</div>
                        {last.files?.length ? (
                          <Space wrap style={{ marginTop: 6 }}>
                            {last.files.map((f, i) => (
                              <Tag key={`${p.id}-${i}`} icon={<PaperClipOutlined />}>
                                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                              </Tag>
                            ))}
                          </Space>
                        ) : null}
                      </ItemCard>
                    ))}
                  </Section>

                  <Section title={`Маршрутизация • ${routes.length}`} target="routes">
                    {routes.slice(0, 3).map(({ p, r }) => (
                      <ItemCard
                        key={r.id}
                        hint="orange"
                        title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                        meta={new Date(r.date).toLocaleDateString()}
                      >
                        Перевод → <strong>{r.toOrg}</strong>{r.comment ? ` • ${r.comment}` : ""}
                      </ItemCard>
                    ))}
                  </Section>

                  <Section title={`Консультации • ${consults.length}`} target="consults">
                    {consults.slice(0, 3).map(({ p, t }) => (
                      <ItemCard
                        key={t.id}
                        hint="blue"
                        title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                        meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                      >
                        {t.text}
                      </ItemCard>
                    ))}
                  </Section>

                  <Section title={`Задачи • ${tasks.length}`} target="tasks">
                    {tasks.slice(0, 3).map(({ p, t }) => (
                      <ItemCard
                        key={t.id}
                        title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                        meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                      >
                        {t.text}
                      </ItemCard>
                    ))}
                  </Section>

                  <Section title={`Записи • ${notes.length}`} target="notes">
                    {notes.slice(0, 3).map(({ p, n }) => (
                      <ItemCard
                        key={n.id}
                        hint="gray"
                        title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                        meta={new Date(n.at).toLocaleDateString()}
                      >
                        {n.text}
                      </ItemCard>
                    ))}
                  </Section>

                  <Section title={`Общий чат • ${commonMessages.length}`} target="common">
                    {commonMessages.slice(-3).map((m) => (
                      <ItemCard key={m.id} title={m.who} meta={m.at}>
                        {m.text}
                        {m.files?.length ? (
                          <Space wrap style={{ marginTop: 6 }}>
                            {m.files.map((f, i) => (
                              <Tag key={`${m.id}-${i}`} icon={<PaperClipOutlined />}>
                                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                              </Tag>
                            ))}
                          </Space>
                        ) : null}
                      </ItemCard>
                    ))}
                  </Section>
                </Space>
              ),
            },

            {
              key: "patient",
              label: "Новые сообщения",
              children: (
                <Space direction="vertical" className="w-full">
                  {patientChats.map(({ p, last }) => (
                    <ItemCard
                      key={p.id}
                      title={<>{p.unit} • {p.caseId} • <strong>{p.name}</strong></>}
                      meta={last.at}
                    >
                      <div style={{ opacity: 0.85 }}>{last.text}</div>
                      {last.files?.length ? (
                        <Space wrap style={{ marginTop: 6 }}>
                          {last.files.map((f, i) => (
                            <Tag key={`${p.id}-${i}`} icon={<PaperClipOutlined />}>
                              {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                            </Tag>
                          ))}
                        </Space>
                      ) : null}
                      <Space style={{ marginTop: 8 }}>
                        <Button size="small" onClick={() => window.location.assign(`/patient/${p.id}/chat`)}>
                          Открыть чат
                        </Button>
                      </Space>
                    </ItemCard>
                  ))}
                </Space>
              ),
            },

            {
              key: "routes",
              label: "Маршрутизация",
              children: (
                <Space direction="vertical" className="w-full">
                  {routes.map(({ p, r }) => (
                    <ItemCard
                      key={r.id}
                      hint="orange"
                      title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                      meta={new Date(r.date).toLocaleDateString()}
                    >
                      Перевод → <strong>{r.toOrg}</strong>{r.comment ? ` • ${r.comment}` : ""}
                    </ItemCard>
                  ))}
                </Space>
              ),
            },

            {
              key: "consults",
              label: "Консультации",
              children: (
                <Space direction="vertical" className="w-full">
                  {consults.map(({ p, t }) => (
                    <ItemCard
                      key={t.id}
                      hint="blue"
                      title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                      meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                    >
                      {t.text}
                    </ItemCard>
                  ))}
                </Space>
              ),
            },

            {
              key: "tasks",
              label: "Задачи",
              children: (
                <Space direction="vertical" className="w-full">
                  {tasks.map(({ p, t }) => (
                    <ItemCard
                      key={t.id}
                      title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                      meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                    >
                      {t.text}
                    </ItemCard>
                  ))}
                </Space>
              ),
            },

            {
              key: "notes",
              label: "Записи",
              children: (
                <Space direction="vertical" className="w-full">
                  {notes.map(({ p, n }) => (
                    <ItemCard
                      key={n.id}
                      hint="gray"
                      title={<><Tag bordered>{p.unit}</Tag> {p.name}</>}
                      meta={new Date(n.at).toLocaleDateString()}
                    >
                      {n.text}
                    </ItemCard>
                  ))}
                </Space>
              ),
            },

            {
              key: "common",
              label: "Общий чат",
              children: (
                <Space direction="vertical" className="w-full">
                  {commonMessages.map((m) => (
                    <ItemCard key={m.id} title={m.who} meta={m.at}>
                      {m.text}
                      {m.files?.length ? (
                        <Space wrap style={{ marginTop: 6 }}>
                          {m.files.map((f, i) => (
                            <Tag key={`${m.id}-${i}`} icon={<PaperClipOutlined />}>
                              {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                            </Tag>
                          ))}
                        </Space>
                      ) : null}
                    </ItemCard>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* нижняя липкая панель ввода общего чата */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          marginTop: 8,
          paddingTop: 8,
          paddingBottom: 8,
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {files.length > 0 && (
          <Space wrap style={{ marginBottom: 8 }}>
            {files.map((f: any) => (
              <Tag
                key={f.uid}
                closable
                onClose={(e) => { e.preventDefault(); removeFile(f); }}
                icon={<PaperClipOutlined />}
              >
                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
              </Tag>
            ))}
          </Space>
        )}

        <div
          style={{
            border: "1px solid #e6efec",
            background: "#f7f9f8",
            borderRadius: 14,
            padding: 6,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <Upload multiple showUploadList={false} beforeUpload={addFile}>
            <Button type="text" icon={<PaperClipOutlined />} />
          </Upload>

          <Input.TextArea
            value={commonText}
            onChange={(e) => setCommonText(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder="Введите сообщение"
            variant="borderless"   // вместо deprecated bordered
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ background: "transparent" }}
          />
          <Button type="text" shape="circle" icon={<SendOutlined />} onClick={send} />
        </div>
      </div>
    </Card>
  );
};

export default ChatPreview;
