// src/components/ExtendedMonitoring.tsx
import React from "react";
import {
  Card,
  Form,
  Radio,
  Space,
  Divider,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Tag,
} from "antd";
import type { FormInstance } from "antd";
import PatientActionsForm from "./PatientActionsForm"; // уже есть у тебя

const { TextArea } = Input;

type Props = {
  form: any; // FormInstance из antd
  onAddNote: (text: string) => void;
  onAddTask: (text: string, dueISO?: string) => void;
  onAddConsult: (text: string, dueISO?: string) => void;
  onAddRoute: (dateISO: string, toOrg: string, comment?: string) => void;
}


const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Divider orientation="left" style={{ marginTop: 24 }}>
    <Space>
      <Tag color="blue" bordered>
        {children}
      </Tag>
    </Space>
  </Divider>
);

const ExtendedMonitoring: React.FC<Props> = ({
  form,
  onAddNote,
  onAddTask,
  onAddConsult,
  onAddRoute,
}) => {
  // удобный селектор
  const RespMode = Form.useWatch(["monitor", "resp", "mode"], { form });

  return (
    <Card className="rounded-xl" style={{ marginTop: 16 }}>
      {/* 1. Сознание */}
      <SectionTitle>1. Сознание</SectionTitle>
      <Form.Item name={["monitor", "neuro", "state"]} noStyle>
        <Radio.Group>
          <Space direction="vertical">
            <Radio value="clear">Ясное</Radio>
            <Radio value="sopor">Сопор</Radio>
            <Radio value="coma2">Кома II</Radio>
            <Radio value="sedation">Седация</Radio>
            <Radio value="stun">Оглушение</Radio>
            <Radio value="coma1">Кома I</Radio>
            <Radio value="coma3">Кома III</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      {/* 2. Сердечно-сосудистая система */}
      <SectionTitle>2. Сердечно-сосудистая система</SectionTitle>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item
            label="Гемодинамика"
            name={["monitor", "cv", "hemoStable"]}
            initialValue="stable"
          >
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio value="stable">Стабильна</Radio>
              <Radio value="unstable">Не стабильна</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="АД (ср)" name={["monitor", "cv", "map"]}>
            <InputNumber addonAfter="мм рт.ст." style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="ЧСС" name={["monitor", "cv", "hr"]}>
            <InputNumber addonAfter="уд/мин" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Примечание" name={["monitor", "cv", "note"]}>
            <Input placeholder="Введите заметку" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Инотропная/вазопрессорная поддержка" style={{ marginTop: -8 }}>
        <Space wrap>
          <Form.Item name={["monitor", "cv", "drugs", "dobutamine"]} valuePropName="checked" noStyle>
            <Radio.Button value>Добутамин</Radio.Button>
          </Form.Item>
          <Form.Item name={["monitor", "cv", "drugs", "adrenaline"]} valuePropName="checked" noStyle>
            <Radio.Button value>Адреналин</Radio.Button>
          </Form.Item>
          <Form.Item name={["monitor", "cv", "drugs", "dopamine"]} valuePropName="checked" noStyle>
            <Radio.Button value>Допамин</Radio.Button>
          </Form.Item>
          <Form.Item name={["monitor", "cv", "drugs", "noradrenaline"]} valuePropName="checked" noStyle>
            <Radio.Button value>Норадреналин</Radio.Button>
          </Form.Item>
          <Form.Item name={["monitor", "cv", "drugs", "phenylephrine"]} valuePropName="checked" noStyle>
            <Radio.Button value>Фенилэфрин</Radio.Button>
          </Form.Item>
        </Space>
      </Form.Item>

      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="Особенности" name={["monitor", "cv", "special"]}>
            <Select
              allowClear
              options={[
                { value: "bkc", label: "ВЖКС" },
                { value: "eit24", label: "ЭИТ (посл. 24 ч)" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 3. Дыхательная система */}
      <SectionTitle>3. Дыхательная система</SectionTitle>

      <Form.Item
        label="Режим"
        name={["monitor", "resp", "mode"]}
        initialValue="spontaneous_no_o2"
      >
        <Select
          options={[
            { value: "spontaneous_no_o2", label: "Спонтанное без оксигенотерапии" },
            { value: "spontaneous_with_o2", label: "Спонтанное с оксигенотерапией" },
            { value: "ventilated", label: "Аппаратная респираторная поддержка" },
          ]}
        />
      </Form.Item>

      {/* Спонтанное: общие поля */}
      {(RespMode === "spontaneous_no_o2" || RespMode === "spontaneous_with_o2") && (
        <Row gutter={12}>
          <Col span={6}>
            <Form.Item label="ЧД" name={["monitor", "resp", "rr"]}>
              <InputNumber addonAfter="в мин" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="SpO₂" name={["monitor", "resp", "spo2"]}>
              <InputNumber addonAfter="%" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="PO2/FiO2" name={["monitor", "resp", "pao2fio2"]}>
              <InputNumber addonAfter="" style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          {RespMode === "spontaneous_with_o2" && (
            <Col span={6}>
              <Form.Item label="Поток O₂" name={["monitor", "resp", "o2flow"]}>
                <InputNumber addonAfter="л/мин" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          )}
        </Row>
      )}

      {/* Вентиляция: расширенный набор */}
      {RespMode === "ventilated" && (
        <Row gutter={12}>
          <Col span={6}>
            <Form.Item label="Режим" name={["monitor", "resp", "ventMode"]}>
              <Select
                allowClear
                options={[
                  { value: "VCV", label: "VCV" },
                  { value: "PCV", label: "PCV" },
                  { value: "SIMV", label: "SIMV" },
                  { value: "PSV", label: "PSV" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Vin" name={["monitor", "resp", "vin"]}>
              <InputNumber addonAfter="мл" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Pip" name={["monitor", "resp", "pip"]}>
              <InputNumber addonAfter="см H₂O" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="PEEP" name={["monitor", "resp", "peep"]}>
              <InputNumber addonAfter="см H₂O" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="FiO₂" name={["monitor", "resp", "fio2"]}>
              <InputNumber addonAfter="%" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="PetCO₂" name={["monitor", "resp", "petco2"]}>
              <InputNumber addonAfter="мм рт.ст." style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* 4. Гепаторенальная функция */}
      <SectionTitle>4. Гепаторенальная функция</SectionTitle>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="Темп диуреза" name={["monitor", "hep", "diuresis"]}>
            <Input placeholder="Введите значение" addonAfter="мл/ч" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Мочевина" name={["monitor", "hep", "urea"]}>
            <InputNumber addonAfter="ммоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Креатинин" name={["monitor", "hep", "crea"]}>
            <InputNumber addonAfter="мкмоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Билирубин" name={["monitor", "hep", "bili"]}>
            <InputNumber addonAfter="мкмоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="АЛТ" name={["monitor", "hep", "alt"]}>
            <InputNumber addonAfter="Ед/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="АСТ" name={["monitor", "hep", "ast"]}>
            <InputNumber addonAfter="Ед/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Особенности" name={["monitor", "hep", "note"]}>
            <Input placeholder="гемодиализ / гемофильтрация / ГД и т.п." />
          </Form.Item>
        </Col>
      </Row>

      {/* 5. Гемостаз и анемический синдром */}
      <SectionTitle>5. Гемостаз и анемический синдром</SectionTitle>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="Hb" name={["monitor", "hemo", "hb"]}>
            <InputNumber addonAfter="г/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Эритроциты" name={["monitor", "hemo", "rbc"]}>
            <InputNumber addonAfter="×10⁶/мкл" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Ht" name={["monitor", "hemo", "hct"]}>
            <InputNumber addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Тромбоциты" name={["monitor", "hemo", "plt"]}>
            <InputNumber addonAfter="×10³/мкл" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="АЧТВ" name={["monitor", "hemo", "aptt"]}>
            <InputNumber addonAfter="сек" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="МНО" name={["monitor", "hemo", "inr"]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="ПТИ" name={["monitor", "hemo", "pti"]}>
            <InputNumber addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Фибриноген" name={["monitor", "hemo", "fib"]}>
            <InputNumber addonAfter="г/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      {/* 6. Инфекционно-воспалительный синдром */}
      <SectionTitle>6. Инфекционно-воспалительный синдром</SectionTitle>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="T° (макс за сутки)" name={["monitor", "inf", "tmax"]}>
            <InputNumber addonAfter="°C" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="СРБ" name={["monitor", "inf", "crp"]}>
            <InputNumber addonAfter="мг/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Прокальцитонин" name={["monitor", "inf", "pct"]}>
            <InputNumber addonAfter="нг/мл" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Лейкоциты" name={["monitor", "inf", "wbc"]}>
            <InputNumber addonAfter="×10⁹/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="Нейтрофилы" name={["monitor", "inf", "neut"]}>
            <InputNumber addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Лимфоциты" name={["monitor", "inf", "lymph"]}>
            <InputNumber addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      {/* 7. Метаболизм */}
      <SectionTitle>7. Метаболизм</SectionTitle>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="Глюкоза" name={["monitor", "met", "glucose"]}>
            <InputNumber addonAfter="ммоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="pH" name={["monitor", "met", "ph"]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Лактат" name={["monitor", "met", "lactate"]}>
            <InputNumber addonAfter="ммоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item label="PO2" name={["monitor", "met", "po2"]}>
            <InputNumber addonAfter="мм рт.ст." style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="PCO2" name={["monitor", "met", "pco2"]}>
            <InputNumber addonAfter="мм рт.ст." style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="BE" name={["monitor", "met", "be"]}>
            <InputNumber addonAfter="ммоль/л" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      {/* 8. Нежелательные события ОРИТ */}
      <SectionTitle>8. Нежелательные события ОРИТ</SectionTitle>
      <Form.Item name={["monitor", "icu", "adverse"]}>
        <TextArea rows={3} placeholder="Опишите событие / добавьте заметку" />
      </Form.Item>

      {/* 9. Дополнительные методы исследования — твой общий блок */}
      <SectionTitle>9. Дополнительные методы исследования</SectionTitle>
      <PatientActionsForm
        onAddNote={onAddNote}
        onAddTask={(t, d) => onAddTask(t, d)}
        onAddConsult={(t, d) => onAddConsult(t, d)}
        onAddRoute={onAddRoute}
      />
    </Card>
  );
};

export default ExtendedMonitoring;
