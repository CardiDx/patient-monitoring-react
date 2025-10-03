import React, { useMemo, useState } from "react";
import {
  Tabs,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { Dayjs } from "dayjs";

import ChatPreview from "../components/ChatPreview";
import ExtendedMonitoring from "../components/ExtendedMonitoring"; // ← ВОТ ЭТО ВЕРНУЛИ!

/* ---------- Типы ---------- */
export type RiskLevel = "high" | "medium" | "low";
export type VitalKey = "sofa" | "spo2" | "hr" | "bp" | "temp";
export type ChatMsg = {
  id: string;
  who: string;
  text: string;
  at: string;
  files?: { uid: string; name: string; size?: number }[];
};
export type Patient = {
  id: string;
  unit: string;
  bed: string;
  caseId: string;
  name: string;
  age: string;
  code: string;
  risk: RiskLevel;
  chat?: ChatMsg[];
  notes?: { id: string; text: string; at: string }[];
  tasks?: { id: string; text: string; due?: string; done?: boolean }[];
  routes?: { id: string; date: string; toOrg: string; comment?: string }[];
};
export type CommonMessage = {
  id: string;
  who: string;
  text: string;
  at: string;
  files?: { name: string; size?: number }[];
};

type AddPatientPageProps = {
  patients: Patient[];
  commonMessages: CommonMessage[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
};

const { Title, Text } = Typography;

/* ---------- Форма ---------- */
type Sex = "m" | "f";

type FormShape = {
  lastName: string;
  firstName: string;
  middleName?: string;
  birthDate?: Dayjs;
  height?: number;
  weight?: number;
  mrn: string;
  admitAt: Dayjs;
  bedNo: number;
  department: string;

  diagnosisType?: "preliminary" | "clinical";

  gcs: "ясное" | "оглушение" | "сопор" | "кома1" | "кома2" | "кома3" | "седация";
  vasopressors: boolean;
  ivl: boolean;

  rr?: number;
  spo2?: number;
  temp?: number;
  hr?: number;
  sbp?: number;

  sofa?: number;
  apache?: number;
  gcsScore?: number;

  dbp?: number;
  fio2?: number;
  peep?: number;
  lactate?: number;
};

/* ---------- Простейшие «расчёты» ---------- */
function calcSOFA(v: Partial<FormShape>) {
  const base =
    (v.rr ?? 16) / 4 +
    (v.spo2 ?? 96) / 10 +
    (v.temp ?? 36.8) / 5 +
    (v.hr ?? 80) / 50 +
    (v.sbp ?? 110) / 60;
  return Math.min(24, Math.max(0, Math.round(base)));
}
function calcAPACHE(v: Partial<FormShape>) {
  const base =
    (v.temp ?? 36.8) * 2 +
    (v.hr ?? 80) / 2 +
    (v.spo2 ?? 96) / 3 +
    (v.rr ?? 16) / 2;
  return Math.min(71, Math.max(0, Math.round(base)));
}
function calcGCS(v: Partial<FormShape>) {
  const map: Record<FormShape["gcs"], number> = {
    ясное: 15,
    оглушение: 13,
    сопор: 10,
    кома1: 8,
    кома2: 6,
    кома3: 4,
    седация: 9,
  };
  return map[v.gcs ?? "ясное"];
}

/* ---------- Справочники ---------- */
const beds = Array.from({ length: 20 }, (_, i) => ({
  value: i + 1,
  label: `Койка №${i + 1}`,
}));
const departments = [
  { value: "ОРИТ 1", label: "ОРИТ 1" },
  { value: "ОРИТ 2", label: "ОРИТ 2" },
  { value: "ОРИТ 3", label: "ОРИТ 3" },
];

/* ---------- Компонент ---------- */
const AddPatientPage: React.FC<AddPatientPageProps> = ({
  patients,
  commonMessages,
  onSendCommon,
}) => {
  const navigate = useNavigate();
  const [sex, setSex] = useState<Sex>("m");
  const [expanded, setExpanded] = useState(false); // ← флаг расширенного мониторинга
  const [form] = Form.useForm();

  const bedDeptPreview = useMemo(() => {
    const bedNo = form.getFieldValue("bedNo");
    const dep = form.getFieldValue("department");
    if (!bedNo || !dep) return "—";
    return `Койка №${bedNo} / ${dep}`;
  }, [form]);

  // mock-действия для ExtendedMonitoring
  const addNote = (text: string) => {
    if (!text?.trim()) return;
    message.success("Заметка добавлена");
  };
  const addTask = (text: string, dueISO?: string) => {
    if (!text?.trim()) return;
    message.success("Задача создана");
  };
  const addConsult = (text: string, dueISO?: string) => {
    if (!text?.trim()) return;
    message.success("Консультация запланирована");
  };
  const addRoute = (dateISO: string, toOrg: string, comment?: string) => {
    message.success("Маршрутизация запланирована");
  };

  const submit = (values: FormShape) => {
    const dto = {
      ...values,
      sex,
      admitAtISO: values.admitAt?.toISOString(),
      birthISO: values.birthDate?.toISOString(),
      bedDeptLabel: `Койка №${values.bedNo} / ${values.department}`,
    };
    console.log("NEW PATIENT DTO:", dto);
    message.success("Пациент сохранён (mock).");
    navigate(-1);
  };

  const handleCalc = (name: "sofa" | "apache" | "gcsScore") => {
    const v = form.getFieldsValue(true);
    const patch: Partial<FormShape> = {};
    if (name === "sofa") patch.sofa = calcSOFA(v);
    if (name === "apache") patch.apache = calcAPACHE(v);
    if (name === "gcsScore") patch.gcsScore = calcGCS(v);
    form.setFieldsValue(patch);
  };

  return (
    <div style={{ padding: 16, paddingBottom: 84 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Добавить пациента
        </Title>
      </Space>

      <Row gutter={12} align="top">
        {/* Левая колонка — форма */}
        <Col span={18}>
          <Form
            form={form}
            layout="vertical"
            onFinish={submit}
            initialValues={{ diagnosisType: "clinical", diagnoses: [{}] }}
          >
            {/* 1. Данные пациента */}
            <Card className="rounded-xl" title="1. Данные пациента">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label="Фамилия"
                    name="lastName"
                    rules={[{ required: true, message: "Укажите фамилию" }]}
                  >
                    <Input placeholder="Иванов" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Имя"
                    name="firstName"
                    rules={[{ required: true, message: "Укажите имя" }]}
                  >
                    <Input placeholder="Иван" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Отчество" name="middleName">
                    <Input placeholder="Иванович" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Дата рождения" name="birthDate">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="№ ИБ" name="mrn" rules={[{ required: true }]}>
                    <Input placeholder="23653244" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Пол">
                    <Radio.Group value={sex} onChange={(e) => setSex(e.target.value)}>
                      <Radio value="m">Мужской</Radio>
                      <Radio value="f">Женский</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Рост, см" name="height">
                    <InputNumber min={30} max={250} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Вес, кг" name="weight">
                    <InputNumber min={1} max={400} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Дата/время поступления в ОРИТ"
                    name="admitAt"
                    rules={[{ required: true }]}
                  >
                    <DatePicker showTime style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Койка" name="bedNo" rules={[{ required: true }]}>
                    <Select options={beds} placeholder="Выберите койку" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Отделение"
                    name="department"
                    rules={[{ required: true }]}
                  >
                    <Select options={departments} placeholder="Выберите отделение" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ opacity: 0.7, fontSize: 12 }}>Предпросмотр: {bedDeptPreview}</div>
            </Card>

            {/* 2. Диагнозы */}
            <Card title="2. Диагнозы" className="rounded-xl" style={{ marginTop: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                <Form.Item name="diagnosisType" noStyle>
                  <Tabs
                    defaultActiveKey="clinical"
                    items={[
                      { key: "preliminary", label: "Предварительный" },
                      { key: "clinical", label: "Клинический" },
                    ]}
                    onChange={(key) => form.setFieldsValue({ diagnosisType: key as any })}
                  />
                </Form.Item>
              </Space>

              <Form.List name="diagnoses">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        style={{
                          background: "#f6f6f6",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      >
                        <Form.Item name={[field.name, "date"]} label="Дата постановки">
                          <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item name={[field.name, "mkb"]} label="МКБ">
                          <Select
                            placeholder="Выберите значение"
                            options={[
                              { value: "A00", label: "A00 — Холера" },
                              { value: "B00", label: "B00 — Герпес" },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item name={[field.name, "text"]} label="Диагноз">
                          <Input.TextArea rows={3} placeholder="Описание диагноза" />
                        </Form.Item>

                        {index > 0 && (
                          <Button danger onClick={() => remove(field.name)}>
                            Удалить диагноз
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button type="dashed" onClick={() => add()} block>
                      + Добавить диагноз
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* 3. Состояние пациента */}
            <Card className="rounded-xl" title="3. Состояние пациента" style={{ marginTop: 12 }}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="SOFA" name="sofa">
                    <InputNumber
                      min={0}
                      max={24}
                      style={{ width: "100%" }}
                      addonAfter={
                        <Button size="small" icon={<CalculatorOutlined />} onClick={() => handleCalc("sofa")}>
                          Рассчитать
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="APACHE" name="apache">
                    <InputNumber
                      min={0}
                      max={71}
                      style={{ width: "100%" }}
                      addonAfter={
                        <Button size="small" icon={<CalculatorOutlined />} onClick={() => handleCalc("apache")}>
                          Рассчитать
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="ШКГ (GCS)" name="gcsScore">
                    <InputNumber
                      min={3}
                      max={15}
                      style={{ width: "100%" }}
                      addonAfter={
                        <Button size="small" icon={<CalculatorOutlined />} onClick={() => handleCalc("gcsScore")}>
                          Рассчитать
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Сознание" name="gcs" initialValue="ясное">
                    <Radio.Group>
                      <Radio value="ясное">Ясное</Radio>
                      <Radio value="оглушение">Оглушение</Radio>
                      <Radio value="сопор">Сопор</Radio>
                      <Radio value="кома1">Кома I</Radio>
                      <Radio value="кома2">Кома II</Radio>
                      <Radio value="кома3">Кома III</Radio>
                      <Radio value="седация">Седация</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Инотропы/вазопрессоры" name="vasopressors" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="ИВЛ" name="ivl" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Switch checked={expanded} onChange={setExpanded} />
                <Text>Расширенный мониторинг</Text>
              </Space>
            </Card>

            {/* ← ВОТ ЗДЕСЬ РЕНДЕРИМ РАСШИРЕННЫЙ МОНИТОРИНГ */}
            {expanded && (
              <ExtendedMonitoring
                form={form}
                onAddNote={addNote}
                onAddTask={(t, d) => addTask(t, d)}
                onAddConsult={(t, d) => addConsult(t, d)}
                onAddRoute={addRoute}
              />
            )}
          </Form>

          {/* фикс-панель с кнопками */}
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#fff",
              borderTop: "1px solid #f0f0f0",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
              padding: "10px 16px",
              zIndex: 1000,
            }}
          >
            <Row justify="end">
              <Space>
                <Button onClick={() => navigate(-1)}>Отмена</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  Сохранить пациента
                </Button>
              </Space>
            </Row>
          </div>
        </Col>

        {/* Правая колонка — превью чатов */}
        <Col span={6}>
          <div style={{ position: "sticky", top: 12 }}>
            <ChatPreview
              patients={patients ?? []}
              commonMessages={commonMessages ?? []}
              onSendCommon={onSendCommon}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AddPatientPage;
