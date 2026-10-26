# SBS Underwriting Copilot — Prototipo local

Prototipo de demo para el cliente **SBS Seguros Colombia**, basado en el *Plan de
Implementación — SBS Underwriting Copilot (Caso B)*: un asistente que analiza,
clasifica y prioriza solicitudes de suscripción (folios) de las líneas de Casualty
y Responsabilidad Ambiental, usando el modelo de cinco categorías de decisión.

Este prototipo corre **100% en local, sin dependencias en la nube**: el motor de
clasificación es un conjunto de reglas deterministas que simula el comportamiento
descrito para los agentes de Azure AI Foundry, y los folios son datos sintéticos
(no son datos reales de SBS).

## Estructura

- `backend/` — API FastAPI (Python). Datos en memoria (se reinician al reiniciar el servidor).
  - `app/models.py` — modelo de datos de folios, suscriptores, fuentes y KPIs.
  - `app/classifier.py` — motor de clasificación de 5 categorías ("Copilot" simulado).
  - `app/seed.py` — generación de folios de ejemplo (sintéticos) para la demo.
  - `app/store.py` — operaciones en memoria: listar/filtrar, analizar, decidir, resúmenes.
- `frontend/` — React + TypeScript + Vite, consume la API local.

## Ejecutar el backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API disponible en http://localhost:8000 (docs interactivas en /docs).

## Ejecutar el frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend disponible en http://localhost:5173 (hace proxy de `/api` al backend en el puerto 8000).

## Qué muestra la demo

- **Línea base**: tarjetas con las cifras históricas citadas en el plan (2.460 folios,
  4 suscriptores, 53,9% cerrados administrativamente o declinados).
- **Piloto**: KPIs y distribución por categoría sobre un conjunto de ~48 folios sintéticos.
- **Selector de suscriptor**: simula la vista individual (Copilot Studio/Teams) vs. la
  vista consolidada de equipo.
- **Tabla de folios**: filtrable por suscriptor, categoría, estado y texto libre;
  marca posibles duplicados y fechas vencidas.
- **Informe por folio**: separa explícitamente la información por fuente (solicitante,
  documentos, histórico interno, fuentes externas, listas restrictivas, reglas de
  suscripción) y muestra la recomendación del Copilot con nivel de confianza.
- **Decisión humana**: cada folio requiere que el suscriptor registre la decisión
  final y, opcionalmente, retroalimentación sobre la recomendación — la decisión
  nunca se aplica automáticamente.

## Modelo de cinco categorías

| Cat. | Situación | Resultado principal |
|---|---|---|
| 1 | Información mínima insuficiente | Solicitud de información |
| 2 | Inquietudes o contradicciones | Solicitud de aclaración |
| 3 | Riesgo fuera de lineamientos | Declinación sustentada |
| 4 | Riesgo elegible y estandarizable | Cotización preliminar |
| 5 | Riesgo elegible no estandarizable | Informe y sugerencias |

