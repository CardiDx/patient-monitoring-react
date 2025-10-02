import React from "react";
import { Layout, Row, Col, Card, Table, Input, Space, Tag, Switch, Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import type { Patient } from "../types";

const { Content } = Layout;
const { Text } = Typography;

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
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>Назад</Button> Пациент не найден
      </Content>
    );
  }

  const dates = patient.dynDates ?? [];
  const setDates = (arr: string[]) => upsert(patient.id, { dynDates: arr });

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

  const columns = [
    { title: "", dataIndex: "label", key: "label", width: 260,
      render: (_: any, row: any) => row.group ? <strong>{row.label}</strong> : row.label },
    ...dates.map((ds) => ({
      title: new Date(ds).toLocaleDateString(),
      dataIndex: ds, key: ds, align: "center" as const,
      render: (_: any, row: any) => {
        if (row.group) return null;
        const v = patient.dynValues?.[row.key]?.[ds] ?? "";
        const onChange = (val: string | number) => {
          const next = { ...(patient.dynValues ?? {}) };
          next[row.key] = { ...(next[row.key] ?? {}), [ds]: val };
          upsert(patient.id, { dynValues: next });
        };
        return <Input size="small" value={v as any} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 160 }} />;
      },
    })),
  ];

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

  return (
    <Content className="p-4" style={{ overflow: "auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Назад</Button>
        <Button onClick={addMonitoringColumn}>Новый мониторинг</Button>
        <Space><Switch checked={!!patient.extended} onChange={toggleExtended} /><Text>Включить мониторинг</Text></Space>
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
          <Col span={16}><Table size="small" bordered pagination={false} columns={columns} dataSource={data} scroll={{ x: true }} /></Col>
          <Col span={8}><Card size="small" className="rounded-xl" title="Доп. панель"><Text type="secondary">Здесь можно разместить виджеты.</Text></Card></Col>
        </Row>
      </Card>
    </Content>
  );
};

export default DynamicsPage;
