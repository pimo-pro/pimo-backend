export type ApiMaterial = {
  id: string;
  label: string;
  espessura: number;
  precoPorM2: number;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  type: "wood";
  industrial: boolean;
  visual: boolean;
  aliases: string[];
  action: "manter";
  source: "industrial-default";
};

export type MaterialsApiPayload = {
  ok: true;
  count: number;
  materials: ApiMaterial[];
  updatedAt: string;
};

const MATERIALS: ApiMaterial[] = [
  {
    id: "mdf_branco",
    label: "MDF Branco",
    espessura: 18,
    precoPorM2: 35,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    type: "wood",
    industrial: true,
    visual: true,
    aliases: ["MDF Branco", "MDF", "Branco"],
    action: "manter",
    source: "industrial-default",
  },
  {
    id: "carvalho",
    label: "Carvalho",
    espessura: 20,
    precoPorM2: 45,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    type: "wood",
    industrial: true,
    visual: true,
    aliases: ["Carvalho", "Carvalho Natural"],
    action: "manter",
    source: "industrial-default",
  },
  {
    id: "nogueira",
    label: "Nogueira",
    espessura: 18,
    precoPorM2: 40,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    type: "wood",
    industrial: false,
    visual: true,
    aliases: ["Nogueira"],
    action: "manter",
    source: "industrial-default",
  },
];

export function buildMaterialsApiPayload(): MaterialsApiPayload {
  return {
    ok: true,
    count: MATERIALS.length,
    materials: MATERIALS,
    updatedAt: new Date().toISOString(),
  };
}

