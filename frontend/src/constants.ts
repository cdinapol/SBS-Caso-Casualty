export const CATEGORIA_LABELS: Record<number, string> = {
  1: "Información mínima insuficiente",
  2: "Inquietudes o contradicciones",
  3: "Riesgo fuera de lineamientos",
  4: "Riesgo elegible y estandarizable",
  5: "Riesgo elegible no estandarizable",
};

export const CATEGORIA_RESULTADO: Record<number, string> = {
  1: "Solicitud de información",
  2: "Solicitud de aclaración",
  3: "Declinación sustentada",
  4: "Cotización preliminar",
  5: "Informe y sugerencias",
};

export const CATEGORIA_CLASS: Record<number, string> = {
  1: "cat-1",
  2: "cat-2",
  3: "cat-3",
  4: "cat-4",
  5: "cat-5",
};

export const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo (sin analizar)",
  analizado: "Analizado por el agente",
  decision_tomada: "Decisión registrada",
};

export const FEEDBACK_LABELS: Record<string, string> = {
  correcta: "Recomendación correcta",
  parcial: "Parcialmente correcta",
  incorrecta: "Incorrecta",
  informacion_omitida: "Información omitida",
  fuente_no_pertinente: "Fuente no pertinente",
  categoria_modificada: "Categoría modificada",
};
