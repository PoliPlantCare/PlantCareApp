import type { WateringWindow } from "../types/plant";

type HorarioRega = {
  on: string;
  off: string;
};

export const criarPayloadHorarios = (
  horarios: HorarioRega[] | WateringWindow[],
) => ({
  horarios: horarios.map(({ on, off }) => ({ on, off })),
});

export const criarRegistroRegaManual = (deviceId: string, note: string) => ({
  device_id: deviceId,
  modo: "manual" as const,
  timestamp: new Date().toISOString(),
  observacao: note,
});
