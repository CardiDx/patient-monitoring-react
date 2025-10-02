import React from "react";
import { Tag, Space } from "antd";
import { RISK_META } from "../constants";
import type { RiskLevel } from "../types";

const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => (
  <Tag color={RISK_META[risk].color} className="rounded-full px-3 py-1 text-xs">
    <Space size={6}>
      {RISK_META[risk].icon}
      {RISK_META[risk].title}
    </Space>
  </Tag>
);

export default RiskBadge;
