import React, { useMemo } from "react";
import { Layout, Row, Col, Card, Badge, Tag, Space, Input, Select, DatePicker, Segmented, Divider, Switch, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PatientCard from "../components/PatientCard";
import KpiInline from "../components/KpiInline";
import { RISK_META } from "../constants";
import type { Patient, Scope, RiskLevel } from "../types";
import ChatPreview from "../components/ChatPreview";
import type { CommonMessage } from "../types/chat";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const BoardPage: React.FC<{
  patients: Patient[];
  pinned: string[];
  setPinned: React.Dispatch<React.SetStateAction<string[]>>;
  scope: Scope;
  setScope: (s: Scope) => void;
  query: string; setQuery: (v: string) => void;
  riskTab: RiskLevel | "all"; setRiskTab: (v: any) => void;
  compact: boolean; setCompact: (v: boolean) => void;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  commonMessages: CommonMessage[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
}> = ({
  patients, pinned, setPinned, scope, setScope, query, setQuery,
  riskTab, setRiskTab, compact, setCompact, setPatients,
  commonMessages, onSendCommon,
}) => {
    const navigate = useNavigate();

    const filtered = useMemo(() => {
      let base = patients;
      if (scope.type === "mine") base = base.filter((p) => pinned.includes(p.id));
      else if (scope.type === "org") base = base.filter((p) => p.unit === scope.org);

      const q = query.trim().toLowerCase();
      if (q) base = base.filter((p) => [p.name, p.unit, p.code, p.caseId, p.age, p.bed].some((s) => s.toLowerCase().includes(q)));
      if (riskTab !== "all") base = base.filter((p) => p.risk === riskTab);
      return base;
    }, [patients, scope, pinned, query, riskTab]);

    const byColumn: Record<RiskLevel, Patient[]> = useMemo(() => ({
      high: filtered.filter((p) => p.risk === "high"),
      medium: filtered.filter((p) => p.risk === "medium"),
      low: filtered.filter((p) => p.risk === "low"),
    }), [filtered]);

    const movePatient = (id: string, to: RiskLevel) =>
      setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, risk: to } : p)));

    const togglePin = (id: string) =>
      setPinned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    return (
      <Content className="p-4" style={{ overflow: "auto" }}>
        {/* <Content className="p-4" style={{ overflowX: "hidden", overflowY: "auto" }}> */}

        <Row gutter={12}>
          {/* ЛЕВАЯ ЗОНА: три горизонтальные дорожки */}
          <Col span={18}>
            {(
              ["high", "medium", "low"] as RiskLevel[]
            ).map((risk) => (
              <div key={risk} style={{ marginBottom: 16 }}>
                {/* Заголовок дорожки */}
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

                {/* Горизонтальный скролл с карточками */}
                {byColumn[risk].length === 0 ? (
                  <Card size="small" className="rounded-xl" style={{ textAlign: "center" }}>
                    Пусто
                  </Card>
                ) : (
                  <Row gutter={[12, 12]}>
                    {byColumn[risk].map((p) => (
                      <Col
                        key={p.id}
                        xs={24}      // 1 кол. на очень узких
                        sm={12}      // 2 кол.
                        md={12}      // 2 кол.
                        lg={8}       // 3 кол.
                        xl={6}       // 4 кол.
                        xxl={4}      // 6 кол. (как на макете)
                      >
                        <PatientCard
                          p={p}
                          pinned={pinned.includes(p.id)}
                          onTogglePin={togglePin}
                          onOpen={(pp) => navigate(`/patient/${pp.id}/dynamics`)}
                          onMove={movePatient}
                        />
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ))}
          </Col>

          {/* ПРАВАЯ ЗОНА: превью чатов как раньше, со вкладками */}
          <Col span={6}>
            <div style={{ position: "sticky", top: 12 }}>
              <ChatPreview
                patients={filtered}
                commonMessages={commonMessages}
                onSendCommon={onSendCommon}
              />
            </div>
          </Col>
        </Row>
      </Content>

    );
  };

export default BoardPage;
