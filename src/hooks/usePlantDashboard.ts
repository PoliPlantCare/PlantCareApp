import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  atualizarConfig,
  atualizarHorarios,
  listarHistoricoRegas,
  listarHistoricoSensores,
  registrarRegaManualLocalOuRemota,
  regarPlanta,
} from "../lib/api";
import {
  dashboardFromInput,
  dashboardFromRecord,
  ehPlantaLocal,
  fallbackPlant,
  fallbackPlants,
  SPECIES_PROFILES,
} from "../lib/plantDomain";
import type { NewPlantInput, PlantDashboard } from "../types/plant";
import type { PlantRecord } from "../lib/plantDomain";

export function usePlantDashboard() {
  const [plant, setPlant] = useState<PlantDashboard>(fallbackPlant);
  const [plants, setPlants] = useState<PlantDashboard[]>(fallbackPlants);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatering, setIsWatering] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const [sensorHistory, wateringHistory, { data: plantRecords }] =
        await Promise.all([
          listarHistoricoSensores(48),
          listarHistoricoRegas(20),
          supabase.from("plantas").select("*").limit(50),
        ]);

      const parsedPlantRecords = (plantRecords ?? []) as PlantRecord[];
      const dashboardPlants =
        parsedPlantRecords.length > 0
          ? parsedPlantRecords.map((record) =>
              dashboardFromRecord(record, sensorHistory, wateringHistory),
            )
          : [
              dashboardFromRecord(
                {
                  id: fallbackPlant.id,
                  nome: fallbackPlant.name,
                  especie: fallbackPlant.species,
                },
                sensorHistory,
                wateringHistory,
              ),
            ];

      setPlants((currentPlants) => {
        const localPlants = currentPlants.filter((currentPlant) =>
          currentPlant.id.startsWith("local-"),
        );
        return [...localPlants, ...dashboardPlants];
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
    } catch (error) {
      console.warn("Falha ao sincronizar dashboard PlantCare.", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("plantcare-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leitura_temperatura" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leitura_solo" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leitura_umidade_ar" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leitura_luz" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "historico_rega" },
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
    const update = (currentPlant: PlantDashboard) =>
      currentPlant.id === plant.id
        ? {
            ...currentPlant,
            automaticWatering: nextValue,
            wateringMode: nextValue
              ? ("automatic" as const)
              : ("manual" as const),
          }
        : currentPlant;

    setPlant((currentPlant) => update(currentPlant));
    setPlants((currentPlants) => currentPlants.map(update));

    if (ehPlantaLocal(plant.id)) {
      return;
    }

    const { error } = await supabase
      .from("plantas")
      .update({ rega_automatica: nextValue })
      .eq("id", plant.id);
    if (error) {
      console.warn("Falha ao atualizar modo de rega.", error.message);
      setPlant((currentPlant) => ({
        ...currentPlant,
        automaticWatering: !nextValue,
        wateringMode: !nextValue ? "automatic" : "manual",
      }));
      setPlants((currentPlants) =>
        currentPlants.map((currentPlant) =>
          currentPlant.id === plant.id
            ? {
                ...currentPlant,
                automaticWatering: !nextValue,
                wateringMode: !nextValue ? "automatic" : "manual",
              }
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

      const updatedPlant = {
        ...dashboardFromInput(plantUpdate, plantId),
        automaticWatering: previousPlant.automaticWatering,
        wateringMode: previousPlant.wateringMode,
        sensorHistory: previousPlant.sensorHistory,
        wateringHistory: previousPlant.wateringHistory,
      };

      setPlant((currentPlant) =>
        currentPlant.id === plantId ? updatedPlant : currentPlant,
      );
      setPlants((currentPlants) =>
        currentPlants.map((currentPlant) =>
          currentPlant.id === plantId ? updatedPlant : currentPlant,
        ),
      );

      await atualizarConfig({
        nome: updatedPlant.name,
        umidade_min: updatedPlant.moistureMin,
        umidade_max: updatedPlant.moistureMax,
      });
      await atualizarHorarios(plantUpdate.wateringWindows);

      if (ehPlantaLocal(plantId)) {
        return;
      }

      const { error } = await supabase
        .from("plantas")
        .update({
          nome: plantUpdate.name,
          especie: updatedPlant.species,
          frequencia_cuidado: plantUpdate.careFrequency,
          local: plantUpdate.locationType,
          exposicao_sol: plantUpdate.sunExposure,
          umidade_min: updatedPlant.moistureMin,
          umidade_max: updatedPlant.moistureMax,
          temp_max: updatedPlant.tempMax,
        })
        .eq("id", plantId);

      if (error) {
        console.warn("Falha ao atualizar planta.", error.message);
      }
    },
    [plants],
  );

  const deletePlant = useCallback(
    async (plantId: string) => {
      const remainingPlants = plants.filter(
        (currentPlant) => currentPlant.id !== plantId,
      );
      setPlants(remainingPlants);
      setPlant(
        plant.id === plantId ? (remainingPlants[0] ?? fallbackPlant) : plant,
      );

      if (!ehPlantaLocal(plantId)) {
        await supabase.from("plantas").delete().eq("id", plantId);
      }
    },
    [plant, plants],
  );

  const addPlant = useCallback(async (newPlant: NewPlantInput) => {
    const optimisticPlant = dashboardFromInput(newPlant);
    setPlant(optimisticPlant);
    setPlants((currentPlants) => [optimisticPlant, ...currentPlants]);
    await atualizarConfig({
      nome: optimisticPlant.name,
      umidade_min: optimisticPlant.moistureMin,
      umidade_max: optimisticPlant.moistureMax,
    });
    await atualizarHorarios(newPlant.wateringWindows);

    const { data, error } = await supabase
      .from("plantas")
      .insert({
        nome: newPlant.name,
        especie: optimisticPlant.species,
        rega_automatica: false,
        frequencia_cuidado: newPlant.careFrequency,
        local: newPlant.locationType,
        exposicao_sol: newPlant.sunExposure,
        umidade_min: optimisticPlant.moistureMin,
        umidade_max: optimisticPlant.moistureMax,
        temp_max: optimisticPlant.tempMax,
        ph_ideal: null,
      })
      .select("*")
      .single();

    if (!error && data) {
      const savedPlant = dashboardFromRecord(
        data as PlantRecord,
        optimisticPlant.sensorHistory,
        optimisticPlant.wateringHistory,
      );
      setPlant(savedPlant);
      setPlants((currentPlants) =>
        currentPlants.map((currentPlant) =>
          currentPlant.id === optimisticPlant.id ? savedPlant : currentPlant,
        ),
      );
    }
  }, []);

  const triggerManualWatering = useCallback(async () => {
    try {
      setIsWatering(true);
      await regarPlanta({
        nome: plant.name,
        umidade_min: plant.moistureMin,
        umidade_max: plant.moistureMax,
        tempo_segundos: 5,
      });
      await registrarRegaManualLocalOuRemota(
        plant.deviceId,
        "Rega manual acionada pelo aplicativo",
      );
      await refresh();
    } catch (error) {
      console.error(error);
      alert(
        "Falha ao regar a planta. Verifique a conexão com o PlantCareServer.",
      );
    } finally {
      setIsWatering(false);
    }
  }, [
    plant.deviceId,
    plant.moistureMax,
    plant.moistureMin,
    plant.name,
    refresh,
  ]);

  return useMemo(
    () => ({
      plant,
      plants,
      isLoading,
      isWatering,
      speciesProfiles: SPECIES_PROFILES,
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
