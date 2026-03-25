// src/index.ts
import cors from "cors";
import express from "express";
import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// ../src/core/panel/panelConstants.ts
var PANEL_DEFAULT_LF_MM = 2800;
var PANEL_DEFAULT_HF_MM = 2070;
var PANEL_DEFAULT_SF_MM = 19;
var PANEL_DEFAULTS = {
  largura_mm: PANEL_DEFAULT_LF_MM,
  altura_mm: PANEL_DEFAULT_HF_MM,
  espessura_mm: PANEL_DEFAULT_SF_MM
};

// ../src/core/materials/materials.api.ts
var SHEET_W = PANEL_DEFAULTS.largura_mm;
var SHEET_H = PANEL_DEFAULTS.altura_mm;
var OFFICIAL_WOOD_MATERIALS_SEED = [
  {
    canonicalId: "mdf_branco",
    label: "MDF Branco",
    type: "wood",
    industrial: true,
    visual: true,
    action: "manter",
    viewerMaterialId: "mdf_branco",
    industrialDefaults: {
      espessuraPadrao: PANEL_DEFAULTS.espessura_mm,
      custo_m2: 35,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 750
    },
    aliases: [
      { name: "MDF Branco", origin: ["industrial", "legacy", "ui"], action: "manter" },
      { name: "MDF", origin: ["pricing", "defaults"], action: "mesclar" },
      { name: "Branco", origin: ["catalogo:mdfLibrary"], action: "mesclar" },
      { name: "Branco Liso", origin: ["presets"], action: "mesclar" },
      { name: "MDF Branco (legacy)", origin: ["legacy-cutlist"], action: "mesclar" }
    ],
    observacoes: "Entrada principal MDF."
  },
  {
    canonicalId: "mdf_cinza",
    label: "MDF Cinza",
    type: "wood",
    industrial: false,
    visual: true,
    action: "manter",
    viewerMaterialId: "mdf_cinza",
    aliases: [
      { name: "MDF Cinza", origin: ["visual", "ui"], action: "manter" },
      { name: "Cinza Industrial", origin: ["presets"], action: "mesclar" }
    ]
  },
  {
    canonicalId: "mdf_preto",
    label: "MDF Preto",
    type: "wood",
    industrial: false,
    visual: true,
    action: "manter",
    viewerMaterialId: "mdf_preto",
    aliases: [
      { name: "MDF Preto", origin: ["visual", "ui", "catalogo:mdfLibrary"], action: "manter" },
      { name: "Preto Fosco", origin: ["presets"], action: "mesclar" }
    ]
  },
  {
    canonicalId: "carvalho",
    label: "Carvalho",
    type: "wood",
    industrial: true,
    visual: true,
    action: "manter",
    viewerMaterialId: "carvalho_natural",
    industrialDefaults: {
      espessuraPadrao: 20,
      custo_m2: 45,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 720
    },
    aliases: [
      { name: "Carvalho", origin: ["industrial", "pricing", "ui"], action: "manter" },
      { name: "Carvalho Natural", origin: ["visual", "ui"], action: "mesclar" },
      { name: "Carvalho Escuro", origin: ["visual", "ui"], action: "mesclar" },
      { name: "Madeira - Carvalho", origin: ["presets"], action: "mesclar" },
      { name: "carvalho_natural", origin: ["viewer"], action: "mesclar" },
      { name: "carvalho_escuro", origin: ["viewer"], action: "mesclar" }
    ],
    observacoes: "Visual possui variantes natural/escuro; industrial permanece unico."
  },
  {
    canonicalId: "nogueira",
    label: "Nogueira",
    type: "wood",
    industrial: false,
    visual: true,
    action: "manter",
    viewerMaterialId: "nogueira",
    aliases: [
      { name: "Nogueira", origin: ["visual", "ui"], action: "manter" },
      { name: "Madeira - Nogueira", origin: ["materialPresets"], action: "mesclar" },
      { name: "nogueira", origin: ["viewer"], action: "mesclar" }
    ]
  },
  {
    canonicalId: "pinho",
    label: "Pinho",
    type: "wood",
    industrial: true,
    visual: true,
    action: "manter",
    viewerMaterialId: "carvalho_natural",
    industrialDefaults: {
      espessuraPadrao: 18,
      custo_m2: 35,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 650
    },
    aliases: [
      { name: "Pinho", origin: ["pricing", "ui"], action: "manter" },
      { name: "Madeira - Pinho", origin: ["presets"], action: "mesclar" }
    ]
  },
  {
    canonicalId: "faia",
    label: "Faia",
    type: "wood",
    industrial: false,
    visual: false,
    action: "manter",
    aliases: [{ name: "Faia", origin: ["ui modelos"], action: "manter" }]
  },
  {
    canonicalId: "contraplacado",
    label: "Contraplacado",
    type: "wood",
    industrial: true,
    visual: false,
    action: "manter",
    industrialDefaults: {
      espessuraPadrao: 19,
      custo_m2: 68,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 600
    },
    aliases: [
      { name: "Contraplacado", origin: ["industrial", "ui"], action: "manter" },
      { name: "Plywood", origin: ["pricing"], action: "renomear" }
    ]
  },
  {
    canonicalId: "melamina",
    label: "Melamina",
    type: "wood",
    industrial: true,
    visual: false,
    action: "manter",
    industrialDefaults: {
      espessuraPadrao: 19,
      custo_m2: 22,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 700
    },
    aliases: [{ name: "Melamina", origin: ["industrial"], action: "manter" }]
  },
  {
    canonicalId: "lacado",
    label: "Lacado",
    type: "wood",
    industrial: true,
    visual: false,
    action: "manter",
    industrialDefaults: {
      espessuraPadrao: 20,
      custo_m2: 90,
      larguraChapa: SHEET_W,
      alturaChapa: SHEET_H,
      densidade: 750
    },
    aliases: [{ name: "Lacado", origin: ["industrial", "ui"], action: "manter" }]
  },
  {
    canonicalId: "mdf_clarus",
    label: "MDF Clarus",
    type: "wood",
    industrial: false,
    visual: true,
    action: "manter",
    viewerMaterialId: "mdf_branco",
    aliases: [{ name: "MDF Clarus", origin: ["catalogo:mdfLibrary"], action: "manter" }]
  },
  {
    canonicalId: "mdf_noce",
    label: "MDF Noce",
    type: "wood",
    industrial: false,
    visual: true,
    action: "manter",
    viewerMaterialId: "nogueira",
    aliases: [{ name: "MDF Noce", origin: ["catalogo:mdfLibrary"], action: "manter" }]
  },
  {
    canonicalId: "madeira_generica_clara",
    label: "Madeira Clara",
    type: "wood",
    industrial: false,
    visual: true,
    action: "remover",
    aliases: [{ name: "Madeira Clara", origin: ["presets"], action: "remover" }]
  },
  {
    canonicalId: "madeira_generica_escura",
    label: "Madeira Escura",
    type: "wood",
    industrial: false,
    visual: true,
    action: "remover",
    aliases: [{ name: "Madeira Escura", origin: ["presets"], action: "remover" }]
  }
];
var normalize = (value) => value.trim().toLowerCase();
var OFFICIAL_INDEX = /* @__PURE__ */ new Map();
for (const material of OFFICIAL_WOOD_MATERIALS_SEED) {
  OFFICIAL_INDEX.set(normalize(material.canonicalId), material);
  OFFICIAL_INDEX.set(normalize(material.label), material);
  for (const alias of material.aliases) {
    OFFICIAL_INDEX.set(normalize(alias.name), material);
  }
}
var OFFICIAL_WOOD_MATERIALS = OFFICIAL_WOOD_MATERIALS_SEED.filter(
  (m) => m.action !== "remover"
);
function listOfficialMaterials() {
  return [...OFFICIAL_WOOD_MATERIALS];
}

