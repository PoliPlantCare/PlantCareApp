import { supabase } from "./supabase";
import type {
  SensorHistoryEntry,
  SensorStatus,
  WateringHistoryEntry,
  WateringWindow,
} from "../types/plant";
import {
  criarPayloadHorarios,
  criarRegistroRegaManual,
} from "./plantServerPayloads";

export interface RegaManualParams {
  nome: string;
  umidade_max: number;
  umidade_min: number;
  tempo_segundos?: number;
}

export interface ConfigParams {
  nome: string;
  umidade_max: number;
  umidade_min: number;
}

export interface HorarioRega {
  on: string;
  off: string;
}

type SensorTable =
  | "leitura_temperatura"
  | "leitura_solo"
  | "leitura_umidade_ar"
  | "leitura_luz";

type SensorTableConfig = {
  table: SensorTable;
  type: SensorHistoryEntry["type"];
  label: string;
  unit: string;
};

type RawSensorRow = {
  id: string;
  device_id?: string | null;
  valor: number | string;
  created_at: string;
};

type RawWateringRow = {
  id?: string | null;
  device_id?: string | null;
  modo?: string | null;
  timestamp?: string | null;
  created_at?: string | null;
  observacao?: string | null;
  note?: string | null;
};

const SENSOR_TABLES: SensorTableConfig[] = [
  {
    table: "leitura_temperatura",
    type: "temperature",
    label: "Temperatura",
    unit: "°C",
  },
  { table: "leitura_solo", type: "soil", label: "Umidade do solo", unit: "%" },
  {
    table: "leitura_umidade_ar",
    type: "air",
    label: "Umidade do ar",
    unit: "%",
  },
  { table: "leitura_luz", type: "light", label: "Luminosidade", unit: "lux" },
];

const statusForReading = (
  type: SensorHistoryEntry["type"],
  value: number,
): SensorStatus => {
  if (type === "soil" && value < 20) {
    return "critical";
  }
  if (type === "soil" && value < 40) {
    return "warning";
  }
  if (type === "temperature" && value > 35) {
    return "critical";
  }
  if (type === "temperature" && value > 32) {
    return "warning";
  }
  if (type === "light" && (value < 300 || value > 12000)) {
    return "warning";
  }
  return "good";
};

const ensureAuthenticatedSession = async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return;
  }

  await supabase.auth.signInAnonymously();
};

/**
 * Garante uma sessão Supabase antes das leituras protegidas por RLS.
 * Se o projeto Supabase não tiver login anônimo habilitado, as consultas ainda
 * retornam vazio/erro e o app mantém os mocks locais documentados no README.
 */
export async function prepararSessaoPlantCare() {
  try {
    await ensureAuthenticatedSession();
  } catch (error) {
    console.warn(
      "Não foi possível autenticar anonimamente no Supabase.",
      error,
    );
  }
}

export async function listarHistoricoSensores(
  limit = 24,
): Promise<SensorHistoryEntry[]> {
  await prepararSessaoPlantCare();

  const results = await Promise.all(
    SENSOR_TABLES.map(async (config) => {
      const { data, error } = await supabase
        .from(config.table)
        .select("id, device_id, valor, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn(`Falha ao ler ${config.table}.`, error.message);
        return [] as SensorHistoryEntry[];
      }

      return ((data ?? []) as RawSensorRow[]).map((row) => {
        const value = Number(row.valor);
        return {
          id: `${config.type}-${row.id}`,
          type: config.type,
          label: config.label,
          value: Number.isFinite(value) ? value : 0,
          unit: config.unit,
          status: Number.isFinite(value)
            ? statusForReading(config.type, value)
            : "warning",
          createdAt: row.created_at,
        } satisfies SensorHistoryEntry;
      });
    }),
  );

  return results
    .flat()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function listarHistoricoRegas(
  limit = 20,
): Promise<WateringHistoryEntry[]> {
  await prepararSessaoPlantCare();

  const { data, error } = await supabase
    .from("historico_rega")
    .select("id, device_id, modo, timestamp, created_at, observacao, note")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn(
      "Falha ao ler historico_rega; usando histórico local/mock.",
      error.message,
    );
    return [];
  }

  return ((data ?? []) as RawWateringRow[]).map((row, index) => ({
    id: row.id ?? `rega-${index}`,
    mode: row.modo === "auto" ? "auto" : "manual",
    createdAt: row.timestamp ?? row.created_at ?? new Date().toISOString(),
    note: row.observacao ?? row.note ?? undefined,
  }));
}

export async function registrarRegaManualLocalOuRemota(
  deviceId: string,
  note: string,
) {
  await prepararSessaoPlantCare();

  const { error } = await supabase
    .from("historico_rega")
    .insert(criarRegistroRegaManual(deviceId, note));

  if (error) {
    console.warn(
      "Não foi possível registrar rega manual no backend.",
      error.message,
    );
  }
}

/**
 * Invoca a Edge Function "regar" para acionar manualmente a bomba d'água.
 */
export async function regarPlanta(params: RegaManualParams) {
  const { data, error } = await supabase.functions.invoke("regar", {
    body: params,
  });

  if (error) {
    throw new Error(`Erro ao regar planta: ${error.message}`);
  }

  return data;
}

/**
 * Invoca a Edge Function "atualizar_config" para alterar os limites de umidade.
 */
export async function atualizarConfig(params: ConfigParams) {
  const { data, error } = await supabase.functions.invoke("atualizar_config", {
    body: params,
  });

  if (error) {
    throw new Error(`Erro ao atualizar configurações: ${error.message}`);
  }

  return data;
}

/**
 * Invoca a Edge Function "atualizar_horarios" para enviar a agenda de rega.
 */
export async function atualizarHorarios(
  horarios: HorarioRega[] | WateringWindow[],
) {
  const body = criarPayloadHorarios(horarios);
  const { data, error } = await supabase.functions.invoke(
    "atualizar_horarios",
    {
      body,
    },
  );

  if (error) {
    throw new Error(`Erro ao atualizar horários: ${error.message}`);
  }

  return data;
}
