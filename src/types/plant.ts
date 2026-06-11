export type SensorStatus = "good" | "warning" | "critical";

export type SensorReading = {
  label: string;
  value: string;
  rawValue?: number;
  icon: string;
  color: string;
  status: SensorStatus;
  updatedAt?: string;
};

export type PlantCareFrequency = "frequent" | "low";
export type PlantLocationType = "indoor" | "outdoor";
export type SunExposure = "shade" | "partial" | "full";
export type WateringMode = "automatic" | "manual";

export type WateringWindow = {
  id: string;
  on: string;
  off: string;
};

export type PlantSpeciesProfile = {
  species: string;
  commonNames: string[];
  careFrequency: PlantCareFrequency;
  locationType: PlantLocationType;
  sunExposure: SunExposure;
  moistureMin: number;
  moistureMax: number;
  tempMax: number;
  lightMin: number;
  lightMax: number;
  defaultWateringWindows: WateringWindow[];
  recommendations: string[];
};

export type NewPlantInput = {
  name: string;
  species: string;
  careFrequency: PlantCareFrequency;
  locationType: PlantLocationType;
  sunExposure: SunExposure;
  wateringWindows: WateringWindow[];
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

export type SensorHistoryEntry = {
  id: string;
  type: "temperature" | "soil" | "air" | "light";
  label: string;
  value: number;
  unit: string;
  status: SensorStatus;
  createdAt: string;
};

export type WateringHistoryEntry = {
  id: string;
  mode: "auto" | "manual";
  createdAt: string;
  note?: string;
};

export type PlantAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt: string;
  requirement: string;
  persistent?: boolean;
};

export type PlantDashboard = {
  id: string;
  deviceId: string;
  name: string;
  species: string;
  lastUpdatedMinutes: number;
  automaticWatering: boolean;
  wateringMode: WateringMode;
  careFrequency: PlantCareFrequency;
  locationType: PlantLocationType;
  sunExposure: SunExposure;
  wateringWindows: WateringWindow[];
  moistureMin: number;
  moistureMax: number;
  tempMax: number;
  lightMin: number;
  lightMax: number;
  healthLabel: string;
  imageUrl: string;
  sensors: SensorReading[];
  detailCards: DetailCard[];
  sensorHistory: SensorHistoryEntry[];
  wateringHistory: WateringHistoryEntry[];
  alerts: PlantAlert[];
};
