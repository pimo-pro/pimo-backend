import cors from "cors";
import express from "express";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMaterialsApiPayload } from "./materialsApi";

type PimoProjectData = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  ownerName?: string;
  thumbnailDataUrl?: string | null;
  centerDisplay?: { thumbnailDataUrl?: string | null } | unknown;
  [k: string]: unknown;
};

type SavedProjectMeta = {
  id: string;
  name: string;
  sequence: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  thumbnailDataUrl: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9._-]{1,160}$/.test(trimmed)) return null;
  return trimmed;
}

function generateId(): string {
  // suficientemente único para ficheiro
  return `pimo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function thumbnailFromProject(project: PimoProjectData): string | null {
  const t1 = project.thumbnailDataUrl;
  if (typeof t1 === "string") return t1;
  if (t1 === null) return null;
  const cd = project.centerDisplay as { thumbnailDataUrl?: unknown } | undefined;
  const t2 = cd?.thumbnailDataUrl;
  return typeof t2 === "string" ? t2 : t2 === null ? null : null;
}

function asOwnerName(project: PimoProjectData): string {
  if (typeof project.ownerName === "string" && project.ownerName.trim()) return project.ownerName;
  return project.ownerId || "Utilizador";
}

function resolveProjectsDataDir(): string {
  const fromEnv = process.env.PIMO_PROJECTS_DATA_DIR?.trim();
  if (fromEnv) return fromEnv;
  return path.resolve(process.cwd(), "data", "projects");
}

function projectFilePath(dataDir: string, id: string): string {
  return path.join(dataDir, `project-${id}.json`);
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

const app = express();
app.disable("x-powered-by");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "pimo-backend", time: nowIso() });
});

app.get("/api/materials", (_req, res) => {
  res.json(buildMaterialsApiPayload());
});

// Compatível com o frontend atual: /api/projects/index.php?...
app.all("/api/projects/index.php", async (req, res) => {
  const dataDir = resolveProjectsDataDir();
  await ensureDir(dataDir);

  const method = req.method.toUpperCase();
  const action = typeof req.query.action === "string" ? req.query.action : "";

  // GET load
  if (method === "GET" && action === "load") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inválido" });
    try {
      const raw = await readFile(projectFilePath(dataDir, id), "utf8");
      const project = JSON.parse(raw) as PimoProjectData;
      return res.json({ status: "ok", project });
    } catch {
      return res.status(404).json({ status: "error", message: "Não encontrado" });
    }
  }

  // PUT rename
  if (method === "PUT" && action === "update") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inválido" });
    const name = typeof (req.body as any)?.name === "string" ? (req.body as any).name.trim() : "";
    if (!name) return res.status(400).json({ status: "error", message: "name obrigatório" });
    try {
      const file = projectFilePath(dataDir, id);
      const raw = await readFile(file, "utf8");
      const project = JSON.parse(raw) as PimoProjectData;
      project.name = name;
      if (typeof project.centerDisplay === "object" && project.centerDisplay && !Array.isArray(project.centerDisplay)) {
        (project.centerDisplay as any).projectName = name;
      }
      project.updatedAt = nowIso();
      await writeFile(file, JSON.stringify(project), "utf8");
      return res.json({ status: "ok", project });
    } catch {
      return res.status(404).json({ status: "error", message: "Não encontrado" });
    }
  }

  // DELETE
  if (method === "DELETE" && action === "delete") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inválido" });
    try {
      await unlink(projectFilePath(dataDir, id));
    } catch {
      // idempotente
    }
    return res.json({ status: "ok" });
  }

  // POST save (create/update)
  if (method === "POST") {
    const body = req.body as Partial<PimoProjectData> | null;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ status: "error", message: "JSON inválido" });
    }

    const now = nowIso();
    const incomingId = sanitizeId(body.id);

    if (incomingId) {
      const file = projectFilePath(dataDir, incomingId);
      try {
        const old = JSON.parse(await readFile(file, "utf8")) as PimoProjectData;
        const createdAt = typeof old.createdAt === "string" && old.createdAt ? old.createdAt : now;
        const next: PimoProjectData = { ...(body as any), id: incomingId, createdAt, updatedAt: now };
        await writeFile(file, JSON.stringify(next), "utf8");
        return res.json({ status: "ok", project: next });
      } catch {
        return res.status(404).json({ status: "error", message: "Projeto não encontrado para atualizar" });
      }
    }

    const id = generateId();
    const createdAt = typeof body.createdAt === "string" && body.createdAt ? body.createdAt : now;
    const next: PimoProjectData = { ...(body as any), id, createdAt, updatedAt: now };
    await writeFile(projectFilePath(dataDir, id), JSON.stringify(next), "utf8");
    return res.json({ status: "ok", project: next });
  }

  // GET list
  if (method === "GET" && !action) {
    const scope = typeof req.query.scope === "string" ? req.query.scope : "mine";
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : "";
    const now = nowIso();

    const files = (await readdir(dataDir)).filter((f) => f.startsWith("project-") && f.endsWith(".json"));
    const metas: SavedProjectMeta[] = [];

    for (const fileName of files) {
      try {
        const raw = await readFile(path.join(dataDir, fileName), "utf8");
        const project = JSON.parse(raw) as PimoProjectData;
        if (!project?.id || !project.ownerId) continue;
        if (scope === "mine" && ownerId && project.ownerId !== ownerId) continue;
        metas.push({
          id: String(project.id),
          name: typeof project.name === "string" && project.name.trim() ? project.name : "Projeto",
          sequence: 0,
          createdAt: typeof project.createdAt === "string" ? project.createdAt : now,
          updatedAt: typeof project.updatedAt === "string" ? project.updatedAt : (typeof project.createdAt === "string" ? project.createdAt : now),
          ownerId: String(project.ownerId),
          ownerName: asOwnerName(project),
          thumbnailDataUrl: thumbnailFromProject(project),
        });
      } catch {
        // ignora
      }
    }

    metas.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    metas.forEach((m, idx) => (m.sequence = idx + 1));

    return res.json({ status: "ok", scope, ownerId: ownerId || null, projects: metas });
  }

  return res.status(405).json({ status: "error", message: "Método não suportado" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[pimo-backend] listening on :${port}`);
});
