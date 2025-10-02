import React, { useMemo, useState } from "react";
import { Card, Space, Tabs, Button, Tag, Input, Upload, Typography } from "antd";
import { PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import type { CommonMessage } from "../types/chat";

const { Text } = Typography;

type ChatPreviewProps = {
  // patients: можно типизировать точнее, но для быстрого запуска достаточно any[]
  patients: any[];
  commonMessages: CommonMessage[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
};

const ChatPreview: React.FC<ChatPreviewProps> = ({ patients, commonMessages, onSendCommon }) => {
  // --- собираем данные из пациентов (минимально необходимые поля)
  const patientChats = useMemo(() => {
    return (patients ?? [])
      .map((p: any) => ({ p, msgs: p?.chat ?? [] }))
      .filter((x: any) => x.msgs.length)
      .slice(0, 50);
  }, [patients]);

  const routes = useMemo(() => {
    return (patients ?? []).flatMap((p: any) => (p?.routes ?? []).map((r: any) => ({ p, r })));
  }, [patients]);

  const tasksAll = useMemo(() => {
    return (patients ?? []).flatMap((p: any) => (p?.tasks ?? []).map((t: any) => ({ p, t })));
  }, [patients]);

  const consults = tasksAll.filter((x: any) => x.t.text?.startsWith("Консультация:"));
  const tasks = tasksAll.filter((x: any) => !x.t.text?.startsWith("Консультация:"));
  const notes = useMemo(() => {
    return (patients ?? []).flatMap((p: any) => (p?.notes ?? []).map((n: any) => ({ p, n })));
  }, [patients]);

  // --- UI helpers
  const Item: React.FC<{
    title: React.ReactNode;
    meta?: React.ReactNode;
    tinted?: "blue" | "orange" | "gray";
    children?: React.ReactNode;
  }> = ({ title, meta, tinted, children }) => (
    <Card
      size="small"
      className="rounded-xl"
      style={{
        background:
          tinted === "blue" ? "#e7e9ff"
          : tinted === "orange" ? "#ffe9e2"
          : tinted === "gray" ? "#f3f4f6"
          : "#fff",
      }}
    >
      <Space direction="vertical" className="w-full">
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ opacity: 0.6 }}>{meta}</div>
        </Space>
        {children}
      </Space>
    </Card>
  );

  const Section: React.FC<{
    title: string;
    onShowAll?: () => void;
    children: React.ReactNode;
  }> = ({ title, onShowAll, children }) => (
    <div style={{ marginBottom: 12 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Text strong>{title}</Text>
        {onShowAll ? (
          <Button type="link" size="small" onClick={onShowAll}>Показать все</Button>
        ) : null}
      </Space>
      <Space direction="vertical" className="w-full">
        {children}
      </Space>
    </div>
  );

  // --- Ввод «общего чата»
  const [commonText, setCommonText] = useState("");
  const [commonFiles, setCommonFiles] = useState<any[]>([]);
  const addCommonFile = (file: any) => { setCommonFiles((p) => [...p, file]); return false; };
  const removeCommonFile = (file: any) => setCommonFiles((p) => p.filter((f) => f.uid !== file.uid));
  const sendCommon = () => {
    const files = commonFiles.map((f: any) => ({ name: f.name, size: f.size }));
    if (!commonText.trim() && files.length === 0) return;
    onSendCommon(commonText, files);
    setCommonText("");
    setCommonFiles([]);
  };

  return (
    <Card
      title="Чаты и планирование"
      className="rounded-xl"
      bodyStyle={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 210px)", paddingBottom: 0 }}
    >
      {/* Контент табов */}
      <div style={{ overflow: "auto", paddingRight: 8 }}>
        <Tabs
          type="scrollable"
          tabBarGutter={24}
          items={[
            {
              key: "all",
              label: "Все",
              children: (
                <Space direction="vertical" className="w-full">
                  {/* Сообщения пациента */}
                  <Section title={`Сообщения пациента • ${patientChats.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "patient" }))}>
                    {patientChats.slice(0, 4).map(({ p, msgs }: any) => {
                      const m = msgs[msgs.length - 1];
                      return (
                        <Item key={p.id} title={<>{p.unit} • {p.caseId} • <strong>{p.name}</strong></>} meta={m.at}>
                          <div style={{ opacity: 0.8 }}>{m.text}</div>
                          {m.files?.length ? (
                            <Space wrap style={{ marginTop: 8 }}>
                              {m.files.map((f: any, i: number) => (
                                <Tag key={`${p.id}-${i}`} icon={<PaperClipOutlined />}>
                                  {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                                </Tag>
                              ))}
                            </Space>
                          ) : null}
                        </Item>
                      );
                    })}
                  </Section>

                  {/* Маршрутизация */}
                  <Section title={`Маршрутизация • ${routes.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "routes" }))}>
                    {routes.slice(0, 3).map(({ p, r }: any) => (
                      <Item key={r.id} tinted="orange" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={new Date(r.date).toLocaleDateString()}>
                        Перевод → <strong>{r.toOrg}</strong>{r.comment ? ` • ${r.comment}` : ""}
                      </Item>
                    ))}
                  </Section>

                  {/* Консультации */}
                  <Section title={`Консультации • ${consults.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "consults" }))}>
                    {consults.slice(0, 3).map(({ p, t }: any) => (
                      <Item key={t.id} tinted="blue" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={t.due ? new Date(t.due).toLocaleDateString() : ""}>
                        {t.text}
                      </Item>
                    ))}
                  </Section>

                  {/* Задачи */}
                  <Section title={`Задачи • ${tasks.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "tasks" }))}>
                    {tasks.slice(0, 3).map(({ p, t }: any) => (
                      <Item key={t.id} title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={t.due ? new Date(t.due).toLocaleDateString() : ""}>
                        {t.text}
                      </Item>
                    ))}
                  </Section>

                  {/* Записи */}
                  <Section title={`Записи • ${notes.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "notes" }))}>
                    {notes.slice(0, 3).map(({ p, n }: any) => (
                      <Item key={n.id} tinted="gray" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={new Date(n.at).toLocaleDateString()}>
                        {n.text}
                      </Item>
                    ))}
                  </Section>

                  {/* Общий чат */}
                  <Section title={`Общий чат • ${commonMessages.length}`} onShowAll={() => window.dispatchEvent(new CustomEvent("activate-chat-tab", { detail: "common" }))}>
                    {commonMessages.slice(-3).map((m) => (
                      <Item key={m.id} title={m.who} meta={m.at}>
                        {m.text}
                        {m.files?.length ? (
                          <Space wrap style={{ marginTop: 8 }}>
                            {m.files.map((f, i) => (
                              <Tag key={`${m.id}-${i}`} icon={<PaperClipOutlined />}>
                                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                              </Tag>
                            ))}
                          </Space>
                        ) : null}
                      </Item>
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
                  {patientChats.map(({ p, msgs }: any) => {
                    const m = msgs[msgs.length - 1];
                    return (
                      <Item key={p.id} title={<>{p.unit} • {p.caseId} • <strong>{p.name}</strong></>} meta={m.at}>
                        <div style={{ opacity: 0.8 }}>{m.text}</div>
                        {m.files?.length ? (
                          <Space wrap style={{ marginTop: 8 }}>
                            {m.files.map((f: any, i: number) => (
                              <Tag key={`${p.id}-${i}`} icon={<PaperClipOutlined />}>
                                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                              </Tag>
                            ))}
                          </Space>
                        ) : null}
                        <Space style={{ marginTop: 6 }}>
                          <Button size="small" onClick={() => window.location.assign(`/patient/${p.id}/chat`)}>Открыть чат</Button>
                        </Space>
                      </Item>
                    );
                  })}
                </Space>
              ),
            },
            { key: "routes", label: "Маршрутизация", children: (
              <Space direction="vertical" className="w-full">
                {routes.map(({ p, r }: any) => (
                  <Item key={r.id} tinted="orange" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={new Date(r.date).toLocaleDateString()}>
                    Перевод → <strong>{r.toOrg}</strong>{r.comment ? ` • ${r.comment}` : ""}
                  </Item>
                ))}
              </Space>
            )},
            { key: "consults", label: "Консультации", children: (
              <Space direction="vertical" className="w-full">
                {consults.map(({ p, t }: any) => (
                  <Item key={t.id} tinted="blue" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={t.due ? new Date(t.due).toLocaleDateString() : ""}>
                    {t.text}
                  </Item>
                ))}
              </Space>
            )},
            { key: "tasks", label: "Задачи", children: (
              <Space direction="vertical" className="w-full">
                {tasks.map(({ p, t }: any) => (
                  <Item key={t.id} title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={t.due ? new Date(t.due).toLocaleDateString() : ""}>
                    {t.text}
                  </Item>
                ))}
              </Space>
            )},
            { key: "notes", label: "Записи", children: (
              <Space direction="vertical" className="w-full">
                {notes.map(({ p, n }: any) => (
                  <Item key={n.id} tinted="gray" title={<><Tag bordered>{p.unit}</Tag> {p.name}</>} meta={new Date(n.at).toLocaleDateString()}>
                    {n.text}
                  </Item>
                ))}
              </Space>
            )},
            { key: "common", label: "Общий чат", children: (
              <Space direction="vertical" className="w-full">
                {commonMessages.map((m) => (
                  <Item key={m.id} title={m.who} meta={m.at}>
                    {m.text}
                    {m.files?.length ? (
                      <Space wrap style={{ marginTop: 8 }}>
                        {m.files.map((f, i) => (
                          <Tag key={`${m.id}-${i}`} icon={<PaperClipOutlined />}>
                            {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </Item>
                ))}
              </Space>
            )},
          ]}
        />
      </div>

      {/* Нижняя панель ввода в ОБЩИЙ ЧАТ */}
      <div style={{ position: "sticky", bottom: 0, background: "#fff", marginTop: 8, paddingTop: 8, paddingBottom: 8, borderTop: "1px solid #f0f0f0" }}>
        {commonFiles.length > 0 && (
          <Space wrap style={{ marginBottom: 8 }}>
            {commonFiles.map((f: any) => (
              <Tag key={f.uid} closable onClose={(e) => { e.preventDefault(); removeCommonFile(f); }} icon={<PaperClipOutlined />}>
                {f.name}{typeof f.size === "number" ? ` • ${(f.size / 1024).toFixed(1)} КБ` : ""}
              </Tag>
            ))}
          </Space>
        )}

        <div style={{ border: "1px solid #e6efec", background: "#f7f9f8", borderRadius: 14, padding: 6, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <Upload multiple showUploadList={false} beforeUpload={addCommonFile}>
            <Button type="text" icon={<PaperClipOutlined />} />
          </Upload>
          <Input.TextArea
            value={commonText}
            onChange={(e) => setCommonText(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder="Введите сообщение"
            bordered={false}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendCommon(); } }}
            style={{ background: "transparent" }}
          />
          <Button type="text" shape="circle" icon={<SendOutlined />} onClick={sendCommon} />
        </div>
      </div>
    </Card>
  );
};

export default ChatPreview;
export type { CommonMessage };
