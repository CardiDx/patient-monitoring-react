import React from "react";
import { Tooltip, Tag, Space, Badge } from "antd";
import type { Vital } from "../types";

const VitalPill: React.FC<{ v: Vital }> = ({ v }) => (
  <Tooltip title={`${v.label}: ${v.value}`}>
    <Tag bordered className="rounded-full px-2 py-1 text-[11px]">
      <Space size={6}>
        <Badge color={v.bad ? "#ff4d4f" : "#1677ff"} />
        <span style={{ opacity: 0.6 }}>{v.label}</span>
        <strong>{v.value}</strong>
      </Space>
    </Tag>
  </Tooltip>
);

export default VitalPill;
