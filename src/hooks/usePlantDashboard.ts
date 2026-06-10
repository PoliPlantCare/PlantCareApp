import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PlantDashboard, SensorReading } from '../types/plant';

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=900&auto=format&fit=crop';

const fallbackPlant: PlantDashboard = {
  id: 'demo-orquidea',
  name: 'Sua Planta',
  species: 'Orquídea',
  lastUpdatedMinutes: 0,
  automaticWatering: false,
  healthLabel: 'Saudável',
  imageUrl: DEFAULT_IMAGE_URL,
  sensors: [
    { label: 'Luminosidade', value: '12k', icon: '☼', color: '#f5a400', status: 'good' },
    { label: 'Solo', value: '36%', icon: '⌁💧', color: '#7a4b00', status: 'warning' },
    { label: 'Ar', value: '60%', icon: '☁💧', color: '#0d83d8', status: 'good' },
    { label: 'Temperatura', value: '24°C', icon: '♨', color: '#a80d12', status: 'good' }
  ]
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
    const type = (reading.tipo ?? reading.type ?? '').toLowerCase();
    return possibleTypes.some((possibleType) => type.includes(possibleType));
  });

const buildSensors = (readings: ReadingRecord[]): SensorReading[] => {
  const light = numericValue(readingByType(readings, ['luz', 'luminosidade', 'light']));
  const soil = numericValue(readingByType(readings, ['solo', 'soil']));
  const air = numericValue(readingByType(readings, ['ar', 'air', 'umidade_ar']));
  const temperature = numericValue(readingByType(readings, ['temperatura', 'temperature', 'temp']));

  return [
    {
      label: 'Luminosidade',
      value: light === undefined ? fallbackPlant.sensors[0].value : `${Math.round(light / 1000)}k`,
      icon: '☼',
      color: '#f5a400',
      status: 'good'
    },
    {
      label: 'Solo',
      value: soil === undefined ? fallbackPlant.sensors[1].value : `${Math.round(soil)}%`,
      icon: '⌁💧',
      color: '#7a4b00',
      status: soil !== undefined && soil < 40 ? 'warning' : 'good'
    },
    {
      label: 'Ar',
      value: air === undefined ? fallbackPlant.sensors[2].value : `${Math.round(air)}%`,
      icon: '☁💧',
      color: '#0d83d8',
      status: 'good'
    },
    {
      label: 'Temperatura',
      value: temperature === undefined ? fallbackPlant.sensors[3].value : `${Math.round(temperature)}°C`,
      icon: '♨',
      color: '#a80d12',
      status: temperature !== undefined && temperature > 32 ? 'warning' : 'good'
    }
  ];
};

export function usePlantDashboard() {
  const [plant, setPlant] = useState<PlantDashboard>(fallbackPlant);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    const { data: plants } = await supabase.from('plantas').select('*').limit(1);
    const plantRecord = plants?.[0] as PlantRecord | undefined;

    if (!plantRecord) {
      setPlant(fallbackPlant);
      setIsLoading(false);
      return;
    }

    const { data: readings } = await supabase
      .from('leituras')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24);

    const latestReadings = (readings ?? []) as ReadingRecord[];
    const latestCreatedAt = latestReadings[0]?.created_at;

    setPlant({
      id: plantRecord.id,
      name: plantRecord.nome ?? plantRecord.name ?? fallbackPlant.name,
      species: plantRecord.especie ?? plantRecord.species ?? fallbackPlant.species,
      automaticWatering:
        plantRecord.rega_automatica ?? plantRecord.automatic_watering ?? fallbackPlant.automaticWatering,
      imageUrl: plantRecord.image_url ?? fallbackPlant.imageUrl,
      lastUpdatedMinutes: formatElapsedMinutes(latestCreatedAt),
      healthLabel: 'Saudável',
      sensors: buildSensors(latestReadings)
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('plantcare-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leituras' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plantas' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const toggleAutomaticWatering = useCallback(async () => {
    const nextValue = !plant.automaticWatering;
    setPlant((currentPlant) => ({ ...currentPlant, automaticWatering: nextValue }));

    if (plant.id === fallbackPlant.id) {
      return;
    }

    const { error } = await supabase
      .from('plantas')
      .update({ rega_automatica: nextValue })
      .eq('id', plant.id);

    if (error) {
      setPlant((currentPlant) => ({ ...currentPlant, automaticWatering: !nextValue }));
    }
  }, [plant.automaticWatering, plant.id]);

  return useMemo(
    () => ({ plant, isLoading, refresh, toggleAutomaticWatering }),
    [plant, isLoading, refresh, toggleAutomaticWatering]
  );
}
