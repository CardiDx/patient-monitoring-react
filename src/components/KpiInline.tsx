import React, { useMemo } from "react";
import { Space, Badge, Text, Tag, Typography } from "antd";
import type { Patient } from "../types";
const { Text: T } = Typography;

const KpiInline: React.FC<{ patients: Patient[] }> = ({ patients }) => {
  const byRisk = useMemo(
    () => ({
      high: patients.filter((p) => p.risk === "high").length,
      medium: patients.filter((p) => p.risk === "medium").length,
      low: patients.filter((p) => p.risk === "low").length,
    }),
    [patients]
  );

  const Item = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <Space size={6} style={{ padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
      {color && <Badge color={color} />}
      <T type="secondary">{label}</T>
      <Tag bordered>{value}</Tag>
    </Space>
  );

  return (
    <Space size={8} wrap>
      <Item label="Все пациенты" value={patients.length} />
      <Item label="Высокий" value={byRisk.high} color="#ff4d4f" />
      <Item label="Умеренный" value={byRisk.medium} color="#fa8c16" />
      <Item label="Низкий" value={byRisk.low} color="#52c41a" />
    </Space>
  );
};

export default KpiInline;
