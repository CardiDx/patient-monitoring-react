import React, { useState } from "react";
import { Layout, Row, Col, Card, Form, Input, DatePicker, Select, Button, Space, Typography, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PatientActionsForm from "../components/PatientActionsForm";
import ChatPreview, { CommonMessage } from "../components/ChatPreview";
import type { Patient } from "../types";
import { makePatient } from "../mocks";

const { Content } = Layout;
const { Text, Title } = Typography;

const AddPatientPage: React.FC<{
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  commonMessages: CommonMessage[];
  onSendCommon: (text: string, files: { name: string; size?: number }[]) => void;
}> = ({ setPatients, commonMessages, onSendCommon }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Черновые ленты (демо-сторона)
  const [draftNotes, setDraftNotes] = useState<string[]>([]);
  const [draftTasks, setDraftTasks] = useState<string[]>([]);
  const [draftRoutes, setDraftRoutes] = useState<string[]>([]);

  const createPatient = (v: any) => {
    // базовый мок: создаём пациента и патчим поля из формы
    const p = makePatient(Date.now(), "medium");
    p.name = v.name || p.name;
    p.age  = v.gender ? `${v.gender === "f" ? "Ж" : "М"} ${p.age.split(" ")[1]} ${p.age.split(" ")[2]}` : p.age;
    p.unit = v.unit || p.unit;
    setPatients(prev => [p, ...prev]);
    message.success("Пациент создан (mock)");
    navigate("/");
  };

  return (
    <Content className="p-4" style={{ overflow: "auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Назад</Button>
        <Text strong>Добавить пациента</Text>
      </Space>

      <Row gutter={16}>
        {/* Левая часть: форма + блок действий */}
        <Col span={16}>
          <Card className="rounded-xl" title={<Title level={5} style={{ margin: 0 }}>Данные пациента</Title>}>
            <Form form={form} layout="vertical" onFinish={createPatient}>
              <Form.Item label="ФИО" name="name" rules={[{ required: true, message: "Укажите ФИО" }]}>
                <Input placeholder="Иванов Иван Иванович" />
              </Form.Item>

              <Row gutter={8}>
                <Col span={8}><Form.Item label="Дата рождения" name="dob"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Пол" name="gender"><Select options={[{value:"m",label:"Мужской"},{value:"f",label:"Женский"}]} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Отделение" name="unit"><Select options={["ЦКБ №1","ГБ №1","ГБ №2","МКДЦ","ГБ №3"].map(x=>({value:x,label:x}))} /></Form.Item></Col>
              </Row>

              <Space>
                <Button type="primary" htmlType="submit">Создать пациента</Button>
                <Button onClick={() => form.resetFields()}>Очистить</Button>
              </Space>
            </Form>
          </Card>

          <div style={{ marginTop: 12 }}>
            <PatientActionsForm
              onAddNote={(text) => setDraftNotes((p) => [text, ...p])}
              onAddTask={(text) => setDraftTasks((p) => [text, ...p])}
              onAddConsult={(text) => setDraftTasks((p) => [`Консультация: ${text}`, ...p])}
              onAddRoute={(_, toOrg, comment) => setDraftRoutes((p) => [`Перевод → ${toOrg}${comment?` (${comment})`:""}`, ...p])}
            />
          </div>
        </Col>

        {/* Правая часть: общий чат превью */}
        <Col span={8}>
          <ChatPreview commonMessages={commonMessages} onSendCommon={onSendCommon} />
        </Col>
      </Row>
    </Content>
  );
};

export default AddPatientPage;
