import React, { useState } from "react";
import { Layout, Button, Space, Typography } from "antd";
import { ReloadOutlined, MessageOutlined, PlusOutlined } from "@ant-design/icons";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import OrgScopeBar from "./components/OrgScopeBar";
import BoardPage from "./pages/BoardPage";
import DynamicsPage from "./pages/DynamicsPage";
import ChatPage from "./pages/ChatPage";
import AddPatientPage from "./pages/AddPatientPage";
import { initialPatients } from "./mocks";
import type { Patient, Scope } from "./types";
import ChatPreview from "./components/ChatPreview";   // ✅ импорт компонента
import type { CommonMessage } from "./types/chat";   // ✅ импорт типа

const { Header } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [pinned, setPinned] = useState<string[]>([]);
  const [scope, setScope] = useState<Scope>({ type: "all" });
  const [query, setQuery] = useState("");
  const [riskTab, setRiskTab] = useState<"high" | "medium" | "low" | "all">("all");
  const [compact, setCompact] = useState(false);

  const [commonMessages, setCommonMessages] = useState<CommonMessage[]>([
    { id: "c1", who: "Геннадий А.А • Кардиохирург", text: "Ознакомился с приказом 513. Что делать с пунктом №2", at: "11:13" },
    { id: "c2", who: "Олег В.А • Кардиохирург", text: "Включите его в общий документ", at: "11:15" },
  ]);
  
  const onSendCommon = (text: string, files: { name: string; size?: number }[]) => {
    const clean = text.trim();
    if (!clean && files.length === 0) return;
    setCommonMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), who: "Вы", text: clean, at: new Date().toLocaleTimeString().slice(0, 5), files: files.length ? files : undefined },
    ]);
  };

  const getById = (id: string) => patients.find((p) => p.id === id);
  const upsert = (id: string, patch: Partial<Patient>) =>
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <Layout style={{ height: "100vh" }}>
      <Header className="bg-white shadow-sm px-4" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Space size={12}>
          <Title level={4} style={{ margin: 0 }}><Link to="/" style={{ color: "inherit" }}>Мониторинг пациентов</Link></Title>
          <Button icon={<ReloadOutlined />} onClick={() => console.info("Данные обновлены (mock)")}>Обновить</Button>
          <Button icon={<MessageOutlined />} onClick={() => navigate("/patient/new")}>Открыть форму добавления</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/patient/new")}>Пациента</Button>
      </Header>

      <OrgScopeBar patients={patients} pinned={pinned} scope={scope} setScope={setScope} />

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
        <Route path="/patient/:id/dynamics" element={<DynamicsPage getById={getById} upsert={upsert} />} />
        <Route path="/patient/:id/chat" element={<ChatPage getById={getById} upsert={upsert} />} />
        <Route path="/patient/new" element={<AddPatientPage setPatients={setPatients} commonMessages={commonMessages} onSendCommon={onSendCommon} />} />
      </Routes>
    </Layout>
  );
};

export default App;
