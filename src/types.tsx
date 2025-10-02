// Общие типы проекта

export type RiskLevel = "high" | "medium" | "low";

export type VitalKey = "sofa" | "spo2" | "hr" | "bp" | "temp";
export type Vital = {
  key: VitalKey;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "flat";
  bad?: boolean;
};

export type Note = { id: string; text: string; at: string };
export type Task = { id: string; text: string; due?: string; done?: boolean };
export type ChatMsg = {
  id: string;
  who: string;
  text: string;
  at: string;
  files?: { uid?: string; name: string; size?: number }[];
};
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
  vitals: Vital[];
  tags?: string[];
  extended?: boolean;
  status?: "active" | "transferred" | "deceased";
  notes?: Note[];
  tasks?: Task[];
  chat?: ChatMsg[];
  routes?: RouteEvent[];
  dynDates?: string[];
  dynValues?: Record<string, Record<string, string | number>>;
};

export type Scope = { type: "all" } | { type: "mine" } | { type: "org"; org: string };
