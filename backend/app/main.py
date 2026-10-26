from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import store
from .models import (
    DecisionInput,
    EstadoFolio,
    Folio,
    KpisGlobales,
    ResumenSuscriptor,
    Suscriptor,
)

app = FastAPI(title="SBS Underwriting Copilot — Prototipo local", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/suscriptores", response_model=list[Suscriptor])
def list_suscriptores() -> list[Suscriptor]:
    return store.list_suscriptores()


@app.get("/api/suscriptores/{suscriptor_id}/resumen", response_model=ResumenSuscriptor)
def get_resumen_suscriptor(suscriptor_id: int) -> ResumenSuscriptor:
    return store.resumen_suscriptor(suscriptor_id)


@app.get("/api/kpis", response_model=KpisGlobales)
def get_kpis() -> KpisGlobales:
    return store.kpis_globales()


@app.get("/api/folios", response_model=list[Folio])
def list_folios(
    suscriptor_id: Optional[int] = None,
    categoria: Optional[int] = None,
    estado: Optional[EstadoFolio] = None,
    q: Optional[str] = None,
) -> list[Folio]:
    return store.list_folios(suscriptor_id=suscriptor_id, categoria=categoria, estado=estado, q=q)


@app.get("/api/folios/{folio_id}", response_model=Folio)
def get_folio(folio_id: int) -> Folio:
    return store.get_folio(folio_id)


@app.post("/api/folios/{folio_id}/analizar", response_model=Folio)
def analizar_folio(folio_id: int) -> Folio:
    return store.analizar_folio(folio_id)


@app.post("/api/folios/{folio_id}/decision", response_model=Folio)
def decidir_folio(folio_id: int, payload: DecisionInput) -> Folio:
    return store.decidir_folio(folio_id, payload)
