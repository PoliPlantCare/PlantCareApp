import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { regarPlanta, atualizarConfig, atualizarHorarios } from "../lib/api";
import type {
  DetailCard,
  NewPlantInput,
  PlantDashboard,
  SensorReading,
  SensorStatus,
} from "../types/plant";

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=900&auto=format&fit=crop";

const JIBOIA_IMAGE_URL =
  "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?q=80&w=900&auto=format&fit=crop";

const MARGARIDA_IMAGE_URL =
  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=900&auto=format&fit=crop";

const fallbackPlant: PlantDashboard = {
  id: "demo-orquidea",
  name: "Sua Planta",
  species: "Orquídea",
  lastUpdatedMinutes: 0,
  automaticWatering: false,
  careFrequency: "frequent",
  healthLabel: "Saudável",
  imageUrl: DEFAULT_IMAGE_URL,
  sensors: [
    {
      label: "Luminosidade",
      value: "12k",
      icon: "☼",
      color: "#f5a400",
      status: "good",
    },
    {
      label: "Solo",
      value: "36%",
      icon: "⌁💧",
      color: "#7a4b00",
      status: "warning",
    },
    {
      label: "Ar",
      value: "60%",
      icon: "☁💧",
      color: "#0d83d8",
      status: "good",
    },
    {
      label: "Temperatura",
      value: "24°C",
      icon: "♨",
      color: "#a80d12",
      status: "good",
    },
  ],
  detailCards: [],
};

const fallbackPlants: PlantDashboard[] = [
  fallbackPlant,
  {
    ...fallbackPlant,
    id: "demo-jiboia",
    name: "Outra Planta",
    species: "Jibóia",
    imageUrl: JIBOIA_IMAGE_URL,
  },
  {
    ...fallbackPlant,
    id: "demo-margarida-1",
    name: "Exemplo 1",
    species: "Margarida",
    imageUrl: MARGARIDA_IMAGE_URL,
  },
  {
    ...fallbackPlant,
    id: "demo-margarida-2",
    name: "Exemplo 2",
    species: "Margarida",
    imageUrl: MARGARIDA_IMAGE_URL,
  },
];

const createLocalPlantId = () => `local-${Date.now()}`;

const isLocalPlant = (plantId: string) =>
  plantId.startsWith("local-") || plantId.startsWith("demo-");

const careFrequencyFromRecord = (plantRecord: PlantRecord) => {
  const frequency =
    plantRecord.frequencia_cuidado ?? plantRecord.care_frequency;
  return frequency === "low" ? "low" : "frequent";
};

type PlantRecord = {
  id: string;
  nome?: string | null;
  name?: string | null;
  especie?: string | null;
  species?: string | null;
  automatic_watering?: boolean | null;
  rega_automatica?: boolean | null;
  image_url?: string | null;
  care_frequency?: string | null;
  frequencia_cuidado?: string | null;
};

type ReadingRecord = {
  tipo?: string | null;
  type?: string | null;
  valor?: number | string | null;
  value?: number | string | null;
  created_at?: string | null;
};

const formatElapsedMinutes = (createdAt?: string | null) => {
  if (!createdAt) {
    return fallbackPlant.lastUpdatedMinutes;
  }

  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.round(elapsed / 60000));
};

