from __future__ import annotations
from typing import Any, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from supabase import create_client, Client as SupabaseClient


@dataclass
class SupabaseSettings:
    url: str
    key: str


class SupabaseStore:
    def __init__(self, url: Optional[str], key: Optional[str]):
        self.client: Optional[SupabaseClient]
        if url and key:
            self.client = create_client(url, key)
        else:
            self.client = None

    def enabled(self) -> bool:
        return self.client is not None

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def insert_event(self, name: str, payload: dict[str, Any]):
        if not self.client:
            return
        data = {
            "event_name": name,
            "project_id": int(payload.get("project_id", 0)) if payload.get("project_id") is not None else None,
            "project_admin": str(payload.get("project_admin")) if payload.get("project_admin") is not None else None,
            "project_pda": str(payload.get("project_pda")) if payload.get("project_pda") is not None else None,
            "payload": payload,
            "created_at": self._now(),
        }
        try:
            self.client.table("events").insert(data).execute()
        except Exception as e:
            # Swallow errors to avoid impacting on-chain processing
            print("supabase insert_event error:", e)

    async def upsert_project_from_event(self, name: str, payload: dict[str, Any]):
        if not self.client:
            return
        try:
            if name == "ProjectCreated":
                row = {
                    "project_id": int(payload.get("project_id")),
                    "project_admin": str(payload.get("project_admin")),
                    "project_pda": str(payload.get("project_pda")),
                    "old_token_mint": str(payload.get("old_token_mint")),
                    "new_token_mint": str(payload.get("new_token_mint")),
                    "status": "Created",
                    "created_at": self._now(),
                }
                self.client.table("projects").upsert(row, on_conflict=["project_id","project_admin"]).execute()
            elif name == "ProjectStatusChanged":
                upd = {
                    "status": str(payload.get("new_status")),
                    "updated_at": self._now(),
                }
                self.client.table("projects").update(upd).match({
                    "project_id": int(payload.get("project_id")),
                    "project_admin": str(payload.get("project_admin")),
                }).execute()
            elif name == "MigrationPerformed":
                # Record per-user migration and update aggregates (distinct users)
                pj = int(payload.get("project_id"))
                admin = str(payload.get("project_admin", "")) if payload.get("project_admin") else None
                user = str(payload.get("user")) if payload.get("user") else None
                inc_old = int(payload.get("old_tokens_amount", 0))
                inc_new = int(payload.get("new_tokens_amount", 0))
                if user:
                    # Check if this user already present
                    exists = self.client.table("migrations").select("user").match({
                        "project_id": pj,
                        "user": user,
                    }).limit(1).execute()
                    is_new_user = not bool(exists.data)
                    # Upsert migration row with latest amounts/timestamp
                    self.client.table("migrations").upsert({
                        "project_id": pj,
                        "user": user,
                        "old_tokens_amount": inc_old,
                        "new_tokens_amount": inc_new,
                        "updated_at": self._now(),
                    }, on_conflict=["project_id","user"]).execute()
                else:
                    is_new_user = False

                # Fetch current aggregates and update deterministically
                sel = self.client.table("projects").select("total_migrated,total_users").match({
                    "project_id": pj,
                    "project_admin": admin,
                }).limit(1).execute()
                cur_total = 0
                cur_users = 0
                if sel.data:
                    cur_total = int(sel.data[0].get("total_migrated") or 0)
                    cur_users = int(sel.data[0].get("total_users") or 0)
                upd = {
                    "total_migrated": cur_total + inc_old,
                    "total_users": cur_users + (1 if is_new_user else 0),
                    "updated_at": self._now(),
                }
                self.client.table("projects").update(upd).match({
                    "project_id": pj,
                    "project_admin": admin,
                }).execute()
            elif name == "ProjectFunded":
                upd = {
                    "total_funded": int(payload.get("total_funded", 0)),
                    "updated_at": self._now(),
                }
                self.client.table("projects").update(upd).match({
                    "project_id": int(payload.get("project_id")),
                    "project_admin": str(payload.get("project_admin")),
                }).execute()
            elif name == "SettlementCompleted":
                upd = {
                    "lockup_starts_at": int(payload.get("lockup_starts_at", 0)),
                    "lockup_ends_at": int(payload.get("lockup_ends_at", 0)),
                    "updated_at": self._now(),
                }
                self.client.table("projects").update(upd).match({
                    "project_id": int(payload.get("project_id")),
                    "project_admin": str(payload.get("project_admin")),
                }).execute()
        except Exception as e:
            print("supabase upsert_project_from_event error:", e)
