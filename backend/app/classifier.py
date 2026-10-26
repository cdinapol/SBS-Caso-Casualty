"""Motor de clasificación simulado del SBS Underwriting Copilot.

Implementa, con reglas deterministas (sin llamadas a Azure AI Foundry), el modelo
de cinco categorías de decisión descrito en el plan de implementación. Sirve para
el prototipo local: no reemplaza el pipeline real de agentes sobre Azure AI Foundry.
"""

from dataclasses import dataclass

from .models import Folio

CATEGORIA_LABELS: dict[int, str] = {
    1: "Información mínima insuficiente",
    2: "Inquietudes o contradicciones",
    3: "Riesgo fuera de lineamientos",
    4: "Riesgo elegible y estandarizable",
    5: "Riesgo elegible no estandarizable",
}

CATEGORIA_RESULTADO: dict[int, str] = {
    1: "Solicitud de información",
    2: "Solicitud de aclaración",
    3: "Declinación sustentada",
    4: "Cotización preliminar",
    5: "Informe y sugerencias",
}


@dataclass
class Clasificacion:
    categoria: int
    confianza: float
    recomendacion: str
    hallazgos: list[str]


def clasificar(folio: Folio, tiene_contradicciones: bool) -> Clasificacion:
    """Aplica el modelo de cinco categorías. El Copilot recomienda; el suscriptor decide."""

    hallazgos: list[str] = []

    if folio.duplicado_de:
        hallazgos.append(
            f"Posible duplicado del folio {folio.duplicado_de} "
            f"(similitud {round((folio.duplicado_score or 0) * 100)}% por NIT, ramo y vigencia)."
        )

    adjuntos_no_procesados = [a.nombre for a in folio.adjuntos if not a.procesado]
    if adjuntos_no_procesados:
        hallazgos.append(
            "Adjuntos no procesables marcados explícitamente (no se asume su contenido): "
            + ", ".join(adjuntos_no_procesados)
        )

    if not folio.informacion_minima_completa:
        hallazgos.append("Información mínima incompleta: " + ", ".join(folio.faltantes))
        return Clasificacion(
            categoria=1,
            confianza=0.6,
            recomendacion="Solicitar al intermediario la información faltante antes de continuar el análisis.",
            hallazgos=hallazgos,
        )

    if tiene_contradicciones:
        hallazgos.append("Se detectaron inconsistencias entre el formulario y los documentos adjuntos.")
        return Clasificacion(
            categoria=2,
            confianza=0.65,
            recomendacion="Enviar preguntas de aclaración al intermediario/cliente antes de clasificar el riesgo.",
            hallazgos=hallazgos,
        )

    if folio.fuera_lineamientos:
        hallazgos.append(f"Riesgo fuera de lineamientos de suscripción: {folio.motivo_fuera_lineamientos}")
        return Clasificacion(
            categoria=3,
            confianza=0.8,
            recomendacion="Preparar declinación sustentada para aprobación del suscriptor.",
            hallazgos=hallazgos,
        )

    if folio.estandarizable:
        hallazgos.append("Riesgo dentro de apetito y cubierto por proforma/plantilla estándar vigente.")
        return Clasificacion(
            categoria=4,
            confianza=0.85,
            recomendacion="Generar borrador de cotización preliminar estándar para revisión del suscriptor.",
            hallazgos=hallazgos,
        )

    hallazgos.append("Riesgo elegible pero no cubierto por una plantilla estándar vigente.")
    return Clasificacion(
        categoria=5,
        confianza=0.7,
        recomendacion="Estructurar informe de suscripción con sugerencias para decisión manual.",
        hallazgos=hallazgos,
    )
