import type {
  DetailCard,
  NewPlantInput,
  PlantAlert,
  PlantDashboard,
  PlantSpeciesProfile,
  SensorHistoryEntry,
  SensorReading,
  SensorStatus,
  WateringHistoryEntry,
  WateringWindow,
} from "../types/plant";

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=900&auto=format&fit=crop";
const JIBOIA_IMAGE_URL =
  "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?q=80&w=900&auto=format&fit=crop";
const MARGARIDA_IMAGE_URL =
  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=900&auto=format&fit=crop";
const GIRASSOL_IMAGE_URL =
  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=900&auto=format&fit=crop";

export type PlantRecord = {
  id: string;
  nome?: string | null;
  name?: string | null;
  especie?: string | null;
  species?: string | null;
  device_id?: string | null;
  rega_automatica?: boolean | null;
  automatic_watering?: boolean | null;
  image_url?: string | null;
  frequencia_cuidado?: string | null;
  care_frequency?: string | null;
  local?: string | null;
  location_type?: string | null;
  exposicao_sol?: string | null;
  sun_exposure?: string | null;
  umidade_min?: number | null;
  umidade_max?: number | null;
  temp_max?: number | null;
  luz_min?: number | null;
  luz_max?: number | null;
};

export const DEFAULT_DEVICE_ID = "ESP32_PlantCare";

export const SPECIES_PROFILES: PlantSpeciesProfile[] = [
  {
    species: "Orquídea",
    commonNames: ["orquidea", "orchid"],
    careFrequency: "frequent",
    locationType: "indoor",
    sunExposure: "shade",
    moistureMin: 35,
    moistureMax: 72,
    tempMax: 30,
    lightMin: 600,
    lightMax: 4500,
    defaultWateringWindows: [{ id: "orquidea-1", on: "08:00", off: "08:05" }],
    recommendations: [
      "Prefira luz indireta e boa ventilação.",
      "Evite encharcar o substrato.",
    ],
  },
  {
    species: "Jiboia",
    commonNames: ["jiboia", "jibóia", "pothos"],
    careFrequency: "low",
    locationType: "indoor",
    sunExposure: "partial",
    moistureMin: 25,
    moistureMax: 70,
    tempMax: 32,
    lightMin: 400,
    lightMax: 7000,
    defaultWateringWindows: [{ id: "jiboia-1", on: "09:00", off: "09:04" }],
    recommendations: [
      "Aceita meia-sombra.",
      "Regue apenas quando o solo começar a secar.",
    ],
  },
  {
    species: "Margarida",
    commonNames: ["margarida", "daisy"],
    careFrequency: "frequent",
    locationType: "outdoor",
    sunExposure: "full",
    moistureMin: 35,
    moistureMax: 78,
    tempMax: 31,
    lightMin: 3500,
    lightMax: 14000,
    defaultWateringWindows: [{ id: "margarida-1", on: "07:30", off: "07:36" }],
    recommendations: [
      "Mantenha em local bem iluminado.",
      "Solo levemente úmido favorece a floração.",
    ],
  },
  {
    species: "Girassol",
    commonNames: ["girassol", "sunflower"],
    careFrequency: "frequent",
    locationType: "outdoor",
    sunExposure: "full",
    moistureMin: 30,
    moistureMax: 76,
    tempMax: 34,
    lightMin: 5000,
    lightMax: 18000,
    defaultWateringWindows: [{ id: "girassol-1", on: "07:00", off: "07:08" }],
    recommendations: [
      "Precisa de sol pleno.",
      "Ajuste a rega em dias muito quentes.",
    ],
  },
];

export const criarIdPlantaLocal = () => `local-${Date.now()}`;
export const ehPlantaLocal = (plantId: string) =>
  plantId.startsWith("local-") || plantId.startsWith("demo-");

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const buscarPerfilPorEspecie = (species: string) => {
  const normalizedSpecies = normalizeText(species);
  return (
    SPECIES_PROFILES.find((profile) =>
      [profile.species, ...profile.commonNames].some((name) =>
        normalizedSpecies.includes(normalizeText(name)),
      ),
    ) ?? SPECIES_PROFILES[0]
  );
};

export const imagemPorEspecie = (species: string, imageUrl?: string | null) => {
  if (imageUrl) return imageUrl;
  const normalizedSpecies = normalizeText(species);
  if (normalizedSpecies.includes("jiboia")) return JIBOIA_IMAGE_URL;
  if (normalizedSpecies.includes("margarida")) return MARGARIDA_IMAGE_URL;
  if (normalizedSpecies.includes("girassol")) return GIRASSOL_IMAGE_URL;
  return DEFAULT_IMAGE_URL;
};

