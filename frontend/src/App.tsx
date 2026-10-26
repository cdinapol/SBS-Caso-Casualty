import { useEffect, useMemo, useState } from "react";
import {
  api,
  EstadoFolio,
  Folio,
  KpisGlobales,
  ResumenSuscriptor,
  Suscriptor,
} from "./api";
import { CATEGORIA_LABELS, ESTADO_LABELS } from "./constants";
import { FolioDetail } from "./FolioDetail";
import { FlujoTab } from "./FlujoTab";

const ESTADO_OPTIONS: { value: EstadoFolio | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "nuevo", label: ESTADO_LABELS.nuevo },
  { value: "analizado", label: ESTADO_LABELS.analizado },
  { value: "decision_tomada", label: ESTADO_LABELS.decision_tomada },
];

export default function App() {
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [suscriptorId, setSuscriptorId] = useState<number | "">("");
  const [resumen, setResumen] = useState<ResumenSuscriptor | null>(null);
  const [kpis, setKpis] = useState<KpisGlobales | null>(null);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "">("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFolio | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState<Folio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"folios" | "flujo">("folios");

  useEffect(() => {
    api.listSuscriptores().then(setSuscriptores).catch((e) => setError(e.message));
    api.getKpis().then(setKpis).catch((e) => setError(e.message));
  }, []);

  const loadFolios = () => {
    setLoading(true);
    api
      .listFolios({
        suscriptor_id: suscriptorId === "" ? undefined : suscriptorId,
        categoria: categoriaFiltro === "" ? undefined : categoriaFiltro,
        estado: estadoFiltro || undefined,
        q: busqueda || undefined,
      })
      .then(setFolios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadFolios, [suscriptorId, categoriaFiltro, estadoFiltro, busqueda]);

  useEffect(() => {
    if (suscriptorId === "") {
      setResumen(null);
      return;
    }
    api.getResumenSuscriptor(suscriptorId).then(setResumen).catch((e) => setError(e.message));
  }, [suscriptorId]);

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleFolioUpdated = (folio: Folio) => {
    setFolios((prev) => prev.map((f) => (f.id === folio.id ? folio : f)));
    setSelected(folio);
    if (suscriptorId !== "") {
      api.getResumenSuscriptor(suscriptorId).then(setResumen).catch(() => undefined);
    }
  };

  return (
    <div className="app">
      <h1>SBS Underwriting — Asistente de Suscripción</h1>
      <p className="subtitle">
        {import.meta.env.MODE === "pages" ? "Demo pública" : "Prototipo local"} — Casualty y
        Responsabilidad Ambiental. El agente analiza y recomienda; el suscriptor decide.
      </p>
      {import.meta.env.MODE === "pages" && (
        <p className="subtitle">
          Folios sintéticos. Los análisis y decisiones se guardan solo en este navegador.
        </p>
      )}

      <div className="tabs">
        <button
          className={tab === "folios" ? "tab active" : "tab"}
          onClick={() => setTab("folios")}
        >
          Folios y priorización
        </button>
        <button
          className={tab === "flujo" ? "tab active" : "tab"}
          onClick={() => setTab("flujo")}
        >
          Flujo y arquitectura
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {tab === "flujo" && <FlujoTab />}

      {tab === "folios" && kpis && (
        <div className="card">
          <strong>Línea base (histórico citado en el plan)</strong>
          <div className="kpi-row">
            <div className="kpi">
              <span className="kpi-value">{kpis.baseline_total_folios.toLocaleString("es-CO")}</span>
              <span className="kpi-label">Folios recibidos en el año</span>
            </div>
            <div className="kpi">
              <span className="kpi-value">{kpis.baseline_suscriptores}</span>
              <span className="kpi-label">Suscriptores</span>
            </div>
            <div className="kpi">
              <span className="kpi-value">{kpis.baseline_cerrados_declinados_pct}%</span>
              <span className="kpi-label">Cerrados admin. o declinados</span>
            </div>
          </div>

          <strong>Piloto — folios analizados por el agente (datos simulados)</strong>
          <div className="kpi-row">
            <div className="kpi">
              <span className="kpi-value">{kpis.piloto_total_folios}</span>
              <span className="kpi-label">Folios en el piloto</span>
            </div>
            <div className="kpi">
              <span className="kpi-value">{kpis.piloto_analizados_pct}%</span>
              <span className="kpi-label">Analizados por el agente</span>
            </div>
            <div className="kpi">
              <span className="kpi-value">{kpis.piloto_duplicados_detectados}</span>
              <span className="kpi-label">Duplicados detectados</span>
            </div>
            <div className="kpi">
              <span className="kpi-value">{kpis.piloto_vencidos}</span>
              <span className="kpi-label">Vencidos sin decisión</span>
            </div>
          </div>
          <div className="categoria-bars">
            {Object.entries(kpis.piloto_por_categoria).map(([cat, count]) => (
              <div key={cat} className="categoria-bar-row">
                <span className="categoria-bar-label">
                  Cat. {cat} — {CATEGORIA_LABELS[Number(cat)]}
                </span>
                <div className="categoria-bar-track">
                  <div
                    className={`categoria-bar-fill cat-${cat}`}
                    style={{ width: `${(count / kpis.piloto_total_folios) * 100}%` }}
                  />
                </div>
                <span className="categoria-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "folios" && (
        <div className="card">
        <div className="filters">
          <label>
            Suscriptor
            <select
              value={suscriptorId}
              onChange={(e) => setSuscriptorId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">Todos (vista de equipo)</option>
              {suscriptores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Categoría
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">Todas</option>
              {[1, 2, 3, 4, 5].map((c) => (
                <option key={c} value={c}>
                  Cat. {c} — {CATEGORIA_LABELS[c]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value as EstadoFolio | "")}>
              {ESTADO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="full">
            Buscar (cliente, folio o NIT)
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Minerales del Oriente" />
          </label>
        </div>

        {resumen && (
          <div className="resumen-suscriptor">
            <strong>Resumen de {resumen.suscriptor_nombre}:</strong> {resumen.total_folios} folios ·{" "}
            {resumen.pendientes} pendientes de analizar · {resumen.con_decision} con decisión registrada ·{" "}
            {resumen.duplicados_detectados} posibles duplicados · {resumen.vencidos} vencidos
          </div>
        )}
        </div>
      )}

      {tab === "folios" && (
        <div className="card">
        {loading ? (
          <p className="empty-state">Cargando...</p>
        ) : folios.length === 0 ? (
          <p className="empty-state">No hay folios que coincidan con el filtro.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Ramo</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha máxima</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {folios.map((f) => (
                <tr key={f.id}>
                  <td>{f.folio_number}</td>
                  <td>
                    {f.cliente}
                    {f.duplicado_de && <span className="dup-badge"> ⚠ posible duplicado</span>}
                  </td>
                  <td>{f.ramo}</td>
                  <td>{f.tipo_negocio}</td>
                  <td>
                    {f.categoria ? (
                      <span className={`cat-badge cat-${f.categoria}`}>Cat. {f.categoria}</span>
                    ) : (
                      <span className="cat-badge cat-pendiente">Sin analizar</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${f.estado}`}>{ESTADO_LABELS[f.estado]}</span>
                  </td>
                  <td className={f.fecha_maxima < hoy && f.estado !== "decision_tomada" ? "text-danger" : undefined}>
                    {f.fecha_maxima}
                  </td>
                  <td className="row-actions">
                    <button className="secondary" onClick={() => setSelected(f)}>
                      Ver informe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      )}

      {selected && (
        <FolioDetail folio={selected} onClose={() => setSelected(null)} onUpdated={handleFolioUpdated} />
      )}
    </div>
  );
}
