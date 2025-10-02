import type { Patient, RiskLevel } from "./types";
import { VITAL_LABELS } from "./constants";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function makePatient(id: number, risk: RiskLevel): Patient {
  const units = ["ЦКБ №1", "ГБ №1", "ГБ №2", "МКДЦ", "ГБ №3"];
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() - 1);
  const d2 = new Date(today); d2.setDate(today.getDate() - 2);
  const dateISO = (d: Date) => d.toISOString().slice(0, 10);

  const dynRows = [
    "scales","sofa","apache","gcs","neuro","neuro_note","cv","hemo","bp","hr","inotrop","cv_note",
    "resp","vent","rr","spo2","mode","vin","pip","peep","fio2","petco2","hep1","diuresis","urea",
    "crea","bili","alt","ast","hep_note","hem","hb","rbc","hct","plt"
  ];

  const dates = [dateISO(today), dateISO(d1), dateISO(d2)];
  const values: Patient["dynValues"] = {};
  dynRows.forEach(k => {
    values[k] = {};
    dates.forEach(ds => values[k]![ds] = "");
  });

  const uid = () => (crypto as any)?.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2)}`;

  return {
    id: `p-${id}`,
    unit: units[rand(0, units.length - 1)]!,
    bed: `Оргт 1:${rand(1, 6)}`,
    caseId: "КД-14",
    name: ["Анна", "Иван", "Виктор", "Мария", "Олег", "Ксения"][rand(0, 5)]!,
    age: `${["Ж", "М"][rand(0, 1)]} ${rand(22, 78)} лет`,
    code: `A ${rand(10, 16)}.${rand(1, 9)}`,
    risk,
    tags: Math.random() > 0.6 ? ["МКЦЦ", "ИВЛ"] : ["ИВЛ"],
    extended: Math.random() > 0.8,
    status: "active",
    notes: [],
    tasks: [],
    vitals: [
      { key: "sofa", label: VITAL_LABELS.sofa, value: rand(6, 15), bad: true },
      { key: "spo2", label: VITAL_LABELS.spo2, value: rand(88, 100), trend: "up" },
      { key: "hr",   label: VITAL_LABELS.hr,   value: rand(60, 145), trend: "flat" },
      { key: "bp",   label: VITAL_LABELS.bp,   value: `${rand(90, 160)}/${rand(60, 100)}` },
      { key: "temp", label: VITAL_LABELS.temp, value: (36 + Math.random() * 2).toFixed(1) },
    ],
    dynDates: dates,
    dynValues: values,
    chat: [
      { id: uid(), who: "Георгий А.А • Кардиохирург", text: "Высокий уровень лейкоцитов — нужна помощь.", at: "11:13" },
      { id: uid(), who: "Анна В.А • Кардиолог", text: "Попробуйте скорректировать питание.", at: "11:15" },
    ],
    routes: [],
  };
}

export const initialPatients: Patient[] = [
  ...Array.from({ length: 10 }, (_, i) => makePatient(i + 1, "high")),
  ...Array.from({ length: 15 }, (_, i) => makePatient(i + 20, "medium")),
  ...Array.from({ length: 12 }, (_, i) => makePatient(i + 40, "low")),
];