export const formatarMinutosDesde = (createdAt?: string) => {
  if (!createdAt) return 0;
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.round(elapsed / 60000));
};

export const corPorStatus = (status: SensorStatus) => {
  if (status === "critical") return "#c42727";
  if (status === "warning") return "#d99a00";
  return "#47aa60";
};

export const statusPorFaixa = (
  value: number | undefined,
  min?: number,
  max?: number,
): SensorStatus => {
  if (value === undefined) return "warning";
  if (min !== undefined && value < min * 0.65) return "critical";
  if (min !== undefined && value < min) return "warning";
  if (max !== undefined && value > max * 1.25) return "critical";
  if (max !== undefined && value > max) return "warning";
  return "good";
};

const latestByType = (
  history: SensorHistoryEntry[],
  type: SensorHistoryEntry["type"],
) => history.find((entry) => entry.type === type);

export const montarSensores = (
  history: SensorHistoryEntry[],
  profile: PlantSpeciesProfile,
): SensorReading[] => {
  const light = latestByType(history, "light");
  const soil = latestByType(history, "soil");
  const air = latestByType(history, "air");
  const temperature = latestByType(history, "temperature");

  return [
    {
      label: "Luminosidade",
      value: light
        ? `${Math.round(light.value).toLocaleString("pt-BR")}`
        : "--",
      rawValue: light?.value,
      icon: "☼",
      color: "#f5a400",
      status: statusPorFaixa(light?.value, profile.lightMin, profile.lightMax),
      updatedAt: light?.createdAt,
    },
    {
      label: "Solo",
      value: soil ? `${Math.round(soil.value)}%` : "--",
      rawValue: soil?.value,
      icon: "⌁💧",
      color: "#7a4b00",
      status: statusPorFaixa(
        soil?.value,
        profile.moistureMin,
        profile.moistureMax,
      ),
      updatedAt: soil?.createdAt,
    },
    {
      label: "Ar",
      value: air ? `${Math.round(air.value)}%` : "--",
      rawValue: air?.value,
      icon: "☁💧",
      color: "#0d83d8",
      status: air ? air.status : "warning",
      updatedAt: air?.createdAt,
    },
    {
      label: "Temperatura",
      value: temperature ? `${Math.round(temperature.value)}°C` : "--",
      rawValue: temperature?.value,
      icon: "♨",
      color: "#a80d12",
      status: statusPorFaixa(temperature?.value, undefined, profile.tempMax),
      updatedAt: temperature?.createdAt,
    },
  ];
};

const sensorByLabel = (sensors: SensorReading[], label: string) =>
  sensors.find((sensor) => sensor.label.toLowerCase() === label.toLowerCase());

const hoursSince = (createdAt?: string) => {
  if (!createdAt) return "--";
  return String(
    Math.max(
      0,
      Math.round((Date.now() - new Date(createdAt).getTime()) / 3600000),
    ),
  );
};

export const calcularHorasProximaRega = (
  wateringWindows: WateringWindow[],
  referenceDate = new Date(),
) => {
  const currentMinutes =
    referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const nextWindow = wateringWindows
    .map((window) => {
      const [hour, minute] = window.on.split(":").map(Number);
      const windowMinutes = hour * 60 + minute;
      return windowMinutes >= currentMinutes
        ? windowMinutes
        : windowMinutes + 24 * 60;
    })
    .sort((a, b) => a - b)[0];
  if (nextWindow === undefined) return "--";
  return String(Math.max(0, Math.round((nextWindow - currentMinutes) / 60)));
};

