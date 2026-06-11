import test from "node:test";
import assert from "node:assert/strict";
import {
  buscarPerfilPorEspecie,
  calcularHorasProximaRega,
  montarAlertas,
  montarSensores,
  SPECIES_PROFILES,
  statusPorFaixa,
} from "../src/lib/plantDomain.ts";
import type { SensorHistoryEntry, WateringHistoryEntry } from "../src/types/plant.ts";

test("identifica perfis de espécie mesmo com acentos ou nomes alternativos", () => {
  assert.equal(buscarPerfilPorEspecie("Jibóia da sala").species, "Jiboia");
  assert.equal(buscarPerfilPorEspecie("sunflower varanda").species, "Girassol");
  assert.equal(buscarPerfilPorEspecie("espécie desconhecida").species, "Orquídea");
});

test("classifica status de sensor por faixa com níveis warning e critical", () => {
  assert.equal(statusPorFaixa(10, 30, 80), "critical");
  assert.equal(statusPorFaixa(25, 30, 80), "warning");
  assert.equal(statusPorFaixa(55, 30, 80), "good");
  assert.equal(statusPorFaixa(110, 30, 80), "critical");
  assert.equal(statusPorFaixa(undefined, 30, 80), "warning");
});

test("monta sensores com as últimas leituras do PlantCareServer", () => {
  const profile = SPECIES_PROFILES.find((item) => item.species === "Orquídea")!;
  const history: SensorHistoryEntry[] = [
    { id: "solo-1", type: "soil", label: "Umidade do solo", value: 18, unit: "%", status: "critical", createdAt: "2026-06-11T10:00:00.000Z" },
    { id: "temp-1", type: "temperature", label: "Temperatura", value: 31, unit: "°C", status: "warning", createdAt: "2026-06-11T10:00:00.000Z" },
    { id: "air-1", type: "air", label: "Umidade do ar", value: 63, unit: "%", status: "good", createdAt: "2026-06-11T10:00:00.000Z" },
    { id: "light-1", type: "light", label: "Luminosidade", value: 300, unit: "lux", status: "warning", createdAt: "2026-06-11T10:00:00.000Z" },
  ];

  const sensors = montarSensores(history, profile);

  assert.equal(sensors.find((sensor) => sensor.label === "Solo")?.value, "18%");
  assert.equal(sensors.find((sensor) => sensor.label === "Solo")?.status, "critical");
  assert.equal(sensors.find((sensor) => sensor.label === "Temperatura")?.status, "warning");
  assert.equal(sensors.find((sensor) => sensor.label === "Ar")?.value, "63%");
});

test("gera alertas persistentes para solo seco, luz fora da faixa e rega manual", () => {
  const profile = SPECIES_PROFILES[0];
  const sensors = montarSensores(
    [
      { id: "solo-1", type: "soil", label: "Umidade do solo", value: 10, unit: "%", status: "critical", createdAt: "2026-06-11T10:00:00.000Z" },
      { id: "light-1", type: "light", label: "Luminosidade", value: 50, unit: "lux", status: "warning", createdAt: "2026-06-11T10:00:00.000Z" },
    ],
    profile,
  );
  const wateringHistory: WateringHistoryEntry[] = [
    { id: "rega-1", mode: "manual", createdAt: "2026-06-11T09:00:00.000Z" },
  ];

  const alerts = montarAlertas(sensors, profile, wateringHistory);

  assert.ok(alerts.some((alert) => alert.id === "solo-critico" && alert.persistent));
  assert.ok(alerts.some((alert) => alert.id === "luz-fora-faixa"));
  assert.ok(alerts.some((alert) => alert.id === "rega-manual-registrada" && alert.requirement === "RF06"));
});

test("calcula a próxima janela de rega cruzando a meia-noite", () => {
  const referenceDate = new Date("2026-06-11T23:30:00.000Z");
  assert.equal(
    calcularHorasProximaRega([{ id: "manha", on: "07:30", off: "07:35" }], referenceDate),
    "8",
  );
});
