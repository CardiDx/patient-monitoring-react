import React, { useMemo } from "react";
import { Badge } from "antd";
import type { Patient, Scope } from "../types";

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
    whiteSpace: "nowrap",
  };
  const active: React.CSSProperties = { boxShadow: "0 0 0 2px #1677ff inset" };
  const muted: React.CSSProperties = { fontSize: 12, opacity: 0.7 };

  return (
    <div className="bg-white px-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ overflowX: "auto", overflowY: "hidden", padding: "10px 0" }}>
        <div style={{ width: "max-content" }}>
          <span style={{ ...chip, ...(scope.type === "all" ? active : {}) }} onClick={() => setScope({ type: "all" })}>
            <strong>Все пациенты</strong>
            <span style={muted}>∑ {patients.length}</span>
          </span>
          <span style={{ ...chip, ...(scope.type === "mine" ? active : {}) }} onClick={() => setScope({ type: "mine" })}>
            <strong>Мои пациенты</strong>
            <span style={muted}>∑ {pinned.length}</span>
          </span>
          {orgs.map((o) => {
            const on = scope.type === "org" && scope.org === o.name;
            return (
              <span key={o.name} style={{ ...chip, ...(on ? active : {}) }} onClick={() => setScope({ type: "org", org: o.name })}>
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

export default OrgScopeBar;
