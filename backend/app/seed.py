"""Generación de datos simulados para el piloto local (sin datos reales de SBS).

Construye suscriptores y folios de ejemplo aplicando el motor de clasificación
determinista de ``classifier.py``, de modo que la demo sea reproducible.
"""

import random
from datetime import date, datetime, timedelta

from .classifier import clasificar
from .models import Adjunto, EstadoFolio, Feedback, Folio, FuenteInforme, Ramo, TipoNegocio

HOY = date(2026, 10, 3)

SUSCRIPTORES = [
    {"id": 1, "nombre": "Mariana Pérez Londoño", "email": "mariana.perez@sbsseguros.co"},
    {"id": 2, "nombre": "Carlos Andrés Gómez", "email": "carlos.gomez@sbsseguros.co"},
    {"id": 3, "nombre": "Laura Fernanda Ruiz", "email": "laura.ruiz@sbsseguros.co"},
    {"id": 4, "nombre": "Esteban Castaño Valencia", "email": "esteban.castano@sbsseguros.co"},
]

CLIENTES = [
    ("Constructora Andina S.A.S.", "900123456-7", "Construcción"),
    ("AgroVerde del Cauca Ltda.", "900234567-1", "Agroindustria"),
    ("Transportes del Valle S.A.", "900345678-2", "Transporte de carga"),
    ("Química Industrial del Norte S.A.S.", "900456789-3", "Química industrial"),
    ("Minerales del Oriente S.A.", "900567890-4", "Minería"),
    ("Ingeniería Ambiental Ltda.", "900678901-5", "Consultoría ambiental"),
    ("Logística Integral de Colombia S.A.S.", "900789012-6", "Logística"),
    ("Plásticos del Pacífico S.A.", "900890123-7", "Manufactura plástica"),
    ("Energía Renovable del Caribe S.A.S.", "900901234-8", "Energía"),
    ("Textiles Antioqueños S.A.", "901012345-9", "Textil"),
    ("Alimentos del Campo S.A.S.", "901123456-0", "Alimentos"),
    ("Cementos del Sur S.A.", "901234567-1", "Materiales de construcción"),
    ("Papelería Industrial Ltda.", "901345678-2", "Manufactura de papel"),
    ("Farmacéutica Andina S.A.S.", "901456789-3", "Farmacéutica"),
    ("Metalúrgica del Pacífico S.A.", "901567890-4", "Metalurgia"),
    ("Agroexportadora del Llano S.A.S.", "901678901-5", "Agroindustria"),
    ("Hidrocarburos del Magdalena S.A.", "901789012-6", "Hidrocarburos"),
    ("Residuos y Reciclaje S.A.S.", "901890123-7", "Gestión de residuos"),
]

INTERMEDIARIOS = [
    "Aon Colombia", "Marsh Colombia", "Willis Towers Watson",
    "Correduría Andina de Seguros", "Seguros & Riesgos Ltda.", "Proteger Corredores de Seguros",
]

RAMOS = [Ramo.RC_GENERAL, Ramo.RC_GENERAL, Ramo.RC_AMBIENTAL, Ramo.RC_AMBIENTAL,
         Ramo.RC_PRODUCTOS, Ramo.DYO, Ramo.OTRA_LINEA]

TIPOS_NEGOCIO = [TipoNegocio.NUEVO, TipoNegocio.RENOVACION, TipoNegocio.RENOVACION,
                 TipoNegocio.ENDOSO, TipoNegocio.PRECOTIZADO]

FALTANTES_POSIBLES = [
    "valor asegurado solicitado", "vigencia solicitada", "actividad económica detallada",
    "límite de responsabilidad requerido", "siniestralidad de los últimos 3 años",
    "descripción de operaciones y procesos",
]

MOTIVOS_FUERA_LINEAMIENTOS = [
    "actividad de minería a cielo abierto sin plan de manejo ambiental vigente",
    "límite de responsabilidad solicitado supera la capacidad autorizada para el ramo",
    "operación en zona de alto riesgo ambiental sin estudio de impacto vigente",
    "historial de siniestralidad reiterada en los últimos 24 meses",
]