const numericValue = (reading?: ReadingRecord) => {
  const rawValue = reading?.valor ?? reading?.value;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const readingByType = (readings: ReadingRecord[], possibleTypes: string[]) =>
  readings.find((reading) => {
    const type = (reading.tipo ?? reading.type ?? "").toLowerCase();
    return possibleTypes.some((possibleType) => type.includes(possibleType));
  });

const buildSensors = (readings: ReadingRecord[]): SensorReading[] => {
  const light = numericValue(
    readingByType(readings, ["luz", "luminosidade", "light"]),
  );
  const soil = numericValue(readingByType(readings, ["solo", "soil"]));
  const air = numericValue(
    readingByType(readings, ["ar", "air", "umidade_ar"]),
  );
  const temperature = numericValue(
    readingByType(readings, ["temperatura", "temperature", "temp"]),
  );

  return [
    {
      label: "Luminosidade",
      value:
        light === undefined
          ? fallbackPlant.sensors[0].value
          : `${Math.round(light / 1000)}k`,
      icon: "☼",
      color: "#f5a400",
      status: "good",
    },
    {
      label: "Solo",
      value:
        soil === undefined
          ? fallbackPlant.sensors[1].value
          : `${Math.round(soil)}%`,
      icon: "⌁💧",
      color: "#7a4b00",
      status: soil !== undefined && soil < 40 ? "warning" : "good",
    },
    {
      label: "Ar",
      value:
        air === undefined
          ? fallbackPlant.sensors[2].value
          : `${Math.round(air)}%`,
      icon: "☁💧",
      color: "#0d83d8",
      status: "good",
    },
    {
      label: "Temperatura",
      value:
        temperature === undefined
          ? fallbackPlant.sensors[3].value
          : `${Math.round(temperature)}°C`,
      icon: "♨",
      color: "#a80d12",
      status:
        temperature !== undefined && temperature > 32 ? "warning" : "good",
    },
  ];
};

const statusColor = (status: SensorStatus) => {
  if (status === "critical") {
    return "#c42727";
  }

  if (status === "warning") {
    return "#d99a00";
  }

  return "#47aa60";
};

const sensorByLabel = (sensors: SensorReading[], label: string) =>
  sensors.find((sensor) => sensor.label.toLowerCase() === label.toLowerCase());

const buildDetailCards = (sensors: SensorReading[]): DetailCard[] => {
  const light =
    sensorByLabel(sensors, "Luminosidade") ?? fallbackPlant.sensors[0];
  const soil = sensorByLabel(sensors, "Solo") ?? fallbackPlant.sensors[1];
  const air = sensorByLabel(sensors, "Ar") ?? fallbackPlant.sensors[2];
  const temperature =
    sensorByLabel(sensors, "Temperatura") ?? fallbackPlant.sensors[3];
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
      valueColor: statusColor(light.status),
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
      valueColor: statusColor(air.status),
    },
    {
      id: "soil",
      title: "Umidade (Solo)",
      value: soil.value,
      unit: "Relativo ao solo",
      icon: "⌁💧",
      iconColor: soil.color,
      status: soil.status,
      valueColor: statusColor(soil.status),
    },
    {
      id: "next-watering",
      title: "Próxima rega automática prevista em",
      value: "1",
      unit: "Hora",
      description: "Com base nas tendências de umidade",
      status: "good",
    },
    {
      id: "temperature",
      title: temperature.label,
      value: temperature.value,
      unit: "Ambiente",
      icon: "♨",
      iconColor: temperature.color,
      status: temperature.status,
      valueColor: statusColor(temperature.status),
    },
    {
      id: "last-watering",
      title: "Última rega realizada há",
      value: "3",
      unit: "Horas",
      status: "good",
    },
    {
      id: "humidity-alert",
      title: "Umidade abaixo do normal ao longo da semana",
      value: "↓☁💧",
      status: soil.status === "good" ? "good" : soil.status,
      valueColor: "#0d83d8",
      compact: true,
    },
    {
      id: "air-trend",
      title: "Umidade (Ar)",
      value: "-5%",
      unit: "Por hora",
      icon: "☁💧",
      iconColor: air.color,
      status: air.status,
      valueColor: "#4a4a4a",
    },
    {
      id: "recommendation",
      title: "Recomendação",
      value: needsAttention
        ? "Aumente a exposição a luz."
        : "Continue a rotina atual.",
      status: needsAttention ? "warning" : "good",
      compact: true,
    },
  ];
};

fallbackPlant.detailCards = buildDetailCards(fallbackPlant.sensors);
fallbackPlants.forEach((plant) => {
  plant.detailCards = buildDetailCards(plant.sensors);
});

const imageForSpecies = (species: string, imageUrl?: string | null) => {
  if (imageUrl) {
    return imageUrl;
  }

  const normalizedSpecies = species.toLowerCase();
  if (normalizedSpecies.includes("jib")) {
    return JIBOIA_IMAGE_URL;
  }
  if (normalizedSpecies.includes("margarida")) {
    return MARGARIDA_IMAGE_URL;
  }

  return DEFAULT_IMAGE_URL;
};

