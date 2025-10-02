// Общие типы для "общего чата"
export type CommonMessage = {
    id: string;
    who: string;
    text: string;
    at: string; // "HH:MM"
    files?: { name: string; size?: number }[];
  };