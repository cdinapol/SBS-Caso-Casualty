import { useState } from "react";
import { api, Feedback, Folio } from "./api";
import { CATEGORIA_LABELS, CATEGORIA_RESULTADO, FEEDBACK_LABELS } from "./constants";

interface Props {
  folio: Folio;
  onClose: () => void;
  onUpdated: (folio: Folio) => void;
}

const FEEDBACK_OPTIONS: Feedback[] = [
  "correcta",
  "parcial",
  "incorrecta",
  "informacion_omitida",
  "fuente_no_pertinente",
  "categoria_modificada",
];

export function FolioDetail({ folio, onClose, onUpdated }: Props) {
  const [decisionTexto, setDecisionTexto] = useState(folio.decision_final ?? "");
  const [feedback, setFeedback] = useState<Feedback | "">(folio.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalizar = async () => {
    setBusy(true);
    setError(null);
    try {
      const actualizado = await api.analizarFolio(folio.id);
      onUpdated(actualizado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDecidir = async () => {
    if (!decisionTexto.trim()) {
      setError("Ingresa la decisión final antes de guardar.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const actualizado = await api.decidirFolio(folio.id, {
        decision_final: decisionTexto.trim(),
        feedback: feedback || null,
      });
      onUpdated(actualizado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{folio.folio_number}</h2>
            <p className="subtitle">
              {folio.cliente} · {folio.ramo} · {folio.tipo_negocio}
            </p>
          </div>
          <button className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="modal-body">
          <section className="informe-section">
            <h3>Resumen del folio</h3>
            <div className="grid-2">
              <div>
                <strong>Suscriptor:</strong> {folio.suscriptor_nombre}
              </div>
              <div>
                <strong>Intermediario:</strong> {folio.intermediario}
              </div>
              <div>
                <strong>NIT:</strong> {folio.nit}
              </div>
              <div>
                <strong>Recepción / máxima:</strong> {folio.fecha_recepcion} → {folio.fecha_maxima}
              </div>
            </div>
            <p>{folio.descripcion}</p>
            {folio.duplicado_de && (
              <p className="warning-banner">
                Posible duplicado del folio <strong>{folio.duplicado_de}</strong> (similitud{" "}
                {Math.round((folio.duplicado_score ?? 0) * 100)}%). Requiere verificación antes de continuar.
              </p>
            )}
          </section>

          <section className="informe-section">
            <h3>Adjuntos</h3>
            <ul>
              {folio.adjuntos.map((a) => (
                <li key={a.nombre}>
                  {a.nombre} ({a.tipo}) —{" "}
                  {a.procesado ? "procesado" : <span className="text-danger">no procesable: {a.nota}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="informe-section">
            <h3>Separación de resultados (trazabilidad por fuente)</h3>
            <dl className="fuentes-list">
              <dt>Información del solicitante</dt>
              <dd>{folio.fuentes.info_solicitante}</dd>

              <dt>Información extraída de documentos</dt>
              <dd>
                <ul>
                  {folio.fuentes.info_documentos.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </dd>

              <dt>Información histórica interna</dt>
              <dd>
                <ul>
                  {folio.fuentes.info_historica.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </dd>

              <dt>Fuentes externas</dt>
              <dd>
                <ul>
                  {folio.fuentes.fuentes_externas.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </dd>

              <dt>Resultado de listas restrictivas</dt>
              <dd>{folio.fuentes.resultado_listas}</dd>

              <dt>Reglas de suscripción aplicables</dt>
              <dd>
                <ul>
                  {folio.fuentes.reglas_suscripcion.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </dd>
            </dl>
          </section>

          <section className="informe-section">
            <h3>Recomendación del agente</h3>
            {folio.categoria ? (
              <>
                <p>
                  <span className={`cat-badge cat-${folio.categoria}`}>
                    Categoría {folio.categoria}: {CATEGORIA_LABELS[folio.categoria]}
                  </span>{" "}
                  <span className="confidence">confianza {Math.round((folio.confianza ?? 0) * 100)}%</span>
                </p>
                <p>
                  <strong>Resultado sugerido:</strong> {CATEGORIA_RESULTADO[folio.categoria]}
                </p>
                <p>
                  <strong>Próximo paso recomendado:</strong> {folio.recomendacion}
                </p>
                <ul>
                  {folio.hallazgos.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="empty-state">Este folio aún no ha sido analizado por el agente.</p>
            )}
            {folio.estado === "nuevo" && (
              <button className="primary" disabled={busy} onClick={handleAnalizar}>
                {busy ? "Analizando…" : "Analizar folio"}
              </button>
            )}
          </section>

          <section className="informe-section">
            <h3>Decisión final (humana)</h3>
            <p className="subtitle">
              El agente recomienda; el suscriptor decide. Ninguna recomendación se aplica automáticamente.
            </p>
            {folio.decision_final && (
              <p>
                <strong>Decisión registrada:</strong> {folio.decision_final}
                {folio.feedback && <> — {FEEDBACK_LABELS[folio.feedback]}</>}
              </p>
            )}
            {folio.categoria && (
              <div className="decision-form">
                <label>
                  Decisión final
                  <textarea
                    value={decisionTexto}
                    onChange={(e) => setDecisionTexto(e.target.value)}
                    placeholder="Ej. Aprobado conforme a la recomendación del agente."
                  />
                </label>
                <label>
                  Retroalimentación sobre la recomendación
                  <select value={feedback} onChange={(e) => setFeedback(e.target.value as Feedback)}>
                    <option value="">Seleccionar…</option>
                    {FEEDBACK_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {FEEDBACK_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary" disabled={busy} onClick={handleDecidir}>
                  {busy ? "Guardando…" : "Guardar decisión"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
