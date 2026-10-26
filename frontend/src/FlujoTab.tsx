import { DiagramaLogico } from "./DiagramaLogico";

const PIPELINE = [
  {
    n: 1,
    titulo: "Ingesta",
    agente: "Power Automate",
    detalle: "Detecta archivos nuevos o actualizados (archivo maestro + carpeta por folio) y los deposita en la entrada.",
  },
  {
    n: 2,
    titulo: "Extracción",
    agente: "Document Intelligence",
    detalle: "Procesa cada adjunto (PDF, Excel, Word, imágenes, MSG). Los formatos no procesables se marcan explícitamente: nunca se asumen analizados.",
  },
  {
    n: 3,
    titulo: "Consolidación",
    agente: "Agente de consolidación",
    detalle: "Construye una vista única del folio: datos estructurados, relevantes, movimientos, adjuntos y antecedentes.",
  },
  {
    n: 4,
    titulo: "Deduplicación",
    agente: "Agente de dedup + AI Search",
    detalle: "Búsqueda vectorial contra la base histórica por NIT, razón social, ramo, producto, cobertura y vigencia.",
  },
  {
    n: 5,
    titulo: "Enriquecimiento",
    agente: "Agente de investigación",
    detalle: "Clasificación de ramo, identificación de precotizado, investigación externa y alertas de cumplimiento.",
  },
  {
    n: 6,
    titulo: "Categorización",
    agente: "Agente de categorización",
    detalle: "Asignación a una de las cinco categorías, con nivel de confianza y próximo paso recomendado.",
  },
  {
    n: 7,
    titulo: "Reporte",
    agente: "Agente de reporte",
    detalle: "Genera el informe por folio y actualiza el resumen consolidado del suscriptor. Revisión humana y feedback.",
  },
];

const DEMO_STEPS = [
  {
    titulo: "Contexto y problema",
    detalle: "Mostrar la línea base: 2.460 folios al año, 4 suscriptores (~615 por persona) y 53,9% cerrados administrativamente o declinados. El piloto interviene ese segmento tempranamente.",
  },
  {
    titulo: "Vista de equipo y priorización",
    detalle: "Revisar los KPIs del piloto y las barras por categoría: cómo se distribuye la carga y cuántos duplicados o vencidos hay.",
  },
  {
    titulo: "Filtrar por suscriptor",
    detalle: "Elegir un suscriptor para ver su resumen individual: pendientes, con decisión, duplicados y vencidos.",
  },
  {
    titulo: "Detectar duplicados y vencidos",
    detalle: "Señalar un folio con la marca de posible duplicado y una fecha máxima en rojo (vencido sin decisión).",
  },
  {
    titulo: "Abrir el informe de un folio",
    detalle: "Recorrer el informe: resumen, adjuntos (incluido uno no procesable), separación de resultados por fuente, recomendación con categoría y nivel de confianza.",
  },
  {
    titulo: "Decisión humana",
    detalle: "Escribir la decisión final y la retroalimentación, y guardarla. Ninguna recomendación se aplica automáticamente.",
  },
  {
    titulo: "Analizar un folio nuevo (opcional)",
    detalle: "Filtrar por estado “Nuevo (sin analizar)”, abrir un folio y pulsar “Analizar folio” para ver la clasificación en vivo.",
  },
];

const CATEGORIAS = [
  { cat: 1, situacion: "Información mínima insuficiente", resultado: "Solicitud de información", humano: "Revisar y enviar" },
  { cat: 2, situacion: "Inquietudes o contradicciones", resultado: "Solicitud de aclaración", humano: "Revisar preguntas" },
  { cat: 3, situacion: "Riesgo fuera de lineamientos", resultado: "Declinación sustentada", humano: "Aprobar decisión" },
  { cat: 4, situacion: "Riesgo elegible y estandarizable", resultado: "Cotización preliminar", humano: "Revisar y aprobar" },
  { cat: 5, situacion: "Riesgo elegible no estandarizable", resultado: "Informe y sugerencias", humano: "Estructurar y decidir" },
];