// ../src/server/materialsApi.ts
function buildMaterialsApiPayload() {
  const materials = listOfficialMaterials().map((m) => ({
    id: m.canonicalId,
    label: m.label,
    espessura: Number(m.industrialDefaults?.espessuraPadrao) || 18,
    precoPorM2: Number(m.industrialDefaults?.custo_m2) || 0,
    sheetWidthMm: m.industrialDefaults?.larguraChapa,
    sheetHeightMm: m.industrialDefaults?.alturaChapa,
    type: "wood",
    industrial: m.industrial,
    visual: m.visual,
    aliases: m.aliases.map((a) => a.name),
    action: m.action,
    source: "industrial-default"
  }));
  return {
    ok: true,
    count: materials.length,
    materials,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/index.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function sanitizeId(id) {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9._-]{1,160}$/.test(trimmed)) return null;
  return trimmed;
}
function generateId() {
  return `pimo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function thumbnailFromProject(project) {
  const t1 = project.thumbnailDataUrl;
  if (typeof t1 === "string") return t1;
  if (t1 === null) return null;
  const cd = project.centerDisplay;
  const t2 = cd?.thumbnailDataUrl;
  return typeof t2 === "string" ? t2 : t2 === null ? null : null;
}
function asOwnerName(project) {
  if (typeof project.ownerName === "string" && project.ownerName.trim()) return project.ownerName;
  return project.ownerId || "Utilizador";
}
function resolveProjectsDataDir() {
  const fromEnv = process.env.PIMO_PROJECTS_DATA_DIR?.trim();
  if (fromEnv) return fromEnv;
  return path.resolve(process.cwd(), "data", "projects");
}
function projectFilePath(dataDir, id) {
  return path.join(dataDir, `project-${id}.json`);
}
async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}
var app = express();
app.disable("x-powered-by");
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "20mb" }));
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "pimo-backend", time: nowIso() });
});
app.get("/api/materials", (_req, res) => {
  res.json(buildMaterialsApiPayload());
});
app.all("/api/projects/index.php", async (req, res) => {
  const dataDir = resolveProjectsDataDir();
  await ensureDir(dataDir);
  const method = req.method.toUpperCase();
  const action = typeof req.query.action === "string" ? req.query.action : "";
  if (method === "GET" && action === "load") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inv\xE1lido" });
    try {
      const raw = await readFile(projectFilePath(dataDir, id), "utf8");
      const project = JSON.parse(raw);
      return res.json({ status: "ok", project });
    } catch {
      return res.status(404).json({ status: "error", message: "N\xE3o encontrado" });
    }
  }
  if (method === "PUT" && action === "update") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inv\xE1lido" });
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ status: "error", message: "name obrigat\xF3rio" });
    try {
      const file = projectFilePath(dataDir, id);
      const raw = await readFile(file, "utf8");
      const project = JSON.parse(raw);
      project.name = name;
      if (typeof project.centerDisplay === "object" && project.centerDisplay && !Array.isArray(project.centerDisplay)) {
        project.centerDisplay.projectName = name;
      }
      project.updatedAt = nowIso();
      await writeFile(file, JSON.stringify(project), "utf8");
      return res.json({ status: "ok", project });
    } catch {
      return res.status(404).json({ status: "error", message: "N\xE3o encontrado" });
    }
  }
  if (method === "DELETE" && action === "delete") {
    const id = sanitizeId(req.query.id);
    if (!id) return res.status(400).json({ status: "error", message: "id inv\xE1lido" });
    try {
      await unlink(projectFilePath(dataDir, id));
    } catch {
    }
    return res.json({ status: "ok" });
  }
  if (method === "POST") {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ status: "error", message: "JSON inv\xE1lido" });
    }
    const now = nowIso();
    const incomingId = sanitizeId(body.id);
    if (incomingId) {
      const file = projectFilePath(dataDir, incomingId);
      try {
        const old = JSON.parse(await readFile(file, "utf8"));
        const createdAt2 = typeof old.createdAt === "string" && old.createdAt ? old.createdAt : now;
        const next2 = { ...body, id: incomingId, createdAt: createdAt2, updatedAt: now };
        await writeFile(file, JSON.stringify(next2), "utf8");
        return res.json({ status: "ok", project: next2 });
      } catch {
        return res.status(404).json({ status: "error", message: "Projeto n\xE3o encontrado para atualizar" });
      }
    }
    const id = generateId();
    const createdAt = typeof body.createdAt === "string" && body.createdAt ? body.createdAt : now;
    const next = { ...body, id, createdAt, updatedAt: now };
    await writeFile(projectFilePath(dataDir, id), JSON.stringify(next), "utf8");
    return res.json({ status: "ok", project: next });
  }
  if (method === "GET" && !action) {
    const scope = typeof req.query.scope === "string" ? req.query.scope : "mine";
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : "";
    const now = nowIso();
    const files = (await readdir(dataDir)).filter((f) => f.startsWith("project-") && f.endsWith(".json"));
    const metas = [];
    for (const fileName of files) {
      try {
        const raw = await readFile(path.join(dataDir, fileName), "utf8");
        const project = JSON.parse(raw);
        if (!project?.id || !project.ownerId) continue;
        if (scope === "mine" && ownerId && project.ownerId !== ownerId) continue;
        metas.push({
          id: String(project.id),
          name: typeof project.name === "string" && project.name.trim() ? project.name : "Projeto",
          sequence: 0,
          createdAt: typeof project.createdAt === "string" ? project.createdAt : now,
          updatedAt: typeof project.updatedAt === "string" ? project.updatedAt : typeof project.createdAt === "string" ? project.createdAt : now,
          ownerId: String(project.ownerId),
          ownerName: asOwnerName(project),
          thumbnailDataUrl: thumbnailFromProject(project)
        });
      } catch {
      }
    }
    metas.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    metas.forEach((m, idx) => m.sequence = idx + 1);
    return res.json({ status: "ok", scope, ownerId: ownerId || null, projects: metas });
  }
  return res.status(405).json({ status: "error", message: "M\xE9todo n\xE3o suportado" });
});
var port = Number(process.env.PORT) || 3e3;
app.listen(port, () => {
  console.log(`[pimo-backend] listening on :${port}`);
});
//# sourceMappingURL=index.js.map