export const montarAlertas = (
  sensors: SensorReading[],
  profile: PlantSpeciesProfile,
  wateringHistory: WateringHistoryEntry[],
): PlantAlert[] => {
  const now = new Date().toISOString();
  const alerts: PlantAlert[] = [];
  const soil = sensorByLabel(sensors, "Solo");
  const light = sensorByLabel(sensors, "Luminosidade");
  const temperature = sensorByLabel(sensors, "Temperatura");

  if (soil?.status === "critical") {
    alerts.push({
      id: "solo-critico",
      severity: "critical",
      title: "Solo criticamente seco",
      message: `A umidade está abaixo do limite de ${profile.moistureMin}%. O firmware deve entrar em rega de emergência e este alerta permanece até ser revisado.`,
      createdAt: now,
      requirement: "RF05/RNF07",
      persistent: true,
    });
  } else if (soil?.status === "warning") {
    alerts.push({
      id: "solo-baixo",
      severity: "warning",
      title: "Umidade do solo baixa",
      message:
        "Acompanhe a próxima irrigação e considere uma rega manual se a planta estiver em modo manual.",
      createdAt: now,
      requirement: "RF07",
      persistent: true,
    });
  }

  if (light?.status !== "good") {
    alerts.push({
      id: "luz-fora-faixa",
      severity: "warning",
      title: "Luminosidade fora do ideal",
      message: `A espécie ${profile.species} espera uma faixa aproximada entre ${profile.lightMin} e ${profile.lightMax} lux.`,
      createdAt: now,
      requirement: "RF07",
      persistent: true,
    });
  }

  if (temperature?.status !== "good") {
    alerts.push({
      id: "temperatura-alta",
      severity: temperature?.status === "critical" ? "critical" : "warning",
      title: "Temperatura acima do ideal",
      message: `A temperatura excedeu o limite recomendado de ${profile.tempMax}°C.`,
      createdAt: now,
      requirement: "RF07/RNF07",
      persistent: true,
    });
  }

  const lastManualWatering = wateringHistory.find(
    (entry) => entry.mode === "manual",
  );
  if (lastManualWatering) {
    alerts.push({
      id: "rega-manual-registrada",
      severity: "info",
      title: "Rega manual registrada",
      message:
        "A próxima rega automática deve ser pulada pelo controlador se a umidade estiver adequada.",
      createdAt: lastManualWatering.createdAt,
      requirement: "RF06",
    });
  }

  return alerts;
};

export const montarCardsDetalhe = (
  sensors: SensorReading[],
  profile: PlantSpeciesProfile,
  wateringWindows: WateringWindow[],
  wateringHistory: WateringHistoryEntry[],
): DetailCard[] => {
  const light = sensorByLabel(sensors, "Luminosidade") ?? sensors[0];
  const soil = sensorByLabel(sensors, "Solo") ?? sensors[1];
  const air = sensorByLabel(sensors, "Ar") ?? sensors[2];
  const temperature = sensorByLabel(sensors, "Temperatura") ?? sensors[3];
  const needsAttention = sensors.some((sensor) => sensor.status !== "good");

  return [
    {
      id: "light",
      title: light.label,
      value: light.value,
      unit: "Lux",
      icon: "☼",
      iconColor: light.color,
      status: light.status,
      valueColor: corPorStatus(light.status),
    },
    {
      id: "general",
      title: "Estado geral",
      value: needsAttention
        ? "Atenção recomendada."
        : "Nenhuma atenção necessária.",
      icon: "●",
      iconColor: needsAttention ? "#d99a00" : "#47b466",
      status: needsAttention ? "warning" : "good",
      compact: true,
    },
    {
      id: "air",
      title: "Umidade (Ar)",
      value: air.value,
      unit: "Relativo ao ar",
      icon: "☁💧",
      iconColor: air.color,
      status: air.status,
      valueColor: corPorStatus(air.status),
    },
    {
      id: "soil",
      title: "Umidade (Solo)",
      value: soil.value,
      unit: `${profile.moistureMin}% a ${profile.moistureMax}%`,
      icon: "⌁💧",
      iconColor: soil.color,
      status: soil.status,
      valueColor: corPorStatus(soil.status),
    },
    {
      id: "next-watering",
      title: "Próxima rega automática prevista em",
      value: calcularHorasProximaRega(wateringWindows),
      unit: "Horas",
      description: "Com base nos horários preferenciais",
      status: "good",
    },
    {
      id: "temperature",
      title: temperature.label,
      value: temperature.value,
      unit: `Máx. ${profile.tempMax}°C`,
      icon: "♨",
      iconColor: temperature.color,
      status: temperature.status,
      valueColor: corPorStatus(temperature.status),
    },
    {
      id: "last-watering",
      title: "Última rega registrada há",
      value: hoursSince(wateringHistory[0]?.createdAt),
      unit: "Horas",
      status: "good",
    },
    {
      id: "humidity-alert",
      title: "Faixa de umidade do solo",
      value: `${profile.moistureMin}%–${profile.moistureMax}%`,
      status: soil.status,
      valueColor: corPorStatus(soil.status),
      compact: true,
    },
    {
      id: "location",
      title: "Local e exposição",
      value: `${profile.locationType === "indoor" ? "Fechado" : "Aberto"} · ${profile.sunExposure === "full" ? "Sol pleno" : profile.sunExposure === "partial" ? "Meia-sombra" : "Sombra"}`,
      status: "good",
      compact: true,
    },
    {
      id: "recommendation",
      title: "Recomendação",
      value: needsAttention
        ? profile.recommendations[0]
        : "Continue a rotina atual.",
      status: needsAttention ? "warning" : "good",
      compact: true,
    },
  ];
};