const CAPAS = [
  { capa: "Experiencia", comp: "Copilot Studio + Microsoft Teams", funcion: "Canal de interacción del suscriptor: consulta de casos, revisión de informes y feedback." },
  { capa: "Orquestación", comp: "Azure AI Foundry — Agent Service", funcion: "Orquesta los agentes especializados sobre un pipeline por lotes." },
  { capa: "Modelos", comp: "Azure OpenAI (GPT-4o) + embeddings", funcion: "Comprensión de documentos, razonamiento sobre políticas y generación de borradores." },
  { capa: "Ingesta documental", comp: "Azure AI Document Intelligence", funcion: "Extracción estructurada de PDF, Excel, Word, imágenes y correos MSG." },
  { capa: "Búsqueda y RAG", comp: "Azure AI Search (vectorial + híbrida)", funcion: "Base histórica consultable, deduplicación semántica y recuperación de políticas." },
  { capa: "Conocimiento", comp: "SharePoint (gobernado)", funcion: "Políticas, proformas, manuales, matrices y plantillas con versión y vigencia." },
  { capa: "Automatización", comp: "Power Automate", funcion: "Recepción de archivos, organización de carpetas y distribución de reportes." },
  { capa: "Visualización", comp: "Power BI", funcion: "Indicadores del piloto: volumen, categorías, tiempos, duplicados y correcciones." },
  { capa: "Datos y estado", comp: "Azure Storage / Cosmos DB", funcion: "Folios, resultados por folio, historial del cliente y trazabilidad de decisiones." },
  { capa: "Gobierno", comp: "Entra ID, Key Vault, Purview, evals/tracing", funcion: "Identidad, secretos, cumplimiento y evaluación de calidad del agente." },
];

const FOUNDRY_COMPONENTS = [
  { comp: "Azure AI Foundry — Project / Hub", uso: "Espacio de trabajo que agrupa modelos, agentes, conexiones, datos y gobierno del proyecto." },
  { comp: "Agent Service (orquestación multi-agente)", uso: "Ejecuta y coordina los agentes especializados (consolidación, dedup, clasificación, categorización, reporte) sobre el pipeline por lotes." },
  { comp: "Model Catalog + despliegues", uso: "Despliegue de GPT-4o (razonamiento sobre documentos y políticas) y de text-embedding (similitud y RAG para deduplicación)." },
  { comp: "Foundry — Evaluations", uso: "Mide la calidad de las recomendaciones del agente (precisión de categoría, faltantes, duplicados) contra conjuntos de referencia." },
  { comp: "Foundry — Tracing / Observability", uso: "Traza extremo a extremo cada ejecución por folio: qué fuente, qué paso y qué decisión del agente, para auditoría." },
  { comp: "Content Safety / filtros de seguridad", uso: "Controles de contenido sobre entradas y salidas del modelo dentro del flujo de suscripción." },
  { comp: "Connections (gobernadas)", uso: "Conexiones seguras del proyecto a Azure OpenAI, AI Search, Storage y orígenes de datos, con identidad administrada." },
];

const AZURE_COMPONENTS = [
  { comp: "Azure AI Document Intelligence", uso: "Extracción estructurada de PDF, Excel, Word, imágenes y correos MSG con adjuntos embebidos." },
  { comp: "Azure AI Search", uso: "Índice vectorial + híbrido + semántico para deduplicación y recuperación de políticas, proformas y lineamientos." },
  { comp: "Azure Storage (Blob)", uso: "Almacenamiento de folios de entrada, adjuntos y resultados por folio." },
  { comp: "Azure Cosmos DB", uso: "Estado del folio, historial del cliente y trazabilidad de hallazgos y decisiones." },
  { comp: "Microsoft Entra ID", uso: "Identidad, permisos y acceso basado en roles; identidad administrada para los servicios." },
  { comp: "Azure Key Vault", uso: "Gestión de secretos, claves y credenciales de las conexiones." },
  { comp: "Microsoft Purview", uso: "Catálogo, clasificación y cumplimiento sobre los datos sensibles (SARLAFT, PEP)." },
  { comp: "Azure Monitor / Application Insights", uso: "Telemetría, métricas de ejecución y alertas operativas del pipeline." },
  { comp: "Power Automate", uso: "Ingesta de archivos, organización de carpetas, activación del análisis y distribución de reportes." },
  { comp: "Power BI", uso: "Tablero de indicadores del piloto para negocio y suscriptores." },
  { comp: "SharePoint", uso: "Repositorio gobernado de conocimiento: políticas, proformas, plantillas y resultados." },
  { comp: "Copilot Studio + Microsoft Teams", uso: "Capa de experiencia del suscriptor para consultar casos y revisar informes." },
];

