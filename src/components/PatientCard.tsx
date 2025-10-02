import React from "react";
import { Card, Space, Tag, Tooltip, Button, Avatar, Divider, Dropdown, Badge, Typography } from "antd";
import { UserOutlined, PushpinFilled, PushpinOutlined, MessageOutlined, FileDoneOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import RiskBadge from "./RiskBadge";
import VitalPill from "./VitalPill";
import type { Patient, RiskLevel } from "../types";

const { Text } = Typography;

const PatientCard: React.FC<{
  p: Patient;
  pinned: boolean;
  onTogglePin: (id: string) => void;
  onOpen: (p: Patient) => void;
  onMove: (id: string, to: RiskLevel) => void;
}> = ({ p, pinned, onTogglePin, onOpen, onMove }) => {
  const navigate = useNavigate();
  const menuItems = [
    { key: "move-high", label: "Переместить: Высокий", onClick: () => onMove(p.id, "high") },
    { key: "move-medium", label: "Переместить: Умеренный", onClick: () => onMove(p.id, "medium") },
    { key: "move-low", label: "Переместить: Низкий", onClick: () => onMove(p.id, "low") },
  ];

  return (
    <Card
      size="small"
      className="rounded-2xl shadow-sm hover:shadow transition patient-card"
      style={{
        // критично: не давим фиксированную высоту карточке и убираем нижний отступ,
        // чтобы grid правильно считал размеры
        marginBottom: 0,
      }}
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        // не задаём height:100% — именно это часто «съедает» место для actions
      }}
      actions={[
        <Button type="link" icon={<FileDoneOutlined />} key="dyn" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>Динамика</Button>,
        <Button type="link" icon={<MessageOutlined />} key="chat" onClick={(e) => { e.stopPropagation(); navigate(`/patient/${p.id}/chat`); }}>Чат</Button>,
        <Dropdown key="more" menu={{ items: menuItems as any }} trigger={["click"]}><Button type="text">Ещё</Button></Dropdown>,
      ]}
      extra={
        <Space>
          {p.extended && <Tag color="blue" bordered>Расширенный</Tag>}
          <Tooltip title={pinned ? "Открепить" : "Закрепить"}>
            <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); onTogglePin(p.id); }}
              icon={pinned ? <PushpinFilled style={{ color: "#fa8c16" }} /> : <PushpinOutlined />} />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" className="w-full" style={{ display: 'flex', flex: 1 }}>
        <Space className="w-full" align="start" style={{ justifyContent: "space-between" }}>
          <div>
            <Space size={8} wrap>
              <Tag bordered>{p.unit}</Tag>
              <Tag bordered>{p.bed}</Tag>
              <Tag bordered>{p.caseId}</Tag>
              <Tag bordered>{p.code}</Tag>
            </Space>
            <div style={{ marginTop: 4 }}>
              <Space size={8} wrap>
                <Avatar size={20} icon={<UserOutlined />} />
                <Text strong>{p.name}</Text>
                <Text type="secondary">{p.age}</Text>
                {p.tags?.map((t) => <Tag key={t} color="processing" bordered>{t}</Tag>)}
              </Space>
            </div>
          </div>
          <RiskBadge risk={p.risk} />
        </Space>
        <Divider style={{ margin: "8px 0" }} />
        <Space wrap>{p.vitals.map((v) => <VitalPill key={v.key} v={v} />)}</Space>
      </Space>
    </Card>
  );
};

export default PatientCard;
