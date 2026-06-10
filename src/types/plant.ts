export type SensorStatus = 'good' | 'warning' | 'critical';

export type SensorReading = {
  label: string;
  value: string;
  icon: string;
  color: string;
  status: SensorStatus;
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
};
