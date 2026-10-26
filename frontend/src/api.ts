import { staticApi } from "./staticApi";

export type Ramo =
  | "Responsabilidad Civil General"
  | "Responsabilidad Ambiental"
  | "Responsabilidad de Producto"
  | "D&O"
  | "Otra línea (fuera de alcance)";

export type TipoNegocio = "Nuevo negocio" | "Renovación" | "Endoso" | "Precotizado";

export type EstadoFolio = "nuevo" | "analizado" | "decision_tomada";

export type Feedback =
  | "correcta"
  | "parcial"
  | "incorrecta"
  | "informacion_omitida"
  | "fuente_no_pertinente"
  | "categoria_modificada";

export interface Adjunto {
  nombre: string;
  tipo: string;
  procesado: boolean;
  nota: string | null;
}

export interface FuenteInforme {
  info_solicitante: string;
  info_documentos: string[];
  info_historica: string[];
  fuentes_externas: string[];
  resultado_listas: string;
  reglas_suscripcion: string[];
}

export interface Folio {
  id: number;
  folio_number: string;
  suscriptor_id: number;
  suscriptor_nombre: string;
  cliente: string;
  nit: string;
  intermediario: string;
  ramo: Ramo;
  tipo_negocio: TipoNegocio;
  fecha_recepcion: string;
  fecha_maxima: string;
  descripcion: string;
  adjuntos: Adjunto[];
  informacion_minima_completa: boolean;
  faltantes: string[];
  duplicado_de: string | null;
  duplicado_score: number | null;
  fuera_lineamientos: boolean;
  motivo_fuera_lineamientos: string | null;
  estandarizable: boolean;
  fuentes: FuenteInforme;
  categoria: number | null;
  confianza: number | null;
  hallazgos: string[];
  recomendacion: string | null;
  decision_final: string | null;
  feedback: Feedback | null;
  estado: EstadoFolio;
  created_at: string;
  updated_at: string;
}

export interface Suscriptor {
  id: number;
  nombre: string;
  email: string;
}

export interface ResumenSuscriptor {
  suscriptor_id: number;
  suscriptor_nombre: string;
  total_folios: number;
  analizados: number;
  pendientes: number;
  con_decision: number;
  duplicados_detectados: number;
  vencidos: number;
  por_categoria: Record<string, number>;
}

export interface KpisGlobales {
  baseline_total_folios: number;
  baseline_suscriptores: number;
  baseline_cerrados_declinados: number;
  baseline_cerrados_declinados_pct: number;
  piloto_total_folios: number;
  piloto_analizados: number;
  piloto_analizados_pct: number;
  piloto_duplicados_detectados: number;
  piloto_vencidos: number;
  piloto_por_categoria: Record<string, number>;
}

export interface DecisionInput {
  decision_final: string;
  feedback: Feedback | null;
}

export interface FolioFilters {
  suscriptor_id?: number;
  categoria?: number;
  estado?: EstadoFolio;
  q?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQueryString(filters: FolioFilters): string {
  const params = new URLSearchParams();
  if (filters.suscriptor_id !== undefined) params.set("suscriptor_id", String(filters.suscriptor_id));
  if (filters.categoria !== undefined) params.set("categoria", String(filters.categoria));
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listSuscriptores: (): Promise<Suscriptor[]> =>
    import.meta.env.MODE === "pages"
      ? staticApi.listSuscriptores()
      : fetch("/api/suscriptores").then((r) => handleResponse(r)),

  getResumenSuscriptor: (suscriptorId: number): Promise<ResumenSuscriptor> =>
    import.meta.env.MODE === "pages"
      ? staticApi.getResumenSuscriptor(suscriptorId)
      : fetch(`/api/suscriptores/${suscriptorId}/resumen`).then((r) => handleResponse(r)),

  getKpis: (): Promise<KpisGlobales> =>
    import.meta.env.MODE === "pages"
      ? staticApi.getKpis()
      : fetch("/api/kpis").then((r) => handleResponse(r)),

  listFolios: (filters: FolioFilters = {}): Promise<Folio[]> =>
    import.meta.env.MODE === "pages"
      ? staticApi.listFolios(filters)
      : fetch(`/api/folios${toQueryString(filters)}`).then((r) => handleResponse(r)),

  getFolio: (id: number): Promise<Folio> =>
    import.meta.env.MODE === "pages"
      ? staticApi.getFolio(id)
      : fetch(`/api/folios/${id}`).then((r) => handleResponse(r)),

  analizarFolio: (id: number): Promise<Folio> =>
    import.meta.env.MODE === "pages"
      ? staticApi.analizarFolio(id)
      : fetch(`/api/folios/${id}/analizar`, { method: "POST" }).then((r) => handleResponse(r)),

  decidirFolio: (id: number, payload: DecisionInput): Promise<Folio> =>
    import.meta.env.MODE === "pages"
      ? staticApi.decidirFolio(id, payload)
      : fetch(`/api/folios/${id}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => handleResponse(r)),
};
