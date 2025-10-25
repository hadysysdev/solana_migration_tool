from __future__ import annotations
import asyncio
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from solana.publickey import PublicKey
from .config import load_settings
from .clients import Clients
from .settlement import run_settlement_job


settings = load_settings()
app = FastAPI(title="W3Swap Backend", version="0.1.0")
clients = Clients(settings)
_listener_id: int | None = None

# CORS for frontend consumption
origins = settings.cors_origins or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await clients.start()
    # Subscribe to events; persist to Supabase; trigger settlement on Ended
    program = clients.w3.program

    async def persist(event_name: str, payload: dict):
        if clients.sb and clients.sb.enabled():
            await clients.sb.insert_event(event_name, payload)
            await clients.sb.upsert_project_from_event(event_name, payload)

    def _make_handler(event_name: str):
        def _handler(event):
            try:
                asyncio.create_task(persist(event_name, event))
                if event_name == "ProjectStatusChanged":
                    new_status = event.get("new_status")
                    if str(new_status) == "Ended":
                        project_id = int(event.get("project_id"))
                        project_admin = PublicKey(event.get("project_admin"))
                        asyncio.create_task(run_settlement_job(clients, project_id, project_admin, use_meteora=True))
            except Exception as e:
                print(f"event handler error [{event_name}] ::", e)
        return _handler

    event_names = [
        "PlatformInitialized",
        "ProjectAdminManaged",
        "PlatformConfigUpdated",
        "FeeDestinationWalletUpdated",
        "ProjectCreated",
        "ProjectFunded",
        "ProjectStatusChanged",
        "MigrationPerformed",
        "SettlementCompleted",
        "SwapExecuted",
        "ProjectFinalized",
        "LpCreated",
        "LpDeposited",
        "LpWithdrawn",
        "VaultBalanceLow",
    ]

    global _listener_id
    for name in event_names:
        _listener_id = await program.add_event_listener(name, _make_handler(name))


@app.on_event("shutdown")
async def _shutdown():
    try:
        if _listener_id is not None:
            await clients.w3.program.remove_event_listener(_listener_id)
    except Exception:
        pass


@app.get("/")
async def health():
    return {"ok": True}


@app.post("/settlement/{project_id}")
async def trigger_settlement(project_id: int, project_admin: str, use_meteora: bool = True, tasks: BackgroundTasks | None = None):
    pa = PublicKey(project_admin)
    if tasks is not None:
        tasks.add_task(run_settlement_job, clients, project_id, pa, use_meteora)
        return {"queued": True}
    await run_settlement_job(clients, project_id, pa, use_meteora)
    return {"ok": True}


# --------- Supabase-backed read APIs ---------

@app.get("/projects")
async def list_projects(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), status: Optional[str] = None, project_admin: Optional[str] = None):
    if not clients.sb or not clients.sb.enabled():
        return []
    try:
        q = clients.sb.client.table("projects").select("*").order("created_at", desc=True)
        if status:
            q = q.eq("status", status)
        if project_admin:
            q = q.eq("project_admin", project_admin)
        # Supabase range is inclusive
        q = q.range(offset, offset + limit - 1)
        resp = q.execute()
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{project_id}")
async def get_project(project_id: int, project_admin: Optional[str] = None):
    if not clients.sb or not clients.sb.enabled():
        raise HTTPException(status_code=404, detail="not found")
    try:
        q = clients.sb.client.table("projects").select("*").eq("project_id", project_id)
        if project_admin:
            q = q.eq("project_admin", project_admin)
        resp = q.limit(1).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="not found")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects/{project_id}/events")
async def list_project_events(project_id: int, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), event_name: Optional[str] = None):
    if not clients.sb or not clients.sb.enabled():
        return []
    try:
        q = clients.sb.client.table("events").select("*").eq("project_id", project_id).order("created_at", desc=True)
        if event_name:
            q = q.eq("event_name", event_name)
        q = q.range(offset, offset + limit - 1)
        resp = q.execute()
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events")
async def list_events(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), event_name: Optional[str] = None):
    if not clients.sb or not clients.sb.enabled():
        return []
    try:
        q = clients.sb.client.table("events").select("*").order("created_at", desc=True)
        if event_name:
            q = q.eq("event_name", event_name)
        q = q.range(offset, offset + limit - 1)
        resp = q.execute()
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------- Analytics endpoints ---------

@app.get("/analytics/projects/{project_id}")
async def analytics_project(project_id: int, days: int = Query(30, ge=1, le=365)):
    if not clients.sb or not clients.sb.enabled():
        raise HTTPException(status_code=404, detail="not found")
    try:
        # Totals from projects row
        proj = clients.sb.client.table("projects").select("total_migrated,total_users,status,created_at,lockup_ends_at").eq("project_id", project_id).limit(1).execute()
        totals = proj.data[0] if proj.data else {}
        # Event counts in last N days
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        ev = clients.sb.client.table("events").select("event_name").eq("project_id", project_id).gte("created_at", since).execute()
        counts: dict[str,int] = {}
        for row in (ev.data or []):
            name = row.get("event_name")
            counts[name] = counts.get(name, 0) + 1
        return {
            "project_id": project_id,
            "total_migrated": totals.get("total_migrated", 0),
            "total_users": totals.get("total_users", 0),
            "status": totals.get("status"),
            "created_at": totals.get("created_at"),
            "lockup_ends_at": totals.get("lockup_ends_at"),
            "event_counts": counts,
            "window_days": days,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