const plantDashboardFromRecord = (
  plantRecord: PlantRecord,
  readings: ReadingRecord[] = [],
): PlantDashboard => {
  const name = plantRecord.nome ?? plantRecord.name ?? fallbackPlant.name;
  const species =
    plantRecord.especie ?? plantRecord.species ?? fallbackPlant.species;
  const latestCreatedAt = readings[0]?.created_at;
  const sensors = buildSensors(readings);

  return {
    id: plantRecord.id,
    name,
    species,
    automaticWatering:
      plantRecord.rega_automatica ??
      plantRecord.automatic_watering ??
      fallbackPlant.automaticWatering,
    careFrequency: careFrequencyFromRecord(plantRecord),
    imageUrl: imageForSpecies(species, plantRecord.image_url),
    lastUpdatedMinutes: formatElapsedMinutes(latestCreatedAt),
    healthLabel: "Saudável",
    sensors,
    detailCards: buildDetailCards(sensors),
  };
};

const plantDashboardFromInput = (
  newPlant: NewPlantInput,
  id = createLocalPlantId(),
): PlantDashboard => ({
  ...fallbackPlant,
  id,
  name: newPlant.name,
  species: newPlant.species,
  imageUrl: imageForSpecies(newPlant.species),
  automaticWatering: false,
  careFrequency: newPlant.careFrequency,
  detailCards: buildDetailCards(fallbackPlant.sensors),
});

