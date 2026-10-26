from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Ramo(str, Enum):
    RC_GENERAL = "Responsabilidad Civil General"
    RC_AMBIENTAL = "Responsabilidad Ambiental"
    RC_PRODUCTOS = "Responsabilidad de Producto"
    DYO = "D&O"
    OTRA_LINEA = "Otra línea (fuera de alcance)"


class TipoNegocio(str, Enum):
    NUEVO = "Nuevo negocio"
    RENOVACION = "Renovación"
    ENDOSO = "Endoso"
    PRECOTIZADO = "Precotizado"


class EstadoFolio(str, Enum):
    NUEVO = "nuevo"
    ANALIZADO = "analizado"
    DECISION_TOMADA = "decision_tomada"


class Feedback(str, Enum):
    CORRECTA = "correcta"
    PARCIAL = "parcial"
    INCORRECTA = "incorrecta"
    INFO_OMITIDA = "informacion_omitida"
    FUENTE_NO_PERTINENTE = "fuente_no_pertinente"
    CATEGORIA_MODIFICADA = "categoria_modificada"


class Adjunto(BaseModel):
    nombre: str
    tipo: str  # PDF, Excel, Word, Imagen, MSG
    procesado: bool
    nota: Optional[str] = None


class FuenteInforme(BaseModel):
    """Separación de resultados: cada hallazgo conserva su origen."""

    info_solicitante: str
    info_documentos: list[str]
    info_historica: list[str]
    fuentes_externas: list[str]
    resultado_listas: str
    reglas_suscripcion: list[str]


class Suscriptor(BaseModel):
    id: int
    nombre: str
    email: str


class Folio(BaseModel):
    id: int
    folio_number: str
    suscriptor_id: int
    suscriptor_nombre: str
    cliente: str
    nit: str
    intermediario: str
    ramo: Ramo
    tipo_negocio: TipoNegocio
    fecha_recepcion: date
    fecha_maxima: date
    descripcion: str
    adjuntos: list[Adjunto]
    informacion_minima_completa: bool
    faltantes: list[str]
    duplicado_de: Optional[str] = None
    duplicado_score: Optional[float] = None
    fuera_lineamientos: bool
    motivo_fuera_lineamientos: Optional[str] = None
    estandarizable: bool
    fuentes: FuenteInforme
    categoria: Optional[int] = None
    confianza: Optional[float] = None
    hallazgos: list[str] = Field(default_factory=list)
    recomendacion: Optional[str] = None
    decision_final: Optional[str] = None
    feedback: Optional[Feedback] = None
    estado: EstadoFolio
    created_at: datetime
    updated_at: datetime


class DecisionInput(BaseModel):
    decision_final: str = Field(..., min_length=1, max_length=500)
    feedback: Optional[Feedback] = None


class ResumenSuscriptor(BaseModel):
    suscriptor_id: int
    suscriptor_nombre: str
    total_folios: int
    analizados: int
    pendientes: int
    con_decision: int
    duplicados_detectados: int
    vencidos: int
    por_categoria: dict[str, int]


class KpisGlobales(BaseModel):
    baseline_total_folios: int
    baseline_suscriptores: int
    baseline_cerrados_declinados: int
    baseline_cerrados_declinados_pct: float
    piloto_total_folios: int
    piloto_analizados: int
    piloto_analizados_pct: float
    piloto_duplicados_detectados: int
    piloto_vencidos: int
    piloto_por_categoria: dict[str, int]