export function FlujoTab() {
  return (
    <div className="flujo">
      <div className="card">
        <h2>Diagrama lógico de la aplicación</h2>
        <p className="subtitle">
          Capas y componentes de la solución destino sobre Azure. El flujo desciende de la
          experiencia del suscriptor a la orquestación de agentes, los modelos, la ingesta y
          los datos; el gobierno es transversal.
        </p>
        <DiagramaLogico />
      </div>

      <div className="card">
        <h2>Flujo de procesamiento por folio</h2>
        <p className="subtitle">
          Pipeline por lotes orquestado por el agente de Azure AI Foundry. En este prototipo
          local el flujo se simula con reglas deterministas.
        </p>
        <div className="pipeline">
          {PIPELINE.map((p, i) => (
            <div className="pipeline-step-wrapper" key={p.n}>
              <div className="pipeline-step">
                <div className="pipeline-step-num">{p.n}</div>
                <div className="pipeline-step-body">
                  <strong>{p.titulo}</strong>
                  <span className="pipeline-step-agente">{p.agente}</span>
                  <p>{p.detalle}</p>
                </div>
              </div>
              {i < PIPELINE.length - 1 && <div className="pipeline-arrow">↓</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Paso a paso de la demo</h2>
        <ol className="demo-steps">
          {DEMO_STEPS.map((s, i) => (
            <li key={i}>
              <strong>{s.titulo}</strong>
              <p>{s.detalle}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>Modelo de decisión de cinco categorías</h2>
        <table>
          <thead>
            <tr>
              <th>Cat.</th>
              <th>Situación</th>
              <th>Resultado principal</th>
              <th>Intervención humana</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map((c) => (
              <tr key={c.cat}>
                <td>
                  <span className={`cat-badge cat-${c.cat}`}>Cat. {c.cat}</span>
                </td>
                <td>{c.situacion}</td>
                <td>{c.resultado}</td>
                <td>{c.humano}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Arquitectura lógica de servicios (solución destino)</h2>
        <p className="subtitle">
          Arquitectura de referencia sobre Azure. El prototipo local simula las capas de
          orquestación y modelos; el resto representa la solución productiva.
        </p>
        <table>
          <thead>
            <tr>
              <th>Capa</th>
              <th>Componente Microsoft</th>
              <th>Función</th>
            </tr>
          </thead>
          <tbody>
            {CAPAS.map((c) => (
              <tr key={c.capa}>
                <td><strong>{c.capa}</strong></td>
                <td>{c.comp}</td>
                <td>{c.funcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Componentes de Azure AI Foundry</h2>
        <p className="subtitle">
          Capacidades del propio Foundry que sostienen la orquestación, el razonamiento y
          el gobierno del agente.
        </p>
        <table>
          <thead>
            <tr>
              <th>Componente</th>
              <th>Uso en la solución</th>
            </tr>
          </thead>
          <tbody>
            {FOUNDRY_COMPONENTS.map((c) => (
              <tr key={c.comp}>
                <td><strong>{c.comp}</strong></td>
                <td>{c.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Otros componentes de Azure y Microsoft Cloud</h2>
        <p className="subtitle">
          Servicios de datos, ingesta, seguridad y experiencia que complementan a Foundry.
        </p>
        <table>
          <thead>
            <tr>
              <th>Componente</th>
              <th>Uso en la solución</th>
            </tr>
          </thead>
          <tbody>
            {AZURE_COMPONENTS.map((c) => (
              <tr key={c.comp}>
                <td><strong>{c.comp}</strong></td>
                <td>{c.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
