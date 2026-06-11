import test from "node:test";
import assert from "node:assert/strict";
import { dashboardFromInput, dashboardFromRecord } from "../src/lib/plantDomain.ts";
import {
  criarPayloadHorarios,
  criarRegistroRegaManual,
} from "../src/lib/plantServerPayloads.ts";
import type { NewPlantInput, SensorHistoryEntry, WateringHistoryEntry } from "../src/types/plant.ts";

test("integra cadastro, perfil de espécie e payload de horários para o PlantCareServer", () => {
  const input: NewPlantInput = {
    name: "Girassol da varanda",
    species: "Girassol",
    careFrequency: "frequent",
    locationType: "outdoor",
    sunExposure: "full",
    wateringWindows: [{ id: "principal", on: "07:00", off: "07:08" }],
  };

  const plant = dashboardFromInput(input, "local-girassol");
  const payload = criarPayloadHorarios(input.wateringWindows);

  assert.equal(plant.species, "Girassol");
  assert.equal(plant.locationType, "outdoor");
  assert.equal(plant.sunExposure, "full");
  assert.equal(plant.moistureMin, 30);
  assert.deepEqual(payload, { horarios: [{ on: "07:00", off: "07:08" }] });
});

test("integra leituras remotas segmentadas, histórico de rega e alertas do dashboard", () => {
  const sensorHistory: SensorHistoryEntry[] = [
    { id: "soil-row", type: "soil", label: "Umidade do solo", value: 12, unit: "%", status: "critical", createdAt: "2026-06-11T10:20:00.000Z" },
    { id: "temp-row", type: "temperature", label: "Temperatura", value: 36, unit: "°C", status: "critical", createdAt: "2026-06-11T10:19:00.000Z" },
    { id: "light-row", type: "light", label: "Luminosidade", value: 22000, unit: "lux", status: "warning", createdAt: "2026-06-11T10:18:00.000Z" },
    { id: "air-row", type: "air", label: "Umidade do ar", value: 62, unit: "%", status: "good", createdAt: "2026-06-11T10:17:00.000Z" },
  ];
  const wateringHistory: WateringHistoryEntry[] = [
    { id: "rega-manual", mode: "manual", createdAt: "2026-06-11T09:30:00.000Z" },
  ];

  const dashboard = dashboardFromRecord(
    {
      id: "planta-1",
      nome: "Orquídea bancada",
      especie: "Orquídea",
      device_id: "ESP32-01",
      rega_automatica: true,
    },
    sensorHistory,
    wateringHistory,
  );

  assert.equal(dashboard.deviceId, "ESP32-01");
  assert.equal(dashboard.wateringMode, "automatic");
  assert.equal(dashboard.healthLabel, "Atenção");
  assert.equal(dashboard.sensors.find((sensor) => sensor.label === "Solo")?.status, "critical");
  assert.ok(dashboard.alerts.some((alert) => alert.id === "solo-critico"));
  assert.ok(dashboard.alerts.some((alert) => alert.id === "temperatura-alta"));
  assert.ok(dashboard.detailCards.some((card) => card.id === "last-watering"));
  assert.equal(dashboard.sensorHistory.length, 4);
  assert.equal(dashboard.wateringHistory[0].mode, "manual");
});

test("integra registro de rega manual no formato esperado pelo histórico do servidor", () => {
  const registro = criarRegistroRegaManual("ESP32-01", "Rega manual acionada pelo aplicativo");

  assert.equal(registro.device_id, "ESP32-01");
  assert.equal(registro.modo, "manual");
  assert.equal(registro.observacao, "Rega manual acionada pelo aplicativo");
  assert.match(registro.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
