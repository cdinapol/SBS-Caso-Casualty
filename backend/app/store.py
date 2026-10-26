from datetime import datetime
from threading import Lock
from typing import Optional

from fastapi import HTTPException

from .classifier import clasificar
from .models import (
    DecisionInput,
    EstadoFolio,
    Folio,
    KpisGlobales,
    ResumenSuscriptor,
    Suscriptor,
)
from .seed import HOY, SUSCRIPTORES, generar_folios

_lock = Lock()
_suscriptores: list[Suscriptor] = [Suscriptor(**s) for s in SUSCRIPTORES]
_folios: dict[int, Folio] = {f.id: f for f in generar_folios()}

# Línea base histórica citada en el plan de implementación (no es parte del piloto).
BASELINE_TOTAL_FOLIOS = 2460
BASELINE_SUSCRIPTORES = 4
BASELINE_CERRADOS_DECLINADOS = 1326


def list_suscriptores() -> list[Suscriptor]:
    return _suscriptores


def get_suscriptor(suscriptor_id: int) -> Suscriptor:
    for s in _suscriptores:
        if s.id == suscriptor_id:
            return s
    raise HTTPException(status_code=404, detail="Suscriptor not found")


def list_folios(
    suscriptor_id: Optional[int] = None,
    categoria: Optional[int] = None,
    estado: Optional[EstadoFolio] = None,
    q: Optional[str] = None,
) -> list[Folio]:
    folios = sorted(_folios.values(), key=lambda f: f.id)

    if suscriptor_id is not None:
        folios = [f for f in folios if f.suscriptor_id == suscriptor_id]
    if categoria is not None:
        folios = [f for f in folios if f.categoria == categoria]
    if estado is not None:
        folios = [f for f in folios if f.estado == estado]
    if q:
        q_lower = q.lower()
        folios = [
            f for f in folios
            if q_lower in f.cliente.lower()
            or q_lower in f.folio_number.lower()
            or q_lower in f.nit.lower()
        ]
    return folios


def get_folio(folio_id: int) -> Folio:
    folio = _folios.get(folio_id)
    if folio is None:
        raise HTTPException(status_code=404, detail="Folio not found")
    return folio


def analizar_folio(folio_id: int) -> Folio:
    with _lock:
        folio = get_folio(folio_id)
        # El prototipo re-ejecuta el motor de reglas determinista; en producción
        # este paso lo realizan los agentes orquestados por Azure AI Foundry.
        tiene_contradicciones = folio.categoria == 2
        resultado = clasificar(folio, tiene_contradicciones)
        folio.categoria = resultado.categoria
        folio.confianza = resultado.confianza
        folio.recomendacion = resultado.recomendacion
        folio.hallazgos = resultado.hallazgos
        folio.estado = EstadoFolio.ANALIZADO
        folio.updated_at = datetime.utcnow()
        _folios[folio_id] = folio
        return folio


def decidir_folio(folio_id: int, payload: DecisionInput) -> Folio:
    with _lock:
        folio = get_folio(folio_id)
        if folio.estado == EstadoFolio.NUEVO:
            raise HTTPException(
                status_code=409,
                detail="El folio debe analizarse antes de registrar una decisión.",
            )
        folio.decision_final = payload.decision_final
        folio.feedback = payload.feedback
        folio.estado = EstadoFolio.DECISION_TOMADA
        folio.updated_at = datetime.utcnow()
        _folios[folio_id] = folio
        return folio


def resumen_suscriptor(suscriptor_id: int) -> ResumenSuscriptor:
    suscriptor = get_suscriptor(suscriptor_id)
    folios = list_folios(suscriptor_id=suscriptor_id)
    por_categoria = {str(c): 0 for c in range(1, 6)}
    for f in folios:
        if f.categoria:
            por_categoria[str(f.categoria)] += 1

    return ResumenSuscriptor(
        suscriptor_id=suscriptor.id,
        suscriptor_nombre=suscriptor.nombre,
        total_folios=len(folios),
        analizados=sum(1 for f in folios if f.estado != EstadoFolio.NUEVO),
        pendientes=sum(1 for f in folios if f.estado == EstadoFolio.NUEVO),
        con_decision=sum(1 for f in folios if f.estado == EstadoFolio.DECISION_TOMADA),
        duplicados_detectados=sum(1 for f in folios if f.duplicado_de),
        vencidos=sum(1 for f in folios if f.fecha_maxima < HOY and f.estado != EstadoFolio.DECISION_TOMADA),
        por_categoria=por_categoria,
    )


def kpis_globales() -> KpisGlobales:
    folios = list_folios()
    por_categoria = {str(c): 0 for c in range(1, 6)}
    for f in folios:
        if f.categoria:
            por_categoria[str(f.categoria)] += 1

    analizados = sum(1 for f in folios if f.estado != EstadoFolio.NUEVO)
    total = len(folios)

    return KpisGlobales(
        baseline_total_folios=BASELINE_TOTAL_FOLIOS,
        baseline_suscriptores=BASELINE_SUSCRIPTORES,
        baseline_cerrados_declinados=BASELINE_CERRADOS_DECLINADOS,
        baseline_cerrados_declinados_pct=round(
            BASELINE_CERRADOS_DECLINADOS / BASELINE_TOTAL_FOLIOS * 100, 1
        ),
        piloto_total_folios=total,
        piloto_analizados=analizados,
        piloto_analizados_pct=round(analizados / total * 100, 1) if total else 0.0,
        piloto_duplicados_detectados=sum(1 for f in folios if f.duplicado_de),
        piloto_vencidos=sum(1 for f in folios if f.fecha_maxima < HOY and f.estado != EstadoFolio.DECISION_TOMADA),
        piloto_por_categoria=por_categoria,
    )
