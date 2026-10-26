const BAND = "#f4f6f9";
const NAVY = "#1b2a4a";
const BLUE = "#2e75b6";
const TEAL = "#1f9d77";
const PURPLE = "#6a4fb6";
const GRAY = "#64748b";

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  fill,
  textFill = "#fff",
  rx = 8,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  fill: string;
  textFill?: string;
  rx?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 4 : y + h / 2 + 4} textAnchor="middle" fontSize="12.5" fontWeight={600} fill={textFill}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize="10.5" fill={textFill} opacity={0.85}>
          {sub}
        </text>
      )}
    </g>
  );
}

function BandLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fontSize="11" fontWeight={700} fill={GRAY} letterSpacing="0.5">
      {text.toUpperCase()}
    </text>
  );
}

export function DiagramaLogico() {
  return (
    <div className="diagrama">
      <svg viewBox="0 0 960 560" width="100%" role="img" aria-label="Diagrama lógico de la aplicación">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,3 L0,6 Z" fill="#9aa4b2" />
          </marker>
        </defs>

        {/* Experiencia */}
        <rect x="20" y="20" width="680" height="72" rx="10" fill={BAND} />
        <BandLabel x={32} y={38} text="Experiencia del suscriptor" />
        <Box x={40} y={46} w={310} h={36} title="Microsoft Teams" sub="Canal de conversación" fill={BLUE} />
        <Box x={370} y={46} w={310} h={36} title="Copilot Studio" sub="Experiencia low-code" fill={BLUE} />

        {/* Orquestación */}
        <rect x="20" y="124" width="680" height="128" rx="10" fill={BAND} />
        <BandLabel x={32} y={142} text="Orquestación — Azure AI Foundry · Agent Service" />
        <Box x={28} y={152} w={158} h={40} title="Consolidación" fill={PURPLE} />
        <Box x={194} y={152} w={158} h={40} title="Clasificación ramo" fill={PURPLE} />
        <Box x={360} y={152} w={158} h={40} title="Precotizado" fill={PURPLE} />
        <Box x={526} y={152} w={158} h={40} title="Deduplicación" fill={PURPLE} />
        <Box x={28} y={200} w={158} h={40} title="Investigación ext." fill={PURPLE} />
        <Box x={194} y={200} w={158} h={40} title="Categorización 5 cat." fill={PURPLE} />
        <Box x={360} y={200} w={158} h={40} title="Reporte" fill={PURPLE} />

        {/* Modelos e ingesta */}
        <rect x="20" y="284" width="680" height="92" rx="10" fill={BAND} />
        <BandLabel x={32} y={302} text="Modelos e ingesta" />
        <Box x={30} y={312} w={205} h={52} title="Azure OpenAI" sub="GPT-4o + embeddings" fill={NAVY} />
        <Box x={255} y={312} w={205} h={52} title="Document Intelligence" sub="PDF · Excel · Word · MSG" fill={NAVY} />
        <Box x={480} y={312} w={205} h={52} title="Azure AI Search" sub="Vectorial + híbrida" fill={NAVY} />

        {/* Datos y automatización */}
        <rect x="20" y="408" width="680" height="92" rx="10" fill={BAND} />
        <BandLabel x={32} y={426} text="Datos, conocimiento y automatización" />
        <Box x={30} y={436} w={155} h={52} title="Storage /" sub="Cosmos DB" fill={TEAL} />
        <Box x={197} y={436} w={155} h={52} title="SharePoint" sub="Conocimiento" fill={TEAL} />
        <Box x={364} y={436} w={155} h={52} title="Power Automate" sub="Ingesta / distrib." fill={TEAL} />
        <Box x={531} y={436} w={155} h={52} title="Power BI" sub="Indicadores" fill={TEAL} />

        {/* Gobierno (columna derecha) */}
        <rect x="720" y="20" width="220" height="480" rx="10" fill="#efeafa" />
        <BandLabel x={732} y={38} text="Gobierno y seguridad" />
        <Box x={732} y={60} w={196} h={44} title="Microsoft Entra ID" sub="Identidad y permisos" fill="#8a5cf6" />
        <Box x={732} y={116} w={196} h={44} title="Azure Key Vault" sub="Secretos y claves" fill="#8a5cf6" />
        <Box x={732} y={172} w={196} h={44} title="Microsoft Purview" sub="Cumplimiento de datos" fill="#8a5cf6" />
        <Box x={732} y={228} w={196} h={44} title="Foundry Evals" sub="Calidad del agente" fill="#8a5cf6" />
        <Box x={732} y={284} w={196} h={44} title="Foundry Tracing" sub="Trazabilidad extremo a extremo" fill="#8a5cf6" />

        {/* Flechas de flujo */}
        <line x1="360" y1="92" x2="360" y2="122" stroke="#9aa4b2" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="360" y1="252" x2="360" y2="282" stroke="#9aa4b2" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="360" y1="376" x2="360" y2="406" stroke="#9aa4b2" strokeWidth="2" markerEnd="url(#arrow)" />
        {/* Gobierno transversal */}
        <line x1="700" y1="260" x2="720" y2="260" stroke="#b9a7e8" strokeWidth="2" strokeDasharray="4 3" />
      </svg>

      <div className="diagrama-leyenda">
        <span><i style={{ background: BLUE }} /> Experiencia</span>
        <span><i style={{ background: PURPLE }} /> Agentes (Foundry)</span>
        <span><i style={{ background: NAVY }} /> Modelos e ingesta</span>
        <span><i style={{ background: TEAL }} /> Datos y automatización</span>
        <span><i style={{ background: "#8a5cf6" }} /> Gobierno</span>
      </div>
    </div>
  );
}
