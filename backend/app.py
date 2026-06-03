from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from routers import auth, opportunities, tickets, trips, users


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    # Warm up the Supabase clients on startup
    from db.supabase import get_admin_client, get_anon_client

    await get_anon_client()
    await get_admin_client()
    yield


app = FastAPI(
    title="TravelAI API",
    version="0.1.0",
    description=(
        "**TravelAI** backend — student travel planning platform.\n\n"
        "## Authentication\n"
        "Protected endpoints require a Supabase JWT.\n"
        "1. Call `POST /auth/login` (or `POST /auth/verify-otp` after signup).\n"
        "2. Copy the returned `access_token`.\n"
        "3. Click **Authorize** and enter `Bearer <access_token>`."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trips.router)
app.include_router(tickets.router)
app.include_router(opportunities.router)


@app.get("/health", tags=["Health"])
def get_health() -> dict[str, str]:
    return {"status": "ok"}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter the Supabase `access_token` returned by /auth/login",
    }
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                tags = operation.get("tags", [])
                if "Users" in tags:
                    operation["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi
