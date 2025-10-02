import React from "react";
import { Card, Form, Row, Col, DatePicker, Input, Select, Button, message } from "antd";

export type PatientActionsFormProps = {
  onAddNote: (text: string) => void;
  onAddTask: (text: string, dueISO?: string) => void;
  onAddConsult: (text: string, dueISO?: string) => void;
  onAddRoute: (dateISO: string, toOrg: string, comment?: string) => void;
  orgOptions?: string[];
};

const DEFAULT_ORGS = ["ЦКБ №1", "ГБ №1", "ГБ №2", "МКДЦ", "ГБ №3"];

const PatientActionsForm: React.FC<PatientActionsFormProps> = ({
  onAddNote, onAddTask, onAddConsult, onAddRoute, orgOptions = DEFAULT_ORGS,
}) => {
  const [form] = Form.useForm();

  return (
    <Card className="rounded-xl" bodyStyle={{ background: "#f6fbf9" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => {
          if (v.note) onAddNote(v.note);
          if (v.taskText || v.taskDue) onAddTask(v.taskText || "", v.taskDue?.toISOString());
          if (v.consText || v.consDue) onAddConsult(v.consText || "", v.consDue?.toISOString());
          if (v.routeDue || v.routeOrg)
            onAddRoute(v.routeDue?.toISOString() ?? new Date().toISOString(), v.routeOrg || "", v.routeComment);
          form.resetFields();
          message.success("Запись добавлена");
        }}
      >
        <Form.Item label="Добавить заметку" name="note">
          <Input.TextArea placeholder="Введите заметку" autoSize={{ minRows: 2 }} />
        </Form.Item>

        <Row gutter={8}>
          <Col span={8}><Form.Item label="Добавить задачу" name="taskDue"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={16}><Form.Item label=" " name="taskText"><Input placeholder="Запланировать задачу" /></Form.Item></Col>
        </Row>

        <Row gutter={8}>
          <Col span={8}><Form.Item label="Запланировать консультацию" name="consDue"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={16}><Form.Item label=" " name="consText"><Input placeholder="Тема консультации" /></Form.Item></Col>
        </Row>

        <Row gutter={8}>
          <Col span={8}><Form.Item label="Запланировать маршрутизацию" name="routeDue"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={16}>
            <Form.Item label=" " name="routeOrg">
              <Select placeholder="Медицинская организация" options={orgOptions.map((x) => ({ value: x, label: x }))} />
            </Form.Item>
          </Col>
          <Col span={24}><Form.Item name="routeComment" label="Комментарий"><Input /></Form.Item></Col>
        </Row>

        <Button type="primary" htmlType="submit">Добавить</Button>
      </Form>
    </Card>
  );
};

export default PatientActionsForm;
