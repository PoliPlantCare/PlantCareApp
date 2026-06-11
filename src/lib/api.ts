import { supabase } from "./supabase";

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
  on: string; // formato "HH:MM"
  off: string; // formato "HH:MM"
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
export async function atualizarHorarios(horarios: HorarioRega[]) {
  const { data, error } = await supabase.functions.invoke("atualizar_horarios", {
    body: { horarios },
  });

  if (error) {
    throw new Error(`Erro ao atualizar horários: ${error.message}`);
  }

  return data;
}