# (categoria objetivo, peso) — refleja el mix descrito en el plan (alto peso en cat. 1-3)
DISTRIBUCION_CATEGORIAS = [(1, 28), (2, 15), (3, 20), (4, 22), (5, 15)]


def _pick_categoria(rng: random.Random) -> int:
    categorias, pesos = zip(*DISTRIBUCION_CATEGORIAS)
    return rng.choices(categorias, weights=pesos, k=1)[0]


def _folio_number(n: int) -> str:
    return f"FOL-2026-{n:05d}"


def _build_adjuntos(rng: random.Random, con_adjunto_ilegible: bool) -> list[Adjunto]:
    opciones = [
        ("Formulario de solicitud.pdf", "PDF"),
        ("Proforma vigente.xlsx", "Excel"),
        ("Carta de intermediario.msg", "MSG"),
        ("Póliza anterior.pdf", "PDF"),
        ("Plano de instalaciones.jpg", "Imagen"),
        ("Memoria técnica.docx", "Word"),
    ]
    elegidos = rng.sample(opciones, k=rng.randint(2, 4))
    adjuntos = [Adjunto(nombre=n, tipo=t, procesado=True) for n, t in elegidos]
    if con_adjunto_ilegible and adjuntos:
        idx = rng.randrange(len(adjuntos))
        adjuntos[idx] = Adjunto(
            nombre=adjuntos[idx].nombre,
            tipo=adjuntos[idx].tipo,
            procesado=False,
            nota="Imagen escaneada de baja calidad: no procesable automáticamente.",
        )
    return adjuntos


def _build_fuentes(
    rng: random.Random, cliente: str, nit: str, ramo: Ramo, tipo_negocio: TipoNegocio,
    intermediario: str, fecha_recepcion: date, duplicado_de: str | None,
) -> FuenteInforme:
    info_solicitante = (
        f"{cliente} (NIT {nit}) solicita {tipo_negocio.value.lower()} en {ramo.value} "
        f"a través de {intermediario}. Recepción: {fecha_recepcion.isoformat()}."
    )

    info_documentos = [
        "Formulario de solicitud: actividad económica y límites declarados por el cliente.",
        rng.choice([
            "Proforma previa localizada en el repositorio de proformas vigentes.",
            "No se encontró proforma previa asociada a esta actividad; requiere cotización manual.",
        ]),
    ]

    if duplicado_de:
        info_historica = [f"Folio relacionado detectado por NIT y ramo: {duplicado_de}."]
    else:
        info_historica = [rng.choice([
            "Sin pólizas previas registradas en el histórico consultado.",
            "Póliza anterior vigente en el periodo previo, sin siniestros reportados.",
            "Registro de un siniestro menor en el periodo anterior, ya cerrado.",
        ])]

    fuentes_externas = [rng.choice([
        "Sin hallazgos relevantes en fuentes públicas (verificación manual pendiente).",
        "Mención en prensa local sobre un hallazgo menor; requiere verificación de fuente primaria antes de usarse.",
        "Sin información adicional disponible en fuentes externas consultadas.",
    ])]

    resultado_listas = rng.choices(
        [
            "Sin coincidencias en listas restrictivas consultadas.",
            "Coincidencia parcial por nombre en lista restrictiva: requiere verificación de identidad antes de cualquier decisión.",
        ],
        weights=[90, 10], k=1,
    )[0]

    reglas_suscripcion = [
        f"Límite de capacidad vigente para {ramo.value}: consultar matriz de suscripción.",
        "Toda recomendación requiere aprobación del suscriptor asignado.",
    ]

    return FuenteInforme(
        info_solicitante=info_solicitante,
        info_documentos=info_documentos,
        info_historica=info_historica,
        fuentes_externas=fuentes_externas,
        resultado_listas=resultado_listas,
        reglas_suscripcion=reglas_suscripcion,
    )


