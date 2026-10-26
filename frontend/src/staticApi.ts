import seedData from "./seed-data.json";
import type {
  DecisionInput,
  Folio,
  FolioFilters,
  KpisGlobales,
  ResumenSuscriptor,
  Suscriptor,
} from "./api";

const STORAGE_KEY = "sbs-underwriting-pages-v1";
const suscriptores = seedData.suscriptores as Suscriptor[];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadFolios(): Folio[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as Folio[]) : clone(seedData.folios as Folio[]);
}

let folios = loadFolios();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFolio(folioId: number): Folio {
  const folio = folios.find((item) => item.id === folioId);
  if (!folio) throw new Error(`Folio ${folioId} no encontrado.`);
  return folio;
}

function saveFolio(updated: Folio): Folio {
  folios = folios.map((folio) => (folio.id === updated.id ? updated : folio));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folios));
  return clone(updated);
}

function getResumenSuscriptor(suscriptorId: number): ResumenSuscriptor {
  const suscriptor = suscriptores.find((item) => item.id === suscriptorId);
  if (!suscriptor) throw new Error(`Suscriptor ${suscriptorId} no encontrado.`);

  const assigned = folios.filter((folio) => folio.suscriptor_id === suscriptorId);
  const porCategoria: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const folio of assigned) {
    if (folio.categoria) porCategoria[String(folio.categoria)] += 1;
  }

  return {
    suscriptor_id: suscriptor.id,
    suscriptor_nombre: suscriptor.nombre,
    total_folios: assigned.length,
    analizados: assigned.filter((folio) => folio.estado !== "nuevo").length,
    pendientes: assigned.filter((folio) => folio.estado === "nuevo").length,
    con_decision: assigned.filter((folio) => folio.estado === "decision_tomada").length,
    duplicados_detectados: assigned.filter((folio) => Boolean(folio.duplicado_de)).length,
    vencidos: assigned.filter(
      (folio) => folio.fecha_maxima < today() && folio.estado !== "decision_tomada",
    ).length,
    por_categoria: porCategoria,
  };
}

function getKpis(): KpisGlobales {
  const porCategoria: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const folio of folios) {
    if (folio.categoria) porCategoria[String(folio.categoria)] += 1;
  }

  const analizados = folios.filter((folio) => folio.estado !== "nuevo").length;
  return {
    baseline_total_folios: 2460,
    baseline_suscriptores: 4,
    baseline_cerrados_declinados: 1326,
    baseline_cerrados_declinados_pct: 53.9,
    piloto_total_folios: folios.length,
    piloto_analizados: analizados,
    piloto_analizados_pct: folios.length ? Math.round((analizados / folios.length) * 1000) / 10 : 0,
    piloto_duplicados_detectados: folios.filter((folio) => Boolean(folio.duplicado_de)).length,
    piloto_vencidos: folios.filter(
      (folio) => folio.fecha_maxima < today() && folio.estado !== "decision_tomada",
    ).length,
    piloto_por_categoria: porCategoria,
  };
}

function clasificar(folio: Folio): Pick<Folio, "categoria" | "confianza" | "recomendacion" | "hallazgos"> {
  const hallazgos: string[] = [];

  if (folio.duplicado_de) {
    hallazgos.push(
      `Posible duplicado del folio ${folio.duplicado_de} (similitud ${Math.round((folio.duplicado_score ?? 0) * 100)}% por NIT, ramo y vigencia).`,
    );
  }

  const noProcesados = folio.adjuntos.filter((adjunto) => !adjunto.procesado).map((adjunto) => adjunto.nombre);
  if (noProcesados.length) {
    hallazgos.push(
      `Adjuntos no procesables marcados explícitamente (no se asume su contenido): ${noProcesados.join(", ")}`,
    );
  }

  if (!folio.informacion_minima_completa) {
    hallazgos.push(`Información mínima incompleta: ${folio.faltantes.join(", ")}`);
    return {
      categoria: 1,
      confianza: 0.6,
      recomendacion: "Solicitar al intermediario la información faltante antes de continuar el análisis.",
      hallazgos,
    };
  }

  if (folio.categoria === 2) {
    hallazgos.push("Se detectaron inconsistencias entre el formulario y los documentos adjuntos.");
    return {
      categoria: 2,
      confianza: 0.65,
      recomendacion: "Enviar preguntas de aclaración al intermediario/cliente antes de clasificar el riesgo.",
      hallazgos,
    };
  }

  if (folio.fuera_lineamientos) {
    hallazgos.push(`Riesgo fuera de lineamientos de suscripción: ${folio.motivo_fuera_lineamientos}`);
    return {
      categoria: 3,
      confianza: 0.8,
      recomendacion: "Preparar declinación sustentada para aprobación del suscriptor.",
      hallazgos,
    };
  }

  if (folio.estandarizable) {
    hallazgos.push("Riesgo dentro de apetito y cubierto por proforma/plantilla estándar vigente.");
    return {
      categoria: 4,
      confianza: 0.85,
      recomendacion: "Generar borrador de cotización preliminar estándar para revisión del suscriptor.",
      hallazgos,
    };
  }

  hallazgos.push("Riesgo elegible pero no cubierto por una plantilla estándar vigente.");
  return {
    categoria: 5,
    confianza: 0.7,
    recomendacion: "Estructurar informe de suscripción con sugerencias para decisión manual.",
    hallazgos,
  };
}

export const staticApi = {
  async listSuscriptores(): Promise<Suscriptor[]> {
    return clone(suscriptores);
  },

  async getResumenSuscriptor(suscriptorId: number): Promise<ResumenSuscriptor> {
    return getResumenSuscriptor(suscriptorId);
  },

  async getKpis(): Promise<KpisGlobales> {
    return getKpis();
  },

  async listFolios(filters: FolioFilters = {}): Promise<Folio[]> {
    const query = filters.q?.toLocaleLowerCase();
    return clone(
      folios.filter(
        (folio) =>
          (filters.suscriptor_id === undefined || folio.suscriptor_id === filters.suscriptor_id) &&
          (filters.categoria === undefined || folio.categoria === filters.categoria) &&
          (!filters.estado || folio.estado === filters.estado) &&
          (!query ||
            folio.cliente.toLocaleLowerCase().includes(query) ||
            folio.folio_number.toLocaleLowerCase().includes(query) ||
            folio.nit.toLocaleLowerCase().includes(query)),
      ),
    );
  },

  async getFolio(folioId: number): Promise<Folio> {
    return clone(getFolio(folioId));
  },

  async analizarFolio(folioId: number): Promise<Folio> {
    const folio = getFolio(folioId);
    return saveFolio({
      ...folio,
      ...clasificar(folio),
      estado: "analizado",
      updated_at: new Date().toISOString(),
    });
  },

  async decidirFolio(folioId: number, payload: DecisionInput): Promise<Folio> {
    const folio = getFolio(folioId);
    if (folio.estado === "nuevo") {
      throw new Error("El folio debe analizarse antes de registrar una decisión.");
    }
    if (!payload.decision_final.trim() || payload.decision_final.length > 500) {
      throw new Error("La decisión debe tener entre 1 y 500 caracteres.");
    }

    return saveFolio({
      ...folio,
      decision_final: payload.decision_final,
      feedback: payload.feedback,
      estado: "decision_tomada",
      updated_at: new Date().toISOString(),
    });
  },
};
