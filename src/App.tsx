import React, { useMemo, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Badge,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Segmented,
  Drawer,
  Tooltip,
  Divider,
  Dropdown,
  Typography,
  Switch,
  Avatar,
  message,
  Modal,
  Form,
  Table,
  InputNumber,
  Tabs,
  Upload,
} from "antd";
import { motion } from "framer-motion";
import {
  SearchOutlined,
  PlusOutlined,
  FireOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  TeamOutlined,
  MessageOutlined,
  FileDoneOutlined,
  PushpinFilled,
  PushpinOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/* ========= Общие типы ========= */
export type RiskLevel = "high" | "medium" | "low";
type VitalKey = "sofa" | "spo2" | "hr" | "bp" | "temp";
type Vital = {
  key: VitalKey;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "flat";
  bad?: boolean;
};

type Note = { id: string; text: string; at: string };
type Task = { id: string; text: string; due?: string; done?: boolean };
type ChatMsg = {
  id: string;
  who: string;
  text: string;
  at: string;
  files?: { uid: string; name: string; size?: number }[]; // 👈 добавили вложения
};
type RouteEvent = { id: string; date: string; toOrg: string; comment?: string };

type Patient = {
  id: string;
  unit: string;
  bed: string;
  caseId: string;
  name: string;
  age: string;
  code: string;
  risk: RiskLevel;
  vitals: Vital[];
  tags?: string[];
  extended?: boolean;
  status?: "active" | "transferred" | "deceased";
  notes?: Note[];
  tasks?: Task[];
  chat?: ChatMsg[]; // сообщения чата пациента
  routes?: RouteEvent[]; // события маршрутизации
  // данные для динамики (моки): массив дат-колонок и объект значений по ключам
  dynDates?: string[]; // ISO даты колонок
  dynValues?: Record<
    string /*rowKey*/,
    Record<string /*date*/, string | number>
  >;
};

type Scope = { type: "all" } | { type: "mine" } | { type: "org"; org: string };

/* ========= Моки ========= */
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const vitalPalette: Record<VitalKey, string> = {
  sofa: "magenta",
  spo2: "cyan",
  hr: "volcano",
  bp: "geekblue",
  temp: "gold",
};
const RISK_META: Record<
  RiskLevel,
  { title: string; color: string; icon: React.ReactNode }
> = {
  high: { title: "Высокий риск", color: "#ff4d4f", icon: <AlertOutlined /> }, // red
  medium: {
    title: "Умеренный риск",
    color: "#fa8c16",
    icon: <ApartmentOutlined />,
  }, // orange
  low: {
    title: "Низкий риск",
    color: "#52c41a",
    icon: <CheckCircleOutlined />,
  }, // green
};
const VITAL_LABELS: Record<VitalKey, string> = {
  sofa: "SOFA",
  spo2: "SpO₂",
  hr: "ЧСС",
  bp: "АД",
  temp: "T°",
};

function makePatient(id: number, risk: RiskLevel): Patient {
  const units = ["ЦКБ №1", "ГБ №1", "ГБ №2", "МКДЦ", "ГБ №3"];
  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(today.getDate() - 1);
  const d2 = new Date(today);
  d2.setDate(today.getDate() - 2);
  const dateISO = (d: Date) => d.toISOString().slice(0, 10);

  // строки динамики (как у тебя)
  const dynRows = [
    { key: "scales", label: "Шкалы", group: true },
    { key: "sofa", label: "SOFA" },
    { key: "apache", label: "APACHE" },
    { key: "gcs", label: "ШКГ" },
    { key: "neuro", label: "Сознание", group: true },
    { key: "neuro_note", label: "Сознание" },
    { key: "cv", label: "Сердечно-сосудистая система", group: true },
    { key: "hemo", label: "Гемодинамика" },
    { key: "bp", label: "АД" },
    { key: "hr", label: "ЧСС" },
    { key: "inotrop", label: "Инотропная/вазопрессорная поддержка" },
    { key: "cv_note", label: "Особенности" },
    { key: "resp", label: "Дыхательная система", group: true },
    { key: "vent", label: "ИВЛ" },
    { key: "rr", label: "ЧД" },
    { key: "spo2", label: "SpO2" },
    { key: "mode", label: "Режим" },
    { key: "vin", label: "Vin" },
    { key: "pip", label: "PIP" },
    { key: "peep", label: "PEEP" },
    { key: "fio2", label: "FIO2" },
    { key: "petco2", label: "PetCO2" },
    { key: "hep1", label: "Гепаторенальная функция", group: true },
    { key: "diuresis", label: "Темп диуреза" },
    { key: "urea", label: "Мочевина" },
    { key: "crea", label: "Креатинин" },
    { key: "bili", label: "Билирубин" },
    { key: "alt", label: "АЛТ" },
    { key: "ast", label: "АСТ" },
    { key: "hep_note", label: "Особенности" },
    { key: "hem", label: "Гемоторенальная функция", group: true },
    { key: "hb", label: "Hb" },
    { key: "rbc", label: "Эритроциты" },
    { key: "hct", label: "Ht" },
    { key: "plt", label: "Тромбоциты" },
  ];

  // стартовые даты и значения
  const dates = [dateISO(today), dateISO(d1), dateISO(d2)];
  const values: Patient["dynValues"] = {};
  dynRows.forEach((r) => {
    values[r.key] = {};
    dates.forEach((ds) => {
      values[r.key]![ds] = "";
    });
  });

  // helper для id (на случай отсутствия crypto.randomUUID в среде)
  const uid = () =>
    crypto?.randomUUID
      ? crypto.randomUUID()
      : `id_${Math.random().toString(36).slice(2)}`;

  return {
    id: `p-${id}`,
    unit: units[rand(0, units.length - 1)]!,
    bed: `Оргт 1:${rand(1, 6)}`,
    caseId: "КД-14",
    name: ["Анна", "Иван", "Виктор", "Мария", "Олег", "Ксения"][rand(0, 5)]!,
    age: `${["Ж", "М"][rand(0, 1)]} ${rand(22, 78)} лет`,
    code: `A ${rand(10, 16)}.${rand(1, 9)}`,
    risk,
    tags: Math.random() > 0.6 ? ["МКЦЦ", "ИВЛ"] : ["ИВЛ"],
    extended: Math.random() > 0.8,
    status: "active",
    notes: [],
    tasks: [],
    vitals: [
      { key: "sofa", label: VITAL_LABELS.sofa, value: rand(6, 15), bad: true },
      {
        key: "spo2",
        label: VITAL_LABELS.spo2,
        value: rand(88, 100),
        trend: "up",
      },
      {
        key: "hr",
        label: VITAL_LABELS.hr,
        value: rand(60, 145),
        trend: "flat",
      },
      {
        key: "bp",
        label: VITAL_LABELS.bp,
        value: `${rand(90, 160)}/${rand(60, 100)}`,
      },
      {
        key: "temp",
        label: VITAL_LABELS.temp,
        value: (36 + Math.random() * 2).toFixed(1),
      },
    ],
    dynDates: dates,
    dynValues: values,

    // 🔹 ДОБАВЛЕНО: стартовые сообщения чата и список маршрутизаций
    chat: [
      {
        id: uid(),
        who: "Георгий А.А • Кардиохирург",
        text: "Коллеги, подскажите что делать с пациентом у которого высокий уровень лейкоцитов",
        at: "11:13",
      },
      {
        id: uid(),
        who: "Анна В.А • Кардиолог",
        text: "Попробуйте изменить питание пациента.",
        at: "11:15",
      },
    ],
    routes: [], // события переводов/маршрутизаций пациента
  };
}

const initialPatients: Patient[] = [
  ...Array.from({ length: 10 }, (_, i) => makePatient(i + 1, "high")),
  ...Array.from({ length: 15 }, (_, i) => makePatient(i + 20, "medium")),
  ...Array.from({ length: 12 }, (_, i) => makePatient(i + 40, "low")),
];

/* ========= Вспомогательные UI ========= */
const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => (
  <Tag color={RISK_META[risk].color} className="rounded-full px-3 py-1 text-xs">
    <Space size={6}>
      {RISK_META[risk].icon}
      {RISK_META[risk].title}
    </Space>
  </Tag>
);

const VitalPill: React.FC<{ v: Vital }> = ({ v }) => (
  <Tooltip title={`${v.label}: ${v.value}`}>
    <Tag bordered className="rounded-full px-2 py-1 text-[11px]">
      <Space size={6}>
        <Badge color={v.bad ? "#ff4d4f" : vitalPalette[v.key]} />
        <span style={{ opacity: 0.6 }}>{v.label}</span>
        <strong>{v.value}</strong>
      </Space>
    </Tag>
  </Tooltip>
);

type ChatPreviewProps = {
  patients: Patient[];
  commonMessages: { id: string; who: string; text: string; at: string }[];
   onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
};

const ChatPreview: React.FC<ChatPreviewProps> = ({
  
  patients,
  commonMessages,
}) => {
  const [active, setActive] = useState<
    "all" | "patient" | "routes" | "consults" | "tasks" | "notes" | "common"
  >("all");

  // Сбор данных
  const patientChats = patients
    .map((p) => ({ p, msgs: p.chat ?? [] }))
    .filter((x) => x.msgs.length)
    .slice(0, 50);

  const routes = patients.flatMap((p) =>
    (p.routes ?? []).map((r) => ({ p, r }))
  );
  const tasksAll = patients.flatMap((p) =>
    (p.tasks ?? []).map((t) => ({ p, t }))
  );
  const consults = tasksAll.filter((x) => x.t.text.startsWith("Консультация:"));
  const tasks = tasksAll.filter((x) => !x.t.text.startsWith("Консультация:"));
  const notes = patients.flatMap((p) => (p.notes ?? []).map((n) => ({ p, n })));

  // Карточки превью
  const Item = ({
    title,
    meta,
    children,
    tinted,
  }: {
    title: React.ReactNode;
    meta?: React.ReactNode;
    children?: React.ReactNode;
    tinted?: "blue" | "orange" | "gray";
  }) => (
    <Card
      size="small"
      className="rounded-xl"
      style={{
        background:
          tinted === "blue"
            ? "#e7e9ff"
            : tinted === "orange"
            ? "#ffe9e2"
            : tinted === "gray"
            ? "#f3f4f6"
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

  const Section = ({
    title,
    linkTab,
    children,
  }: {
    title: string;
    linkTab: ChatPreviewProps extends any ? any : never;
    children: React.ReactNode;
  }) => (
    <div style={{ marginBottom: 12 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Text strong>{title}</Text>
        <Button
          type="link"
          size="small"
          onClick={() => setActive(linkTab as any)}
        >
          Показать все
        </Button>
      </Space>
      <Space direction="vertical" className="w-full">
        {children}
      </Space>
    </div>
  );

  return (
    <Card
      title="Чаты и планирование"
      className="rounded-xl"
      bodyStyle={{ maxHeight: "calc(100vh - 210px)", overflow: "auto" }}
    >
      <Tabs
        activeKey={active}
        onChange={(k) => setActive(k as any)}
        items={[
          {
            key: "all",
            label: "Все",
            children: (
              <Space direction="vertical" className="w-full">
                <Section
                  title={`Сообщения пациента • ${patientChats.length}`}
                  linkTab="patient"
                >
                  {patientChats.slice(0, 4).map(({ p, msgs }) => {
                    const m = msgs[msgs.length - 1];
                    return (
                      <Item
                        key={p.id}
                        title={
                          <>
                            {p.unit} • {p.caseId} • <strong>{p.name}</strong>
                          </>
                        }
                        meta={m.at}
                      >
                        <div style={{ opacity: 0.8 }}>{m.text}</div>
                      </Item>
                    );
                  })}
                </Section>

                <Section
                  title={`Маршрутизация • ${routes.length}`}
                  linkTab="routes"
                >
                  {routes.slice(0, 3).map(({ p, r }) => (
                    <Item
                      key={r.id}
                      tinted="orange"
                      title={
                        <>
                          <Tag bordered>{p.unit}</Tag> {p.name}
                        </>
                      }
                      meta={new Date(r.date).toLocaleDateString()}
                    >
                      Перевод → <strong>{r.toOrg}</strong>
                      {r.comment ? ` • ${r.comment}` : ""}
                    </Item>
                  ))}
                </Section>

                <Section
                  title={`Консультации • ${consults.length}`}
                  linkTab="consults"
                >
                  {consults.slice(0, 3).map(({ p, t }) => (
                    <Item
                      key={t.id}
                      tinted="blue"
                      title={
                        <>
                          <Tag bordered>{p.unit}</Tag> {p.name}
                        </>
                      }
                      meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                    >
                      {t.text}
                    </Item>
                  ))}
                </Section>

                <Section title={`Задачи • ${tasks.length}`} linkTab="tasks">
                  {tasks.slice(0, 3).map(({ p, t }) => (
                    <Item
                      key={t.id}
                      title={
                        <>
                          <Tag bordered>{p.unit}</Tag> {p.name}
                        </>
                      }
                      meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                    >
                      {t.text}
                    </Item>
                  ))}
                </Section>

                <Section title={`Записи • ${notes.length}`} linkTab="notes">
                  {notes.slice(0, 3).map(({ p, n }) => (
                    <Item
                      key={n.id}
                      tinted="gray"
                      title={
                        <>
                          <Tag bordered>{p.unit}</Tag> {p.name}
                        </>
                      }
                      meta={new Date(n.at).toLocaleDateString()}
                    >
                      {n.text}
                    </Item>
                  ))}
                </Section>

                <Section
                  title={`Общий чат • ${commonMessages.length}`}
                  linkTab="common"
                >
                  {commonMessages.slice(-3).map((m) => (
                    <Item key={m.id} title={m.who} meta={m.at}>
                      {m.text}
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
                {patientChats.map(({ p, msgs }) => {
                  const m = msgs[msgs.length - 1];
                  return (
                    <Item
                      key={p.id}
                      title={
                        <>
                          {p.unit} • {p.caseId} • <strong>{p.name}</strong>
                        </>
                      }
                      meta={m.at}
                    >
                      <div style={{ opacity: 0.8 }}>{m.text}</div>
                      <Space style={{ marginTop: 6 }}>
                        <Button
                          size="small"
                          onClick={() =>
                            window.location.assign(`/patient/${p.id}/chat`)
                          }
                        >
                          Открыть чат
                        </Button>
                      </Space>
                    </Item>
                  );
                })}
              </Space>
            ),
          },
          {
            key: "routes",
            label: "Маршрутизация",
            children: (
              <Space direction="vertical" className="w-full">
                {routes.map(({ p, r }) => (
                  <Item
                    key={r.id}
                    tinted="orange"
                    title={
                      <>
                        <Tag bordered>{p.unit}</Tag> {p.name}
                      </>
                    }
                    meta={new Date(r.date).toLocaleDateString()}
                  >
                    Перевод → <strong>{r.toOrg}</strong>
                    {r.comment ? ` • ${r.comment}` : ""}
                    <div style={{ marginTop: 6 }}>
                      <Button
                        size="small"
                        onClick={() =>
                          window.location.assign(`/patient/${p.id}/chat`)
                        }
                      >
                        В чат пациента
                      </Button>
                    </div>
                  </Item>
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
                  <Item
                    key={t.id}
                    tinted="blue"
                    title={
                      <>
                        <Tag bordered>{p.unit}</Tag> {p.name}
                      </>
                    }
                    meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                  >
                    {t.text}
                    <div style={{ marginTop: 6 }}>
                      <Button
                        size="small"
                        onClick={() =>
                          window.location.assign(`/patient/${p.id}/chat`)
                        }
                      >
                        Перейти
                      </Button>
                    </div>
                  </Item>
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
                  <Item
                    key={t.id}
                    title={
                      <>
                        <Tag bordered>{p.unit}</Tag> {p.name}
                      </>
                    }
                    meta={t.due ? new Date(t.due).toLocaleDateString() : ""}
                  >
                    {t.text}
                  </Item>
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
                  <Item
                    key={n.id}
                    tinted="gray"
                    title={
                      <>
                        <Tag bordered>{p.unit}</Tag> {p.name}
                      </>
                    }
                    meta={new Date(n.at).toLocaleDateString()}
                  >
                    {n.text}
                  </Item>
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
                  <Item key={m.id} title={m.who} meta={m.at}>
                    {m.text}
                  </Item>
                ))}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};

/* ========= Глобальное состояние (внутри App) ========= */

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [pinned, setPinned] = useState<string[]>([]);
  const [scope, setScope] = useState<Scope>({ type: "all" });
  const [query, setQuery] = useState("");
  const [riskTab, setRiskTab] = useState<RiskLevel | "all">("all");
  const [compact, setCompact] = useState(false);
  const [commonChatOpen, setCommonChatOpen] = useState(false);
const [commonMessages, setCommonMessages] = useState<
  { id: string; who: string; text: string; at: string; files?: { name: string; size?: number }[] }[]
>([
  { id: "c1", who: "Геннадий А.А • Кардиохирург", text: "Ознакомился с приказом 513. Что делать с пунктом №2", at: "11:13" },
  { id: "c2", who: "Олег В.А • Кардиохирург", text: "Включите его в общий документ", at: "11:15" },
]);

const onSendCommon = (text: string, files: { name: string; size?: number }[]) => {
  const clean = text.trim();
  if (!clean && files.length === 0) return;
  setCommonMessages(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      who: "Вы",
      text: clean,
      at: new Date().toLocaleTimeString().slice(0, 5),
      files: files.length ? files : undefined,
    },
  ]);
};
  /* хелперы доступа к пациентам из вложенных роутов */
  const getById = (id: string) => patients.find((p) => p.id === id);
  const upsert = (id: string, patch: Partial<Patient>) =>
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        className="bg-white shadow-sm px-4"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size={12}>
          <Title level={4} style={{ margin: 0 }}>
            <Link to="/" style={{ color: "inherit" }}>
              Мониторинг пациентов
            </Link>
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => message.info("Данные обновлены (mock)")}
          >
            Обновить
          </Button>
          <Button
            onClick={() => setCommonChatOpen(true)}
            icon={<MessageOutlined />}
          >
            Общий чат
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />}>
          Пациента
        </Button>
      </Header>

      {/* Полоса-чипов */}
      <OrgScopeBar
        patients={patients}
        pinned={pinned}
        scope={scope}
        setScope={setScope}
      />

      {/* Роуты */}
      <Routes>
        <Route
          path="/"
          element={
            <BoardPage
              patients={patients}
              pinned={pinned}
              setPinned={setPinned}
              scope={scope}
              setScope={setScope}
              query={query}
              setQuery={setQuery}
              riskTab={riskTab}
              setRiskTab={setRiskTab}
              compact={compact}
              setCompact={setCompact}
              setPatients={setPatients}
              commonMessages={commonMessages}
                    onSendCommon={onSendCommon}
            />
          }
        />
        <Route
          path="/patient/:id/dynamics"
          element={<DynamicsPage getById={getById} upsert={upsert} />}
        />
        <Route
          path="/patient/:id/chat"
          element={<ChatPage getById={getById} upsert={upsert} />}
        />
      </Routes>

      {/* общий чат */}
      <Drawer
        title="Общий чат"
        open={commonChatOpen}
        onClose={() => setCommonChatOpen(false)}
        width={420}
      >
        <Space direction="vertical" className="w-full">
          {commonMessages.map((m) => (
            <Card key={m.id} size="small" className="rounded-lg">
              <Text strong>{m.who}</Text>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{m.at}</div>
              <div style={{ marginTop: 6 }}>{m.text}</div>
            </Card>
          ))}

          <Space.Compact style={{ width: "100%" }}>
            <Input.TextArea
              id="common-input"
              placeholder="Написать сообщение..."
              autoSize={{ minRows: 2 }}
            />
            <Button
              type="primary"
              onClick={() => {
                const el = document.getElementById(
                  "common-input"
                ) as HTMLTextAreaElement | null;
                if (!el || !el.value.trim()) return;
                setCommonMessages((ms) => [
                  ...ms,
                  {
                    id: crypto.randomUUID(),
                    who: "Вы",
                    text: el.value.trim(),
                    at: new Date().toLocaleTimeString().slice(0, 5),
                  },
                ]);
                el.value = "";
              }}
            >
              Отправить
            </Button>
          </Space.Compact>
        </Space>
      </Drawer>
    </Layout>
  );
};

/* ========= Полоса чипов и сводка/фильтры (переиспользуемые) ========= */

const KpiInline: React.FC<{ patients: Patient[] }> = ({ patients }) => {
  const byRisk = useMemo(
    () => ({
      high: patients.filter((p) => p.risk === "high").length,
      medium: patients.filter((p) => p.risk === "medium").length,
      low: patients.filter((p) => p.risk === "low").length,
    }),
    [patients]
  );
  const total = patients.length;

  const Item = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color?: string;
  }) => (
    <Space
      size={6}
      style={{
        padding: "4px 8px",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      {color && <Badge color={color} />}
      <Text type="secondary">{label}</Text>
      <Tag bordered>{value}</Tag>
    </Space>
  );

  return (
    <Space size={8} wrap>
      <Item label="Все пациенты" value={total} />
      <Item label="Высокий" value={byRisk.high} color="#ff4d4f" />
      <Item label="Умеренный" value={byRisk.medium} color="#fa8c16" />
      <Item label="Низкий" value={byRisk.low} color="#52c41a" />
    </Space>
  );
};

const OrgScopeBar: React.FC<{
  patients: Patient[];
  pinned: string[];
  scope: Scope;
  setScope: (s: Scope) => void;
}> = ({ patients, pinned, scope, setScope }) => {
  const orgs = useMemo(() => {
    const map = new Map<string, number>();
    patients.forEach((p) => map.set(p.unit, (map.get(p.unit) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [patients]);

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
    marginRight: 8,
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
  const active: React.CSSProperties = { boxShadow: "0 0 0 2px #1677ff inset" };
  const muted: React.CSSProperties = { fontSize: 12, opacity: 0.7 };

  return (
    <div
      className="bg-white px-4"
      style={{ borderBottom: "1px solid #f0f0f0" }}
    >
      <div
        style={{ overflowX: "auto", overflowY: "hidden", padding: "10px 0" }}
      >
        <div style={{ width: "max-content" }}>
          <span
            style={{ ...chip, ...(scope.type === "all" ? active : {}) }}
            onClick={() => setScope({ type: "all" })}
          >
            <strong>Все пациенты</strong>
            <span style={muted}>∑ {patients.length}</span>
          </span>
          <span
            style={{ ...chip, ...(scope.type === "mine" ? active : {}) }}
            onClick={() => setScope({ type: "mine" })}
          >
            <strong>Мои пациенты</strong>
            <span style={muted}>∑ {pinned.length}</span>
          </span>
          {orgs.map((o) => {
            const on = scope.type === "org" && scope.org === o.name;
            return (
              <span
                key={o.name}
                style={{ ...chip, ...(on ? active : {}) }}
                onClick={() => setScope({ type: "org", org: o.name })}
              >
                <strong>{o.name}</strong>
                <span style={muted}>∑ {o.total}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ========= Главная доска ========= */

const BoardPage: React.FC<{
  patients: Patient[];
  pinned: string[];
  setPinned: React.Dispatch<React.SetStateAction<string[]>>;
  scope: Scope;
  setScope: (s: Scope) => void;
  query: string;
  setQuery: (v: string) => void;
  riskTab: RiskLevel | "all";
  setRiskTab: (v: any) => void;
  compact: boolean;
  setCompact: (v: boolean) => void;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  commonMessages: { id: string; who: string; text: string; at: string }[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;   // ← добавили
}> = ({
  patients,
  pinned,
  setPinned,
  scope,
  setScope,
  query,
  setQuery,
  riskTab,
  setRiskTab,
  compact,
  setCompact,
  setPatients,
  commonMessages,
   onSendCommon,
}) => {
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let base = patients;
    if (scope.type === "mine") base = base.filter((p) => pinned.includes(p.id));
    else if (scope.type === "org")
      base = base.filter((p) => p.unit === scope.org);

    const q = query.trim().toLowerCase();
    if (q)
      base = base.filter((p) =>
        [p.name, p.unit, p.code, p.caseId, p.age, p.bed].some((s) =>
          s.toLowerCase().includes(q)
        )
      );
    if (riskTab !== "all") base = base.filter((p) => p.risk === riskTab);
    return base;
  }, [patients, scope, pinned, query, riskTab]);

  const byColumn: Record<RiskLevel, Patient[]> = useMemo(
    () => ({
      high: filtered.filter((p) => p.risk === "high"),
      medium: filtered.filter((p) => p.risk === "medium"),
      low: filtered.filter((p) => p.risk === "low"),
    }),
    [filtered]
  );

  const movePatient = (id: string, to: RiskLevel) =>
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, risk: to } : p))
    );

  const togglePin = (id: string) =>
    setPinned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <>
      {/* полоса фильтров + сводка */}
      <div
        className="bg-white px-4 py-2"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <Row gutter={12} align="middle" wrap>
          <Col flex="auto">
            <Space size={8} wrap>
              <Input
                allowClear
                placeholder="Поиск по имени, отделению, коду…"
                prefix={<SearchOutlined />}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: 320 }}
              />
              <RangePicker size="middle" />
              <Select
                placeholder="Фильтр отделений"
                style={{ width: 220 }}
                options={[...new Set(patients.map((p) => p.unit))].map((u) => ({
                  value: u,
                  label: u,
                }))}
                allowClear
                onChange={(v) =>
                  setScope(v ? { type: "org", org: v } : { type: "all" })
                }
                value={scope.type === "org" ? scope.org : undefined}
              />
              <Segmented
                options={[
                  { label: "Все", value: "all" },
                  { label: "Высокий", value: "high" },
                  { label: "Умеренный", value: "medium" },
                  { label: "Низкий", value: "low" },
                ]}
                value={riskTab}
                onChange={(val) => setRiskTab(val as any)}
              />
              <Divider type="vertical" />
              <Space>
                <Text type="secondary">Компактный вид</Text>
                <Switch checked={compact} onChange={setCompact} />
              </Space>
            </Space>
          </Col>
          <Col>
            <KpiInline patients={filtered} />
          </Col>
        </Row>
      </div>

      {/* доска */}
      <Content className="p-4" style={{ overflow: "auto" }}>
        <Row gutter={12}>
          {/* Левая часть: 3 колонки пациентов */}
          <Col span={18}>
            <Row gutter={12}>
              {(["high", "medium", "low"] as RiskLevel[]).map((risk) => (
                <Col key={risk} span={8}>
                  {/* заголовок + карточки как у тебя сейчас */}
                  <div
                    className="mb-2"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Space>
                      <Badge color={RISK_META[risk].color} />
                      <Text strong>{RISK_META[risk].title}</Text>
                    </Space>
                    <Tag bordered>{byColumn[risk].length}</Tag>
                  </div>
                  {byColumn[risk].length === 0 ? (
                    <Card
                      size="small"
                      className="rounded-xl"
                      style={{ textAlign: "center" }}
                    >
                      Пусто
                    </Card>
                  ) : (
                    <div className={compact ? "space-y-2" : "space-y-3"}>
                      {byColumn[risk].map((p) => (
                        <PatientCard
                          key={p.id}
                          p={p}
                          pinned={pinned.includes(p.id)}
                          onTogglePin={togglePin}
                          onOpen={(pp) =>
                            navigate(`/patient/${pp.id}/dynamics`)
                          }
                          onMove={movePatient}
                        />
                      ))}
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          </Col>

          {/* Правая часть: превью чатов */}
          <Col span={6}>
            <ChatPreview  patients={filtered}
  commonMessages={commonMessages}
  onSendCommon={onSendCommon} />
          </Col>
        </Row>
      </Content>
    </>
  );
};

/* ========= Страница динамики ========= */

const DynamicsPage: React.FC<{
  getById: (id: string) => Patient | undefined;
  upsert: (id: string, patch: Partial<Patient>) => void;
}> = ({ getById, upsert }) => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const patient = getById(id);

  if (!patient) {
    return (
      <Content className="p-4">
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
          Назад
        </Button>{" "}
        Пациент не найден
      </Content>
    );
  }

  const dates = patient.dynDates ?? [];
  const setDates = (arr: string[]) => upsert(patient.id, { dynDates: arr });

  // строки таблицы (как в макете)
  const rows = [
    { key: "scales", label: "Шкалы", group: true },
    { key: "sofa", label: "SOFA" },
    { key: "apache", label: "APACHE" },
    { key: "gcs", label: "ШКГ" },
    { key: "neuro", label: "Сознание", group: true },
    { key: "neuro_note", label: "Сознание" },
    { key: "cv", label: "Сердечно-сосудистая система", group: true },
    { key: "hemo", label: "Гемодинамика" },
    { key: "bp", label: "АД" },
    { key: "hr", label: "ЧСС" },
    { key: "inotrop", label: "Инотропная/вазопрессорная поддержка" },
    { key: "cv_note", label: "Особенности" },
    { key: "resp", label: "Дыхательная система", group: true },
    { key: "vent", label: "ИВЛ" },
    { key: "rr", label: "ЧД" },
    { key: "spo2", label: "SpO2" },
    { key: "mode", label: "Режим" },
    { key: "vin", label: "Vin" },
    { key: "pip", label: "PIP" },
    { key: "peep", label: "PEEP" },
    { key: "fio2", label: "FIO2" },
    { key: "petco2", label: "PetCO2" },
    { key: "hep1", label: "Гепаторенальная функция", group: true },
    { key: "diuresis", label: "Темп диуреза" },
    { key: "urea", label: "Мочевина" },
    { key: "crea", label: "Креатинин" },
    { key: "bili", label: "Билирубин" },
    { key: "alt", label: "АЛТ" },
    { key: "ast", label: "АСТ" },
    { key: "hep_note", label: "Особенности" },
    { key: "hem", label: "Гемоторенальная функция", group: true },
    { key: "hb", label: "Hb" },
    { key: "rbc", label: "Эритроциты" },
    { key: "hct", label: "Ht" },
    { key: "plt", label: "Тромбоциты" },
  ];

  // сборка колонок таблицы
  const columns = [
    {
      title: "",
      dataIndex: "label",
      key: "label",
      width: 260,
      render: (_: any, row: any) =>
        row.group ? <strong>{row.label}</strong> : row.label,
    },
    ...dates.map((ds) => ({
      title: new Date(ds).toLocaleDateString(),
      dataIndex: ds,
      key: ds,
      align: "center" as const,
      render: (_: any, row: any) => {
        if (row.group) return null;
        const v = patient.dynValues?.[row.key]?.[ds] ?? "";
        const onChange = (val: string | number) => {
          const next = { ...(patient.dynValues ?? {}) };
          next[row.key] = { ...(next[row.key] ?? {}), [ds]: val };
          upsert(patient.id, { dynValues: next });
        };
        // текстовое поле (можно адаптировать под типы)
        return (
          <Input
            size="small"
            value={v as any}
            onChange={(e) => onChange(e.target.value)}
            style={{ maxWidth: 160 }}
          />
        );
      },
    })),
  ];

  // данные для Table
  const data = rows.map((r) => {
    const row: any = { key: r.key, label: r.label, group: r.group };
    dates.forEach((ds) => (row[ds] = patient.dynValues?.[r.key]?.[ds] ?? ""));
    return row;
  });

  const addMonitoringColumn = () => {
    const ds = new Date().toISOString().slice(0, 10);
    if (!dates.includes(ds)) setDates([ds, ...dates]);
  };

  const toggleExtended = (checked: boolean) => {
    upsert(patient.id, { extended: checked });
  };

  /* чат по пациенту (моки) */
  const [messages, setMessages] = useState<
    Array<{ id: string; who: string; text: string; at: string }>
  >([
    {
      id: "1",
      who: "Георгий А.А • Кардиохирург",
      text: "Коллеги, подскажите что делать с пациентом у которого высокий уровень лейкоцитов",
      at: "11:13",
    },
    {
      id: "2",
      who: "Анна В.А • Кардиолог",
      text: "Попробуйте изменить питание пациента.",
      at: "11:15",
    },
  ]);
  const [msg, setMsg] = useState("");

  const send = () => {
    if (!msg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        who: "Вы",
        text: msg.trim(),
        at: new Date().toLocaleTimeString().slice(0, 5),
      },
    ]);
    setMsg("");
  };

  return (
    <Content className="p-4" style={{ overflow: "auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Button onClick={addMonitoringColumn} type="default">
          Новый мониторинг
        </Button>
        <Switch checked={!!patient.extended} onChange={toggleExtended} />{" "}
        <Text>Включить мониторинг</Text>
      </Space>

      <Card className="rounded-xl">
        <Space direction="vertical" size={2} style={{ marginBottom: 12 }}>
          <Space wrap size={8}>
            <Tag bordered>{patient.name}</Tag>
            <Tag bordered>{patient.code}</Tag>
            <Tag bordered>{patient.unit}</Tag>
            <Tag bordered>{patient.bed}</Tag>
            <Tag bordered>{patient.caseId}</Tag>
          </Space>
        </Space>

        <Row gutter={16}>
          <Col span={16}>
            <Table
              size="small"
              bordered
              pagination={false}
              columns={columns}
              dataSource={data}
              scroll={{ x: true }}
            />
          </Col>
          <Col span={8}>
            <Card
              className="rounded-xl"
              title="Чат по пациенту"
              extra={<Button type="text" icon={<PaperClipOutlined />} />}
            >
              <div style={{ height: 440, overflow: "auto", paddingRight: 8 }}>
                <Space direction="vertical" className="w-full">
                  {messages.map((m) => (
                    <Card size="small" key={m.id} className="rounded-lg">
                      <Text strong>{m.who}</Text>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>{m.at}</div>
                      <div style={{ marginTop: 6 }}>{m.text}</div>
                    </Card>
                  ))}
                </Space>
              </div>
              <div style={{ marginTop: 8 }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Input.TextArea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder="Введите сообщение"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={send}
                  />
                </Space.Compact>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </Content>
  );
};

/* ========= Карточка пациента (используется на доске) ========= */

const PatientCard: React.FC<{
  p: Patient;
  pinned: boolean;
  onTogglePin: (id: string) => void;
  onOpen: (p: Patient) => void;
  onMove: (id: string, to: RiskLevel) => void;
}> = ({ p, pinned, onTogglePin, onOpen, onMove }) => {
  const navigate = useNavigate();
  const menuItems = [
    {
      key: "move-high",
      label: "Переместить: Высокий",
      onClick: () => onMove(p.id, "high"),
    },
    {
      key: "move-medium",
      label: "Переместить: Умеренный",
      onClick: () => onMove(p.id, "medium"),
    },
    {
      key: "move-low",
      label: "Переместить: Низкий",
      onClick: () => onMove(p.id, "low"),
    },
  ] as const;

  const statusTint =
    p.status === "deceased"
      ? "#bfbfbf"
      : p.status === "transferred"
      ? "#d9d9d9"
      : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        size="small"
        className="mb-3 rounded-2xl shadow-sm hover:shadow transition"
        bodyStyle={{
          opacity: p.status !== "active" ? 0.7 : 1,
          background: statusTint,
        }}
        actions={[
          <Button
            type="link"
            icon={<FileDoneOutlined />}
            key="dyn"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(p);
            }}
          >
            Динамика
          </Button>,
          <Button
            type="link"
            icon={<MessageOutlined />}
            key="chat"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patient/${p.id}/chat`);
            }}
          >
            Чат
          </Button>,
          <Dropdown
            menu={{ items: menuItems as any }}
            trigger={["click"]}
            key="more"
          >
            <Button type="text">Ещё</Button>
          </Dropdown>,
        ]}
        extra={
          <Space>
            {p.extended && (
              <Tag color="blue" bordered>
                Расширенный
              </Tag>
            )}
            <Tooltip title={pinned ? "Открепить" : "Закрепить"}>
              <Button
                size="small"
                type="text"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(p.id);
                }}
                icon={
                  pinned ? (
                    <PushpinFilled style={{ color: "#fa8c16" }} />
                  ) : (
                    <PushpinOutlined />
                  )
                }
              />
            </Tooltip>
          </Space>
        }
      >
        <Space direction="vertical" className="w-full">
          <Space
            className="w-full"
            align="start"
            style={{ justifyContent: "space-between" }}
          >
            <div>
              <Space size={8} wrap>
                <Tag bordered>{p.unit}</Tag>
                <Tag bordered>{p.bed}</Tag>
                <Tag bordered>{p.caseId}</Tag>
                <Tag bordered color="default">
                  {p.code}
                </Tag>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Space size={8} wrap>
                  <Avatar size={20} icon={<UserOutlined />} />
                  <Text strong>{p.name}</Text>
                  <Text type="secondary">{p.age}</Text>
                  {p.tags?.map((t) => (
                    <Tag key={t} color="processing" bordered>
                      {t}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
            <RiskBadge risk={p.risk} />
          </Space>
          <Divider style={{ margin: "8px 0" }} />
          <Space wrap>
            {p.vitals.map((v) => (
              <VitalPill key={v.key} v={v} />
            ))}
          </Space>
        </Space>
      </Card>
    </motion.div>
  );
};

// new chat page
const ChatPage: React.FC<{
  getById: (id: string) => Patient | undefined;
  upsert: (id: string, patch: Partial<Patient>) => void;
}> = ({ getById, upsert }) => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const patient = getById(id);
  const [filter, setFilter] = useState<("notes" | "tasks" | "routes")[]>([
    "notes",
    "tasks",
    "routes",
  ]);
  // файлы, прикреплённые к сообщению (используем Upload без реальной отправки)
  const [files, setFiles] = useState<any[]>([]);

  const onAddFiles = (file: any) => {
    setFiles((prev) => [...prev, file]);
    return false; // отменяем авто-загрузку — всё локально
  };
  const onRemoveFile = (file: any) => {
    setFiles((prev) => prev.filter((f) => f.uid !== file.uid));
  };
  const [form] = Form.useForm();

  if (!patient) {
    return (
      <Content className="p-4">
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
          Назад
        </Button>
        Пациент не найден
      </Content>
    );
  }

  /* --- обработчики левой панели --- */
  const addNote = (text: string) => {
    if (!text?.trim()) return;
    const note: Note = {
      id: crypto.randomUUID(),
      text: text.trim(),
      at: new Date().toISOString(),
    };
    upsert(patient.id, { notes: [note, ...(patient.notes ?? [])] });
    message.success("Заметка добавлена");
  };

  const addTask = (text: string, due?: string, kind: "task" | "consult") => {
    if (!text?.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      due,
      done: false,
    };
    const prev = patient.tasks ?? [];
    // пометим тип в тексте, чтобы отличать консультации (для демо)
    const t =
      kind === "consult"
        ? { ...task, text: "Консультация: " + task.text }
        : task;
    upsert(patient.id, { tasks: [...prev, t] });
    message.success(
      kind === "consult" ? "Консультация запланирована" : "Задача создана"
    );
  };

  const addRoute = (dateISO: string, toOrg: string, comment?: string) => {
    const ev: RouteEvent = {
      id: crypto.randomUUID(),
      date: dateISO,
      toOrg,
      comment,
    };
    upsert(patient.id, { routes: [ev, ...(patient.routes ?? [])] });
    message.success("Маршрутизация запланирована");
  };

  /* --- правый чат --- */
  const [msg, setMsg] = useState("");
  const send = () => {
    const text = msg.trim();
    if (!text && files.length === 0) return;

    const payloadFiles = files.map((f) => ({
      uid: f.uid,
      name: f.name,
      size: f.size,
    }));

    const m: ChatMsg = {
      id: crypto.randomUUID(),
      who: "Вы",
      text,
      at: new Date().toLocaleTimeString().slice(0, 5),
      files: payloadFiles.length ? payloadFiles : undefined,
    };

    upsert(patient.id, { chat: [...(patient.chat ?? []), m] });
    setMsg("");
    setFiles([]);
  };

  /* --- представления ленты --- */
  const feedTasks = (patient.tasks ?? []).map((t) => ({
    type: "tasks" as const,
    date: t.due ?? new Date().toISOString(),
    title: t.text,
  }));
  const feedRoutes = (patient.routes ?? []).map((r) => ({
    type: "routes" as const,
    date: r.date,
    title: `Перевод → ${r.toOrg}` + (r.comment ? ` (${r.comment})` : ""),
  }));
  const feedNotes = (patient.notes ?? []).map((n) => ({
    type: "notes" as const,
    date: n.at,
    title: n.text,
  }));

  const feed = [...feedTasks, ...feedRoutes, ...feedNotes]
    .filter((i) => filter.includes(i.type))
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <Content className="p-4" style={{ overflow: "auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Text strong>Действие над пациентом</Text>
      </Space>

      <Row gutter={16}>
        {/* Левая колонка: блокнот/планирование */}
        <Col span={12}>
          <Card className="rounded-xl" bodyStyle={{ background: "#f6fbf9" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={(v) => {
                if (v.note) addNote(v.note);
                if (v.taskText || v.taskDue)
                  addTask(v.taskText || "", v.taskDue?.toISOString(), "task");
                if (v.consText || v.consDue)
                  addTask(
                    v.consText || "",
                    v.consDue?.toISOString(),
                    "consult"
                  );
                if (v.routeDue || v.routeOrg)
                  addRoute(
                    v.routeDue?.toISOString() ?? new Date().toISOString(),
                    v.routeOrg || "",
                    v.routeComment
                  );
                form.resetFields();
              }}
            >
              <Form.Item label="Добавить заметку" name="note">
                <Input.TextArea
                  placeholder="Введите заметку"
                  autoSize={{ minRows: 2 }}
                />
              </Form.Item>

              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item label="Добавить задачу" name="taskDue">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label=" " name="taskText">
                    <Input placeholder="Запланировать задачу" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item label="Запланировать консультацию" name="consDue">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label=" " name="consText">
                    <Input placeholder="Запланировать задачу" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item
                    label="Запланировать маршрутизацию"
                    name="routeDue"
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label=" " name="routeOrg">
                    <Select
                      placeholder="Медицинская организация"
                      options={[
                        "ЦКБ №1",
                        "ГБ №1",
                        "ГБ №2",
                        "МКДЦ",
                        "ГБ №3",
                      ].map((x) => ({ value: x, label: x }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="routeComment" label="Комментарий">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit">
                Добавить
              </Button>
            </Form>
          </Card>

          <Card
            className="rounded-xl"
            title="Лента событий"
            style={{ marginTop: 12 }}
          >
            <Space style={{ marginBottom: 8 }}>
              <Input placeholder="Поиск заметок" prefix={<SearchOutlined />} />
              <Segmented
                options={[
                  {
                    label: (
                      <Space>
                        <span style={{ color: "#1677ff" }}>●</span> Задачи
                      </Space>
                    ),
                    value: "tasks",
                  },
                  {
                    label: (
                      <Space>
                        <span style={{ color: "#fa8c16" }}>●</span>{" "}
                        Маршрутизация
                      </Space>
                    ),
                    value: "routes",
                  },
                  {
                    label: (
                      <Space>
                        <span style={{ color: "#999" }}>●</span> Заметки
                      </Space>
                    ),
                    value: "notes",
                  },
                ]}
                multiple
                value={filter}
                onChange={(v) => setFilter(v as any)}
              />
            </Space>

            <Space direction="vertical" className="w-full">
              {feed.map((i, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 10,
                    padding: "10px 12px",
                    background:
                      i.type === "tasks"
                        ? "#e7e9ff"
                        : i.type === "routes"
                        ? "#ffe9e2"
                        : "#f3f4f6",
                  }}
                >
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Tag bordered>{new Date(i.date).toLocaleDateString()}</Tag>
                    <div style={{ opacity: 0.6 }}>
                      {i.type === "tasks"
                        ? "Задача"
                        : i.type === "routes"
                        ? "Маршрутизация"
                        : "Заметка"}
                    </div>
                  </Space>
                  <div style={{ marginTop: 6 }}>{i.title}</div>
                </div>
              ))}
              {!feed.length && (
                <Text type="secondary">Нет записей по выбранным типам.</Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Правая колонка: чат пациента */}
        <Col span={12}>
          <Card
            className="rounded-xl"
            title={
              <Space wrap size={8}>
                <Tag bordered>{patient.name}</Tag>
                <Tag bordered>{patient.code}</Tag>
                <Tag bordered>{patient.unit}</Tag>
                <Tag bordered>{patient.bed}</Tag>
                <Tag bordered>{patient.caseId}</Tag>
              </Space>
            }
          >
            <div
              style={{
                height: 520,
                overflow: "auto",
                paddingRight: 8,
                marginBottom: 8,
              }}
            >
              <Space direction="vertical" className="w-full">
                {(patient.chat ?? []).map((m) => (
                  <Card size="small" key={m.id} className="rounded-lg">
                    <Text strong>{m.who}</Text>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>{m.at}</div>
                    <div style={{ marginTop: 6 }}>{m.text}</div>

                    {/* 👇 ДОБАВЬ блок предпросмотра файлов */}
                    {m.files?.length ? (
                      <Space wrap style={{ marginTop: 8 }}>
                        {m.files.map((f) => (
                          <Tag key={f.uid} icon={<PaperClipOutlined />}>
                            {f.name}
                            {typeof f.size === "number"
                              ? ` • ${(f.size / 1024).toFixed(1)} КБ`
                              : ""}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </Card>
                ))}
              </Space>
            </div>

            <Space.Compact style={{ width: "100%" }}>
              {/* Липкая нижняя панель ввода + прикрепления */}
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "#fff",
                  paddingTop: 8,
                }}
              >
                {/* Если прикреплены файлы — покажем их перед инпутом, с возможностью удалить */}
                {files.length > 0 && (
                  <Space wrap style={{ marginBottom: 8 }}>
                    {files.map((f) => (
                      <Tag
                        key={f.uid}
                        closable
                        onClose={(e) => {
                          e.preventDefault();
                          onRemoveFile(f);
                        }}
                        icon={<PaperClipOutlined />}
                      >
                        {f.name}
                        {typeof f.size === "number"
                          ? ` • ${(f.size / 1024).toFixed(1)} КБ`
                          : ""}
                      </Tag>
                    ))}
                  </Space>
                )}

                {/* Сам «контейнер» ввода */}
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
                  {/* Скрепка — триггер Upload */}
                  <Upload
                    multiple
                    showUploadList={false}
                    beforeUpload={onAddFiles} // просто добавляем в state
                    onRemove={onRemoveFile}
                  >
                    <Button type="text" icon={<PaperClipOutlined />} />
                  </Upload>

                  {/* Поле ввода. Enter — отправка, Shift+Enter — новая строка */}
                  <Input.TextArea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder="Введите сообщение"
                    bordered={false}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    style={{ background: "transparent" }}
                  />

                  {/* Кнопка отправки */}
                  <Button
                    type="text"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={send}
                  />
                </div>
              </div>
            </Space.Compact>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default App;
