import React from "react";
import { AlertOutlined, CheckCircleOutlined, ApartmentOutlined } from "@ant-design/icons";
import type { RiskLevel, VitalKey } from "./types";

export const RISK_META: Record<RiskLevel, { title: string; color: string; icon: React.ReactNode }> = {
  high:   { title: "Высокий риск",   color: "#ff4d4f", icon: <AlertOutlined /> },
  medium: { title: "Умеренный риск", color: "#fa8c16", icon: <ApartmentOutlined /> },
  low:    { title: "Низкий риск",    color: "#52c41a", icon: <CheckCircleOutlined /> },
};

export const VITAL_LABELS: Record<VitalKey, string> = {
  sofa: "SOFA",
  spo2: "SpO₂",
  hr:   "ЧСС",
  bp:   "АД",
  temp: "T°",
};