def generar_folios(seed: int = 42, cantidad: int = 48) -> list[Folio]:
    rng = random.Random(seed)
    folios: list[Folio] = []
    historial_por_cliente: dict[str, str] = {}

    for i in range(1, cantidad + 1):
        folio_number = _folio_number(i)
        suscriptor = SUSCRIPTORES[(i - 1) % len(SUSCRIPTORES)]
        cliente, nit, _actividad = rng.choice(CLIENTES)

        es_duplicado = cliente in historial_por_cliente and rng.random() < 0.35
        duplicado_de = historial_por_cliente.get(cliente) if es_duplicado else None
        duplicado_score = round(rng.uniform(0.75, 0.97), 2) if duplicado_de else None
        if not duplicado_de:
            historial_por_cliente[cliente] = folio_number

        ramo = rng.choice(RAMOS)
        tipo_negocio = rng.choice(TIPOS_NEGOCIO)
        intermediario = rng.choice(INTERMEDIARIOS)

        fecha_recepcion = HOY - timedelta(days=rng.randint(0, 28))
        fecha_maxima = fecha_recepcion + timedelta(days=rng.randint(5, 15))

        categoria_objetivo = _pick_categoria(rng)
        informacion_minima_completa = categoria_objetivo != 1
        faltantes = [] if informacion_minima_completa else rng.sample(FALTANTES_POSIBLES, k=rng.randint(1, 3))
        tiene_contradicciones = categoria_objetivo == 2
        fuera_lineamientos = categoria_objetivo == 3
        motivo_fuera_lineamientos = rng.choice(MOTIVOS_FUERA_LINEAMIENTOS) if fuera_lineamientos else None
        estandarizable = categoria_objetivo == 4

        descripcion = (
            "Favor cotizar, queda pendiente el resto de información." if not informacion_minima_completa
            else f"Solicitud de {tipo_negocio.value.lower()} para {cliente} en {ramo.value}. "
                 f"Incluye descripción de operaciones y documentación de soporte."
        )

        adjuntos = _build_adjuntos(rng, con_adjunto_ilegible=rng.random() < 0.2)
        fuentes = _build_fuentes(
            rng, cliente, nit, ramo, tipo_negocio, intermediario, fecha_recepcion, duplicado_de,
        )

        estado_roll = rng.random()
        created_at = datetime.combine(fecha_recepcion, datetime.min.time())

        folio = Folio(
            id=i,
            folio_number=folio_number,
            suscriptor_id=suscriptor["id"],
            suscriptor_nombre=suscriptor["nombre"],
            cliente=cliente,
            nit=nit,
            intermediario=intermediario,
            ramo=ramo,
            tipo_negocio=tipo_negocio,
            fecha_recepcion=fecha_recepcion,
            fecha_maxima=fecha_maxima,
            descripcion=descripcion,
            adjuntos=adjuntos,
            informacion_minima_completa=informacion_minima_completa,
            faltantes=faltantes,
            duplicado_de=duplicado_de,
            duplicado_score=duplicado_score,
            fuera_lineamientos=fuera_lineamientos,
            motivo_fuera_lineamientos=motivo_fuera_lineamientos,
            estandarizable=estandarizable,
            fuentes=fuentes,
            estado=EstadoFolio.NUEVO,
            created_at=created_at,
            updated_at=created_at,
        )

        if estado_roll >= 0.2:
            resultado = clasificar(folio, tiene_contradicciones)
            folio.categoria = resultado.categoria
            folio.confianza = resultado.confianza
            folio.recomendacion = resultado.recomendacion
            folio.hallazgos = resultado.hallazgos
            folio.estado = EstadoFolio.ANALIZADO
            folio.updated_at = created_at + timedelta(hours=rng.randint(2, 30))

            if estado_roll >= 0.6:
                folio.decision_final = rng.choice([
                    "Aprobado conforme a la recomendación del Copilot.",
                    "Se solicitó información adicional antes de decidir.",
                    "Decisión ajustada por el suscriptor tras revisión manual.",
                ])
                folio.feedback = rng.choice([
                    Feedback.CORRECTA, Feedback.CORRECTA, Feedback.PARCIAL, Feedback.CATEGORIA_MODIFICADA,
                ])
                folio.estado = EstadoFolio.DECISION_TOMADA
                folio.updated_at = folio.updated_at + timedelta(hours=rng.randint(1, 20))

        folios.append(folio)

    return folios
