export type SensorStatus = "good" | "warning" | "critical";

export type SensorReading = {
  label: string;
  value: string;
  icon: string;
  color: string;
  status: SensorStatus;
};

export type PlantCareFrequency = "frequent" | "low";

export type NewPlantInput = {
  name: string;
  species: string;
  careFrequency: PlantCareFrequency;
};

export type DetailCard = {
  id: string;
  title: string;
  value: string;
  unit?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  status: SensorStatus;
  valueColor?: string;
  compact?: boolean;
};

export type PlantDashboard = {
  id: string;
  name: string;
  species: string;
  lastUpdatedMinutes: number;
  automaticWatering: boolean;
  healthLabel: string;
  imageUrl: string;
  sensors: SensorReading[];
  detailCards: DetailCard[];
};