export const dashboardFromRecord = (
  record: PlantRecord,
  sensorHistory: SensorHistoryEntry[],
  wateringHistory: WateringHistoryEntry[],
): PlantDashboard => {
  const name = record.nome ?? record.name ?? "Sua Planta";
  const species = record.especie ?? record.species ?? "Orquídea";
  const baseProfile = buscarPerfilPorEspecie(species);
  const profile: PlantSpeciesProfile = {
    ...baseProfile,
    moistureMin: record.umidade_min ?? baseProfile.moistureMin,
    moistureMax: record.umidade_max ?? baseProfile.moistureMax,
    tempMax: record.temp_max ?? baseProfile.tempMax,
    lightMin: record.luz_min ?? baseProfile.lightMin,
    lightMax: record.luz_max ?? baseProfile.lightMax,
  };
  const sensors = montarSensores(sensorHistory, profile);
  const alerts = montarAlertas(sensors, profile, wateringHistory);
  const lastUpdatedAt = sensorHistory[0]?.createdAt;
  const hasAttention = alerts.some((alert) => alert.severity !== "info");

  return {
    id: record.id,
    deviceId: record.device_id ?? DEFAULT_DEVICE_ID,
    name,
    species: profile.species,
    lastUpdatedMinutes: formatarMinutosDesde(lastUpdatedAt),
    automaticWatering:
      record.rega_automatica ?? record.automatic_watering ?? false,
    wateringMode:
      (record.rega_automatica ?? record.automatic_watering)
        ? "automatic"
        : "manual",
    careFrequency:
      record.frequencia_cuidado === "low" || record.care_frequency === "low"
        ? "low"
        : profile.careFrequency,
    locationType:
      record.local === "outdoor" || record.location_type === "outdoor"
        ? "outdoor"
        : profile.locationType,
    sunExposure:
      record.exposicao_sol === "full" || record.sun_exposure === "full"
        ? "full"
        : record.exposicao_sol === "partial" ||
            record.sun_exposure === "partial"
          ? "partial"
          : profile.sunExposure,
    wateringWindows: profile.defaultWateringWindows,
    moistureMin: profile.moistureMin,
    moistureMax: profile.moistureMax,
    tempMax: profile.tempMax,
    lightMin: profile.lightMin,
    lightMax: profile.lightMax,
    healthLabel: hasAttention ? "Atenção" : "Saudável",
    imageUrl: imagemPorEspecie(species, record.image_url),
    sensors,
    detailCards: montarCardsDetalhe(
      sensors,
      profile,
      profile.defaultWateringWindows,
      wateringHistory,
    ),
    sensorHistory,
    wateringHistory,
    alerts,
  };
};

export const dashboardFromInput = (
  input: NewPlantInput,
  id = criarIdPlantaLocal(),
): PlantDashboard => {
  const profile = buscarPerfilPorEspecie(input.species);
  return dashboardFromRecord(
    {
      id,
      nome: input.name,
      especie: profile.species,
      rega_automatica: false,
      frequencia_cuidado: input.careFrequency,
      local: input.locationType,
      exposicao_sol: input.sunExposure,
    },
    [],
    [],
  );
};

export const fallbackPlant = dashboardFromInput(
  {
    name: "Sua Planta",
    species: "Orquídea",
    careFrequency: "frequent",
    locationType: "indoor",
    sunExposure: "shade",
    wateringWindows: SPECIES_PROFILES[0].defaultWateringWindows,
  },
  "demo-orquidea",
);

export const fallbackPlants = [
  fallbackPlant,
  dashboardFromInput(
    {
      name: "Jiboia da sala",
      species: "Jiboia",
      careFrequency: "low",
      locationType: "indoor",
      sunExposure: "partial",
      wateringWindows: SPECIES_PROFILES[1].defaultWateringWindows,
    },
    "demo-jiboia",
  ),
  dashboardFromInput(
    {
      name: "Margarida",
      species: "Margarida",
      careFrequency: "frequent",
      locationType: "outdoor",
      sunExposure: "full",
      wateringWindows: SPECIES_PROFILES[2].defaultWateringWindows,
    },
    "demo-margarida",
  ),
];