export function usePlantDashboard() {
  const [plant, setPlant] = useState<PlantDashboard>(fallbackPlant);
  const [plants, setPlants] = useState<PlantDashboard[]>(fallbackPlants);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatering, setIsWatering] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    const { data: plantRecords } = await supabase
      .from("plantas")
      .select("*")
      .limit(50);
    const parsedPlantRecords = (plantRecords ?? []) as PlantRecord[];
    const plantRecord = parsedPlantRecords[0];

    if (!plantRecord) {
      setIsLoading(false);
      return;
    }

    const { data: readings } = await supabase
      .from("leituras")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24);

    const latestReadings = (readings ?? []) as ReadingRecord[];
    const dashboardPlants = parsedPlantRecords.map((record, index) =>
      plantDashboardFromRecord(record, index === 0 ? latestReadings : []),
    );

    setPlants((currentPlants) => {
      const localPlants = currentPlants.filter((currentPlant) =>
        currentPlant.id.startsWith("local-"),
      );
      const remotePlantIds = new Set(
        dashboardPlants.map((dashboardPlant) => dashboardPlant.id),
      );
      const unsavedLocalPlants = localPlants.filter(
        (localPlant) => !remotePlantIds.has(localPlant.id),
      );

      return [...unsavedLocalPlants, ...dashboardPlants];
    });
    setPlant((currentPlant) => {
      const refreshedSelectedPlant = dashboardPlants.find(
        (dashboardPlant) => dashboardPlant.id === currentPlant.id,
      );

      if (refreshedSelectedPlant) {
        return refreshedSelectedPlant;
      }

      return currentPlant.id.startsWith("local-")
        ? currentPlant
        : dashboardPlants[0];
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("plantcare-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leituras" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plantas" },
        refresh,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const toggleAutomaticWatering = useCallback(async () => {
    const nextValue = !plant.automaticWatering;
    setPlant((currentPlant) => ({
      ...currentPlant,
      automaticWatering: nextValue,
    }));
    setPlants((currentPlants) =>
      currentPlants.map((currentPlant) =>
        currentPlant.id === plant.id
          ? { ...currentPlant, automaticWatering: nextValue }
          : currentPlant,
      ),
    );

    if (isLocalPlant(plant.id)) {
      return;
    }

    const { error } = await supabase
      .from("plantas")
      .update({ rega_automatica: nextValue })
      .eq("id", plant.id);

    if (error) {
      setPlant((currentPlant) => ({
        ...currentPlant,
        automaticWatering: !nextValue,
      }));
      setPlants((currentPlants) =>
        currentPlants.map((currentPlant) =>
          currentPlant.id === plant.id
            ? { ...currentPlant, automaticWatering: !nextValue }
            : currentPlant,
        ),
      );
    }
  }, [plant.automaticWatering, plant.id]);

  const selectPlant = useCallback(
    (plantId: string) => {
      const selectedPlant = plants.find(
        (currentPlant) => currentPlant.id === plantId,
      );

      if (selectedPlant) {
        setPlant(selectedPlant);
      }
    },
    [plants],
  );

  const updatePlant = useCallback(
    async (plantId: string, plantUpdate: NewPlantInput) => {
      const previousPlant = plants.find(
        (currentPlant) => currentPlant.id === plantId,
      );

      if (!previousPlant) {
        return;
      }

      const updatedPlant: PlantDashboard = {
        ...previousPlant,
        name: plantUpdate.name,
        species: plantUpdate.species,
        careFrequency: plantUpdate.careFrequency,
        imageUrl: imageForSpecies(plantUpdate.species),
      };

      setPlant((currentPlant) =>
        currentPlant.id === plantId ? updatedPlant : currentPlant,
      );
      setPlants((currentPlants) =>
        currentPlants.map((currentPlant) =>
          currentPlant.id === plantId ? updatedPlant : currentPlant,
        ),
      );

      if (isLocalPlant(plantId)) {
        return;
      }

      const { error } = await supabase
        .from("plantas")
        .update({
          nome: plantUpdate.name,
          especie: plantUpdate.species,
          frequencia_cuidado: plantUpdate.careFrequency,
        })
        .eq("id", plantId);

      if (error) {
        setPlant((currentPlant) =>
          currentPlant.id === plantId ? previousPlant : currentPlant,
        );
        setPlants((currentPlants) =>
          currentPlants.map((currentPlant) =>
            currentPlant.id === plantId ? previousPlant : currentPlant,
          ),
        );
      }
    },
    [plants],
  );

  const deletePlant = useCallback(
    async (plantId: string) => {
      const remainingPlants = plants.filter(
        (currentPlant) => currentPlant.id !== plantId,
      );
      const nextPlant = remainingPlants[0] ?? fallbackPlant;

      setPlants(remainingPlants);
      setPlant(plant.id === plantId ? nextPlant : plant);

      if (isLocalPlant(plantId)) {
        return;
      }

      await supabase.from("plantas").delete().eq("id", plantId);
    },
    [plant, plants],
  );

  const addPlant = useCallback(async (newPlant: NewPlantInput) => {
    const optimisticPlant = plantDashboardFromInput(newPlant);

    setPlant(optimisticPlant);
    setPlants((currentPlants) => [optimisticPlant, ...currentPlants]);

    const { data, error } = await supabase
      .from("plantas")
      .insert({
        nome: newPlant.name,
        especie: newPlant.species,
        rega_automatica: false,
        frequencia_cuidado: newPlant.careFrequency,
      })
      .select("*")
      .single();

    if (error || !data) {
      return;
    }

    const savedPlant = plantDashboardFromRecord(data as PlantRecord);
    setPlant(savedPlant);
    setPlants((currentPlants) =>
      currentPlants.map((currentPlant) =>
        currentPlant.id === optimisticPlant.id ? savedPlant : currentPlant,
      ),
    );
  }, []);

  const triggerManualWatering = useCallback(async () => {
    try {
      setIsWatering(true);
      // Como ainda não temos os dados de calibração oficiais no BD, usamos os valores padrão (20 e 80)
      await regarPlanta({
        nome: plant.name,
        umidade_min: 20,
        umidade_max: 80,
        tempo_segundos: 5
      });
    } catch (e) {
      console.error(e);
      alert("Falha ao regar a planta. Verifique sua conexão.");
    } finally {
      setIsWatering(false);
    }
  }, [plant.name]);

  return useMemo(
    () => ({
      plant,
      plants,
      isLoading,
      isWatering,
      refresh,
      toggleAutomaticWatering,
      triggerManualWatering,
      selectPlant,
      addPlant,
      updatePlant,
      deletePlant,
    }),
    [
      plant,
      plants,
      isLoading,
      isWatering,
      refresh,
      toggleAutomaticWatering,
      triggerManualWatering,
      selectPlant,
      addPlant,
      updatePlant,
      deletePlant,
    ],
  );
}
