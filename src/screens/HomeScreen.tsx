import { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePlantDashboard } from "../hooks/usePlantDashboard";
import type {
  DetailCard,
  NewPlantInput,
  PlantCareFrequency,
  PlantDashboard,
  SensorReading,
} from "../types/plant";

const GREEN = "#2d624a";
const MINT = "#33b884";
const BACKGROUND = "#eeeeec";
const TEXT = "#282828";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_COMPACT = SCREEN_WIDTH < 390;
const CONTENT_PADDING = IS_COMPACT ? 14 : 20;
const PHOTO_SIZE = Math.min(206, Math.max(158, SCREEN_WIDTH * 0.44));
const PHOTO_BORDER = IS_COMPACT ? 13 : 18;
const PLANT_CARD_WIDTH = IS_COMPACT
  ? Math.min(184, Math.max(174, SCREEN_WIDTH * 0.48))
  : Math.min(218, Math.max(198, SCREEN_WIDTH * 0.53));
const HEADER_HEIGHT = IS_COMPACT ? 132 : 156;
const BOTTOM_NAV_HEIGHT = IS_COMPACT ? 84 : 100;
type TabName = "home" | "plants";
type ScreenName = "dashboard" | "addPlant" | "editPlant" | "settingsPlant";

function BrandHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.brandText}>
        Plant<Text style={styles.brandAccent}>Care</Text>
      </Text>
      <View style={styles.headerActions}>
        <View style={styles.shield}>
          <Text style={styles.shieldLeaf}>☘</Text>
        </View>
        <Text style={styles.menuDots}>⋮</Text>
      </View>
    </View>
  );
}

function WaterToggle({
  isEnabled,
  onPress,
}: {
  isEnabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isEnabled }}
      onPress={onPress}
      style={[styles.toggleTrack, isEnabled && styles.toggleTrackEnabled]}
    >
      <View
        style={[styles.toggleThumb, isEnabled && styles.toggleThumbEnabled]}
      >
        <Text
          style={[styles.toggleDrop, isEnabled && styles.toggleDropEnabled]}
        >
          💧
        </Text>
      </View>
    </Pressable>
  );
}

function GearIcon() {
  return (
    <View style={styles.gearIcon}>
      <View style={styles.gearRing} />
      <View style={styles.gearCenter} />
      <View style={[styles.gearSpoke, styles.gearSpokeVertical]} />
      <View style={[styles.gearSpoke, styles.gearSpokeHorizontal]} />
      <View style={[styles.gearSpoke, styles.gearSpokeDiagonalRight]} />
      <View style={[styles.gearSpoke, styles.gearSpokeDiagonalLeft]} />
    </View>
  );
}

function PlantCard({
  name,
  species,
  updatedMinutes,
  automaticWatering,
  onToggle,
}: {
  name: string;
  species: string;
  updatedMinutes: number;
  automaticWatering: boolean;
  onToggle: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.plantCard}>
      <Text style={styles.plantName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.divider} />
      <View style={styles.speciesPill}>
        <Text style={styles.speciesText} numberOfLines={1}>
          ⚚ {species}
        </Text>
      </View>
      <Text style={styles.updatedText} numberOfLines={1}>
        ◷ Atualizado há {updatedMinutes} min
      </Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          <WaterToggle isEnabled={automaticWatering} onPress={onToggle} />
          <Text style={styles.toggleLabel} numberOfLines={1}>
            Rega Automática
          </Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.settingsButton} onPress={onSettings}>
          <GearIcon />
        </Pressable>
      </View>
    </View>
  );
}

function SensorItem({
  sensor,
  isLast,
}: {
  sensor: SensorReading;
  isLast: boolean;
}) {
  const dotColor = sensor.status === "warning" ? "#d99a00" : "#69bd70";

  return (
    <View style={styles.sensorSlot}>
      <Text style={[styles.sensorIcon, { color: sensor.color }]}>
        {sensor.icon}
      </Text>
      <View style={styles.sensorValueRow}>
        <View style={[styles.sensorDot, { backgroundColor: dotColor }]} />
        <Text style={styles.sensorValue}>{sensor.value}</Text>
      </View>
      {!isLast && <View style={styles.sensorSeparator} />}
    </View>
  );
}

function StatusCard({
  sensors,
  healthLabel,
}: {
  sensors: SensorReading[];
  healthLabel: string;
}) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>Status</Text>
        <View style={styles.healthRow}>
          <View style={styles.healthDot} />
          <Text style={styles.healthText}>{healthLabel}</Text>
        </View>
      </View>
      <View style={styles.statusDivider} />
      <View style={styles.sensorsRow}>
        {sensors.map((sensor, index) => (
          <SensorItem
            key={sensor.label}
            sensor={sensor}
            isLast={index === sensors.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function DetailedMetricCard({ card }: { card: DetailCard }) {
  return (
    <View style={styles.detailMetricCard}>
      <View style={styles.detailMetricHeader}>
        <Text style={styles.detailMetricTitle} numberOfLines={2}>
          {card.title}
        </Text>
        {card.icon && (
          <Text style={[styles.detailMetricIcon, { color: card.iconColor }]}>
            {card.icon}
          </Text>
        )}
      </View>
      <View style={styles.detailMetricBody}>
        <Text
          style={[
            styles.detailMetricValue,
            card.compact && styles.detailMetricValueCompact,
            card.valueColor ? { color: card.valueColor } : undefined,
          ]}
          numberOfLines={card.compact ? 3 : 1}
        >
          {card.value}
        </Text>
        {card.unit && <Text style={styles.detailMetricUnit}>{card.unit}</Text>}
        {card.description && (
          <Text style={styles.detailMetricDescription}>{card.description}</Text>
        )}
      </View>
      <Text style={styles.detailChevron}>›</Text>
    </View>
  );
}

function DetailedSheet({ cards }: { cards: DetailCard[] }) {
  return (
    <View style={styles.detailSheet}>
      <View style={styles.detailHandle} />
      <Text style={styles.detailTitle}>Vista Detalhada</Text>
      <View style={styles.detailDivider} />
      <View style={styles.detailGrid}>
        {cards.map((card) => (
          <DetailedMetricCard key={card.id} card={card} />
        ))}
      </View>
    </View>
  );
}

function HomeNavIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.homeIconWrap}>
      <View style={[styles.homeIconRoof, active && styles.navShapeFilled]} />
      <View style={[styles.homeIconBody, active && styles.navShapeFilled]}>
        <View
          style={[styles.homeIconDoor, active && styles.homeIconDoorActive]}
        />
      </View>
    </View>
  );
}

function PlantNavIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.plantIconWrap}>
      <View
        style={[
          styles.plantLeaf,
          styles.plantLeafTop,
          active && styles.navShapeFilled,
        ]}
      />
      <View
        style={[
          styles.plantLeaf,
          styles.plantLeafLeft,
          active && styles.navShapeFilled,
        ]}
      />
      <View
        style={[
          styles.plantLeaf,
          styles.plantLeafRight,
          active && styles.navShapeFilled,
        ]}
      />
      <View style={[styles.plantStem, active && styles.navShapeFilled]} />
    </View>
  );
}

function BottomNav({
  activeTab,
  onChangeTab,
}: {
  activeTab: TabName;
  onChangeTab: (tab: TabName) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChangeTab("home")}
        style={styles.navButton}
      >
        <HomeNavIcon active={activeTab === "home"} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChangeTab("plants")}
        style={styles.navButton}
      >
        <PlantNavIcon active={activeTab === "plants"} />
      </Pressable>
    </View>
  );
}

function DashboardContent({
  plant,
  isLoading,
  isWatering,
  toggleAutomaticWatering,
  triggerManualWatering,
  onOpenSettings,
}: {
  plant: PlantDashboard;
  isLoading: boolean;
  isWatering: boolean;
  toggleAutomaticWatering: () => void;
  triggerManualWatering: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <View style={styles.dashboardRoot}>
      <BrandHeader />
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.heroCurve} />
        <View style={styles.contentArea}>
          <View style={styles.heroRow}>
            <View style={styles.photoFrame}>
              <Image
                source={{ uri: plant.imageUrl }}
                style={styles.plantImage}
              />
              <View style={styles.photoOverlay} />
            </View>
            <PlantCard
              name={plant.name}
              species={plant.species}
              updatedMinutes={plant.lastUpdatedMinutes}
              automaticWatering={plant.automaticWatering}
              onToggle={toggleAutomaticWatering}
              onSettings={onOpenSettings}
            />
          </View>
          <View style={styles.waterNowContainer}>
            <Pressable 
              accessibilityRole="button" 
              style={[styles.waterNowButton, isWatering && styles.waterNowButtonDisabled]}
              onPress={triggerManualWatering}
              disabled={isWatering}
            >
              <Text style={styles.waterNowText}>{isWatering ? "Regando a planta..." : "Regar Agora (Manual)"}</Text>
            </Pressable>
          </View>
          {isLoading && (
            <Text style={styles.loadingText}>
              Sincronizando com o Supabase...
            </Text>
          )}
          <StatusCard sensors={plant.sensors} healthLabel={plant.healthLabel} />
          <DetailedSheet cards={plant.detailCards} />
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryPill({ label }: { label: string }) {
  return (
    <View style={styles.categoryPill}>
      <Text style={styles.categoryText}>{label}</Text>
    </View>
  );
}

function PlantListItem({
  plant,
  isSelected,
  onSelect,
  onEdit,
}: {
  plant: PlantDashboard;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onSelect}
      style={[styles.plantListItem, isSelected && styles.plantListItemSelected]}
    >
      <Image
        source={{ uri: plant.imageUrl }}
        style={styles.plantListImage}
        resizeMode="cover"
      />
      <View style={styles.plantListInfo}>
        <View style={styles.plantListHeader}>
          <Text style={styles.plantListTitle} numberOfLines={1}>
            {plant.name}
          </Text>
          <View style={styles.plantListActions}>
            <Text style={styles.listActionIcon}>ⓘ</Text>
            <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
              <Text style={styles.listActionIcon}>✎</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.listSpeciesPill}>
          <Text style={styles.listSpeciesText} numberOfLines={1}>
            ⚚ {plant.species}
          </Text>
        </View>
        <View style={styles.listHealthRow}>
          <View style={styles.listHealthDot} />
          <Text style={styles.listHealthText}>{plant.healthLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function PlantsContent({
  plants,
  selectedPlantId,
  onSelectPlant,
  onEditPlant,
  onAddPlant,
}: {
  plants: PlantDashboard[];
  selectedPlantId: string;
  onSelectPlant: (plantId: string) => void;
  onEditPlant: (plant: PlantDashboard) => void;
  onAddPlant: () => void;
}) {
  return (
    <View style={styles.plantsRoot}>
      <BrandHeader />
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.plantsScrollContent}
        bounces={false}
      >
        <View style={styles.plantsHeaderArea}>
          <Text style={styles.plantsTitle}>Suas Plantas</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <Text style={styles.searchPlaceholder}>
              Buscar uma planta registrada no app
            </Text>
          </View>
        </View>
        <View style={styles.categoryArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
          </ScrollView>
        </View>
        <View style={styles.listContent}>
          {plants.map((plant) => (
            <PlantListItem
              key={plant.id}
              plant={plant}
              isSelected={plant.id === selectedPlantId}
              onSelect={() => onSelectPlant(plant.id)}
              onEdit={() => onEditPlant(plant)}
            />
          ))}
          <Text style={styles.emptyHint}>
            As plantas que você registra{"\n"}aparecem aqui
          </Text>
        </View>
      </ScrollView>
      <Pressable accessibilityRole="button" style={styles.scrollTopButton}>
        <Text style={styles.scrollTopIcon}>⌃</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onAddPlant}
        style={styles.addPlantButton}
      >
        <Text style={styles.addPlantIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const PLANT_SPECIES = ["Margarida", "Jibóia", "Girassol", "Orquídea"];

function SeedlingIcon() {
  return <Text style={styles.seedlingIcon}>⌘</Text>;
}

function SpeciesOption({
  species,
  selected,
  onPress,
}: {
  species: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.speciesOption, selected && styles.speciesOptionSelected]}
    >
      <Text style={styles.speciesOptionIcon}>
        {species === "Jibóia" ? "❦" : species === "Girassol" ? "☼" : "✿"}
      </Text>
      <Text style={styles.speciesOptionText}>{species}</Text>
    </Pressable>
  );
}

function AddPlantScreen({
  initialPlant,
  onBack,
  onSubmit,
  onDelete,
}: {
  initialPlant?: PlantDashboard;
  onBack: () => void;
  onSubmit: (plant: NewPlantInput) => void;
  onDelete?: () => void;
}) {
  const isEditing = Boolean(initialPlant);
  const [name, setName] = useState(initialPlant?.name ?? "");
  const [species, setSpecies] = useState(initialPlant?.species ?? "Orquídea");
  const [careFrequency, setCareFrequency] = useState<PlantCareFrequency>(
    initialPlant?.careFrequency ?? "frequent",
  );

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      name: name.trim(),
      species,
      careFrequency,
    });
  };

  return (
    <View style={styles.addScreenRoot}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={styles.addBackButton}
      >
        <Text style={styles.addBackIcon}>‹</Text>
      </Pressable>
      <ScrollView
        style={styles.addScreenScroll}
        contentContainerStyle={styles.addScreenContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <SeedlingIcon />
        <Text style={styles.addQuestion}>
          {isEditing ? "Editar planta" : "Como você quer chamar sua planta?"}
        </Text>
        <Text style={styles.addDescription}>
          {isEditing
            ? "Atualize as informações principais dessa planta."
            : "Esse é o nome pelo qual a sua planta será referida dentro do aplicativo do PlantCare."}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome da Planta"
          placeholderTextColor="#9c9c9c"
          style={styles.addInput}
        />

        <Text style={styles.addQuestion}>Qual a espécie da sua planta?</Text>
        <Text style={styles.addDescription}>
          O PlantCare é construído, a princípio, com base em 4 tipos distintos
          de plantas: orquídeas, girassóis, jibóias e margaridas.
        </Text>
        <View style={styles.speciesGrid}>
          {PLANT_SPECIES.map((plantSpecies) => (
            <SpeciesOption
              key={plantSpecies}
              species={plantSpecies}
              selected={species === plantSpecies}
              onPress={() => setSpecies(plantSpecies)}
            />
          ))}
        </View>

        <Text style={styles.addQuestion}>
          Qual a frequência de atenção que você pode dar a essa planta?
        </Text>
        <Text style={styles.addDescription}>
          A resposta dessa pergunta nos ajuda a moldar a experiência de usuário
          e adequá-la a seu perfil pessoal.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCareFrequency("frequent")}
          style={[
            styles.frequencyButton,
            careFrequency === "frequent" && styles.frequencyButtonSelected,
          ]}
        >
          <Text style={styles.frequencyButtonText}>
            Posso cuidar com frequência
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCareFrequency("low")}
          style={[
            styles.frequencyButton,
            styles.lowFrequencyButton,
            careFrequency === "low" && styles.lowFrequencyButtonSelected,
          ]}
        >
          <Text style={styles.frequencyButtonText}>Quero baixa manutenção</Text>
        </Pressable>
      </ScrollView>
      {onDelete && (
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={styles.deletePlantButton}
        >
          <Text style={styles.deletePlantButtonText}>Deletar planta</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[
          styles.continueButton,
          !canSubmit && styles.continueButtonDisabled,
        ]}
      >
        <Text style={styles.continueButtonText}>
          {isEditing ? "Salvar alterações" : "Continuar"}
        </Text>
      </Pressable>
    </View>
  );
}

import { atualizarConfig, atualizarHorarios } from "../lib/api";

function SettingsPlantScreen({
  plant,
  onBack,
}: {
  plant: PlantDashboard;
  onBack: () => void;
}) {
  const [umidadeMax, setUmidadeMax] = useState("80");
  const [umidadeMin, setUmidadeMin] = useState("20");
  const [horarioOn, setHorarioOn] = useState("08:00");
  const [horarioOff, setHorarioOff] = useState("08:05");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await atualizarConfig({
        nome: plant.name,
        umidade_max: parseInt(umidadeMax, 10),
        umidade_min: parseInt(umidadeMin, 10),
      });
      if (horarioOn && horarioOff) {
        await atualizarHorarios([{ on: horarioOn, off: horarioOff }]);
      }
      alert("Configurações atualizadas!");
      onBack();
    } catch (e) {
      alert("Erro ao salvar configurações. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.addScreenRoot}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.addBackButton}>
        <Text style={styles.addBackIcon}>‹</Text>
      </Pressable>
      <ScrollView
        style={styles.addScreenScroll}
        contentContainerStyle={styles.addScreenContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <SeedlingIcon />
        <Text style={styles.addQuestion}>Configurações Avançadas</Text>
        <Text style={styles.addDescription}>
          Ajuste os limites de umidade (0 a 100) e os horários de rega (HH:MM).
        </Text>

        <Text style={[styles.addQuestion, {marginTop: 24, fontSize: 20}]}>Umidade</Text>
        <TextInput
          value={umidadeMin}
          onChangeText={setUmidadeMin}
          placeholder="Mínima (%) - Ex: 20"
          placeholderTextColor="#9c9c9c"
          style={styles.addInput}
          keyboardType="numeric"
        />
        <TextInput
          value={umidadeMax}
          onChangeText={setUmidadeMax}
          placeholder="Máxima (%) - Ex: 80"
          placeholderTextColor="#9c9c9c"
          style={styles.addInput}
          keyboardType="numeric"
        />

        <Text style={[styles.addQuestion, {marginTop: 24, fontSize: 20}]}>Agenda Automática</Text>
        <TextInput
          value={horarioOn}
          onChangeText={setHorarioOn}
          placeholder="Ligar (HH:MM) - Ex: 08:00"
          placeholderTextColor="#9c9c9c"
          style={styles.addInput}
        />
        <TextInput
          value={horarioOff}
          onChangeText={setHorarioOff}
          placeholder="Desligar (HH:MM) - Ex: 08:05"
          placeholderTextColor="#9c9c9c"
          style={styles.addInput}
        />
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={handleSave}
        style={[
          styles.continueButton,
          isSaving && styles.continueButtonDisabled,
        ]}
      >
        <Text style={styles.continueButtonText}>
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Text>
      </Pressable>
    </View>
  );
}

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [screen, setScreen] = useState<ScreenName>("dashboard");
  const [editingPlant, setEditingPlant] = useState<
    PlantDashboard | undefined
  >();
  const {
    plant,
    plants,
    isLoading,
    isWatering,
    toggleAutomaticWatering,
    triggerManualWatering,
    selectPlant,
    addPlant,
    updatePlant,
    deletePlant,
  } = usePlantDashboard();

  const handleAddPlant = async (newPlant: NewPlantInput) => {
    await addPlant(newPlant);
    setActiveTab("plants");
    setScreen("dashboard");
  };

  const handleOpenEditPlant = (plantToEdit: PlantDashboard) => {
    setEditingPlant(plantToEdit);
    setScreen("editPlant");
  };

  const handleUpdatePlant = async (plantUpdate: NewPlantInput) => {
    if (!editingPlant) {
      return;
    }

    await updatePlant(editingPlant.id, plantUpdate);
    setActiveTab("plants");
    setScreen("dashboard");
    setEditingPlant(undefined);
  };

  const handleDeletePlant = async () => {
    if (!editingPlant) {
      return;
    }

    await deletePlant(editingPlant.id);
    setActiveTab("plants");
    setScreen("dashboard");
    setEditingPlant(undefined);
  };

  if (screen === "addPlant") {
    return (
      <AddPlantScreen
        onBack={() => setScreen("dashboard")}
        onSubmit={handleAddPlant}
      />
    );
  }

  if (screen === "editPlant" && editingPlant) {
    return (
      <AddPlantScreen
        initialPlant={editingPlant}
        onBack={() => {
          setScreen("dashboard");
          setEditingPlant(undefined);
        }}
        onSubmit={handleUpdatePlant}
        onDelete={handleDeletePlant}
      />
    );
  }

  if (screen === "settingsPlant") {
    return (
      <SettingsPlantScreen
        plant={plant}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  return (
    <View style={styles.root}>
      {activeTab === "home" ? (
        <DashboardContent
          plant={plant}
          isLoading={isLoading}
          isWatering={isWatering}
          toggleAutomaticWatering={toggleAutomaticWatering}
          triggerManualWatering={triggerManualWatering}
          onOpenSettings={() => setScreen("settingsPlant")}
        />
      ) : (
        <PlantsContent
          plants={plants}
          selectedPlantId={plant.id}
          onSelectPlant={selectPlant}
          onEditPlant={handleOpenEditPlant}
          onAddPlant={() => setScreen("addPlant")}
        />
      )}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  dashboardRoot: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  screenScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT + 26,
    backgroundColor: BACKGROUND,
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: GREEN,
    paddingHorizontal: IS_COMPACT ? 32 : 40,
    paddingTop: IS_COMPACT ? 34 : 48,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  brandText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 35 : 40,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  brandAccent: {
    color: MINT,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: IS_COMPACT ? 16 : 22,
  },
  shield: {
    width: IS_COMPACT ? 54 : 58,
    height: IS_COMPACT ? 62 : 72,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldLeaf: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 30 : 34,
  },
  menuDots: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 52 : 56,
    lineHeight: 60,
    marginTop: -8,
  },
  heroCurve: {
    height: 18,
    marginTop: -18,
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
  },
  contentArea: {
    paddingHorizontal: CONTENT_PADDING,
    marginTop: -(PHOTO_SIZE * 0.38),
  },
  heroRow: {
    minHeight: PHOTO_SIZE + (IS_COMPACT ? 112 : 114),
    flexDirection: "row",
    alignItems: "flex-end",
  },
  photoFrame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: PHOTO_BORDER,
    borderColor: "#f7f7f5",
    overflow: "hidden",
    marginLeft: -CONTENT_PADDING,
    marginTop: IS_COMPACT ? 8 : 12,
    backgroundColor: "#ffffff",
  },
  plantImage: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  plantCard: {
    width: PLANT_CARD_WIDTH,
    minHeight: IS_COMPACT ? 148 : 206,
    marginLeft: IS_COMPACT ? 8 : -8,
    marginRight: 0,
    marginTop: 0,
    paddingVertical: IS_COMPACT ? 11 : 22,
    paddingHorizontal: IS_COMPACT ? 12 : 18,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  plantName: {
    color: TEXT,
    fontSize: IS_COMPACT ? 22 : 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  divider: {
    width: "88%",
    height: 1,
    backgroundColor: "#e8e8e8",
    marginVertical: IS_COMPACT ? 4 : 7,
  },
  speciesPill: {
    borderRadius: 28,
    backgroundColor: GREEN,
    paddingHorizontal: IS_COMPACT ? 11 : 14,
    paddingVertical: IS_COMPACT ? 3 : 5,
    marginBottom: IS_COMPACT ? 8 : 14,
  },
  speciesText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 14 : 18,
  },
  updatedText: {
    color: "#555555",
    width: "100%",
    fontSize: IS_COMPACT ? 12 : 17,
    marginBottom: IS_COMPACT ? 8 : 14,
    textAlign: "center",
  },
  toggleGroup: {
    width: IS_COMPACT ? 106 : 130,
    alignItems: "center",
  },
  toggleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTrack: {
    width: IS_COMPACT ? 74 : 98,
    height: IS_COMPACT ? 36 : 50,
    borderRadius: 30,
    backgroundColor: "#696969",
    padding: 5,
    justifyContent: "center",
  },
  toggleTrackEnabled: {
    backgroundColor: "#1085da",
  },
  toggleThumb: {
    width: IS_COMPACT ? 26 : 40,
    height: IS_COMPACT ? 26 : 40,
    borderRadius: IS_COMPACT ? 13 : 20,
    backgroundColor: "#9d9d9d",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleThumbEnabled: {
    alignSelf: "flex-end",
    backgroundColor: "#ffffff",
  },
  toggleDrop: {
    fontSize: IS_COMPACT ? 16 : 24,
    opacity: 0.35,
  },
  toggleDropEnabled: {
    opacity: 1,
  },
  toggleLabel: {
    color: "#4d4d4d",
    fontSize: IS_COMPACT ? 12 : 18,
    marginTop: 3,
    textAlign: "center",
  },
  settingsButton: {
    width: IS_COMPACT ? 36 : 52,
    height: IS_COMPACT ? 36 : 52,
    borderRadius: IS_COMPACT ? 18 : 26,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: {
    width: IS_COMPACT ? 20 : 28,
    height: IS_COMPACT ? 20 : 28,
    alignItems: "center",
    justifyContent: "center",
  },
  gearRing: {
    width: IS_COMPACT ? 15 : 22,
    height: IS_COMPACT ? 15 : 22,
    borderRadius: IS_COMPACT ? 7.5 : 11,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  gearCenter: {
    position: "absolute",
    width: IS_COMPACT ? 4 : 7,
    height: IS_COMPACT ? 4 : 7,
    borderRadius: IS_COMPACT ? 2 : 3.5,
    backgroundColor: "#ffffff",
  },
  gearSpoke: {
    position: "absolute",
    width: 3,
    height: IS_COMPACT ? 20 : 28,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
  gearSpokeVertical: {},
  gearSpokeHorizontal: {
    transform: [{ rotate: "90deg" }],
  },
  gearSpokeDiagonalRight: {
    transform: [{ rotate: "45deg" }],
  },
  gearSpokeDiagonalLeft: {
    transform: [{ rotate: "-45deg" }],
  },
  loadingText: {
    marginTop: -10,
    marginBottom: 12,
    color: "#6c6c6c",
    textAlign: "center",
  },
  statusCard: {
    marginHorizontal: CONTENT_PADDING,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: IS_COMPACT ? 16 : 24,
    marginTop: IS_COMPACT ? 30 : 36,
    paddingTop: 14,
    paddingBottom: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusTitle: {
    color: "#000000",
    fontSize: IS_COMPACT ? 30 : 33,
    fontWeight: "500",
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthDot: {
    width: IS_COMPACT ? 8 : 10,
    height: IS_COMPACT ? 8 : 10,
    borderRadius: IS_COMPACT ? 4 : 5,
    backgroundColor: "#47b466",
  },
  healthText: {
    color: "#47aa60",
    fontSize: IS_COMPACT ? 22 : 24,
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginBottom: 12,
  },
  sensorsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sensorSlot: {
    flex: 1,
    alignItems: "center",
    position: "relative",
    top: -24,
  },
  waterNowContainer: {
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: 24,
  },
  waterNowButton: {
    backgroundColor: MINT,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterNowButtonDisabled: {
    backgroundColor: '#88ceb3',
  },
  waterNowText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  sensorIcon: {
    fontSize: IS_COMPACT ? 34 : 40,
    height: IS_COMPACT ? 44 : 50,
    marginBottom: 4,
    textAlign: "center",
  },
  sensorValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: IS_COMPACT ? 4 : 6,
  },
  sensorDot: {
    width: IS_COMPACT ? 8 : 10,
    height: IS_COMPACT ? 8 : 10,
    borderRadius: IS_COMPACT ? 4 : 5,
  },
  sensorValue: {
    color: "#0a0a0a",
    fontSize: IS_COMPACT ? 23 : 26,
    fontWeight: "400",
  },
  sensorSeparator: {
    position: "absolute",
    right: 0,
    top: 10,
    width: 1,
    height: IS_COMPACT ? 62 : 72,
    backgroundColor: "#ececec",
  },

  plantsRoot: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  plantsScrollContent: {
    flexGrow: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT + 84,
    backgroundColor: BACKGROUND,
  },
  plantsHeaderArea: {
    backgroundColor: "#ffffff",
    paddingHorizontal: IS_COMPACT ? 18 : 34,
    paddingTop: IS_COMPACT ? 22 : 36,
    paddingBottom: IS_COMPACT ? 18 : 20,
  },
  plantsTitle: {
    color: TEXT,
    fontSize: IS_COMPACT ? 24 : 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: IS_COMPACT ? 10 : 16,
    letterSpacing: -0.7,
  },
  searchBar: {
    height: IS_COMPACT ? 28 : 54,
    borderRadius: 28,
    backgroundColor: "#f3f3f3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: IS_COMPACT ? 10 : 18,
    gap: IS_COMPACT ? 6 : 12,
  },
  searchIcon: {
    color: "#444444",
    fontSize: IS_COMPACT ? 17 : 34,
    lineHeight: IS_COMPACT ? 18 : 36,
  },
  searchPlaceholder: {
    color: "#555555",
    fontSize: IS_COMPACT ? 9 : 21,
    flex: 1,
  },
  categoryArea: {
    paddingVertical: IS_COMPACT ? 14 : 42,
    backgroundColor: BACKGROUND,
  },
  categoryScroll: {
    paddingHorizontal: IS_COMPACT ? 12 : 20,
    gap: IS_COMPACT ? 10 : 18,
  },
  categoryPill: {
    backgroundColor: "#2fa36f",
    borderRadius: 28,
    paddingHorizontal: IS_COMPACT ? 18 : 28,
    height: IS_COMPACT ? 34 : 72,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 15 : 30,
  },
  listContent: {
    paddingHorizontal: IS_COMPACT ? 6 : 26,
    paddingBottom: 34,
  },
  plantListItem: {
    minHeight: IS_COMPACT ? 52 : 118,
    borderRadius: IS_COMPACT ? 5 : 18,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    marginBottom: IS_COMPACT ? 5 : 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
  plantListItemSelected: {
    backgroundColor: "#e8f5ee",
    borderColor: "#2fa36f",
  },
  plantListImage: {
    width: IS_COMPACT ? 82 : 296,
    height: IS_COMPACT ? 52 : 118,
  },
  plantListInfo: {
    flex: 1,
    paddingHorizontal: IS_COMPACT ? 5 : 26,
    paddingVertical: IS_COMPACT ? 3 : 8,
    justifyContent: "center",
  },
  plantListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  plantListTitle: {
    flex: 1,
    color: TEXT,
    fontSize: IS_COMPACT ? 14 : 30,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  plantListActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: IS_COMPACT ? 7 : 20,
  },
  listActionIcon: {
    color: "#383838",
    fontSize: IS_COMPACT ? 14 : 34,
    fontWeight: "800",
  },
  listSpeciesPill: {
    alignSelf: "flex-start",
    backgroundColor: GREEN,
    borderRadius: 24,
    paddingHorizontal: IS_COMPACT ? 5 : 12,
    paddingVertical: IS_COMPACT ? 1 : 4,
    marginTop: IS_COMPACT ? 2 : 8,
    maxWidth: "72%",
  },
  listSpeciesText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 10 : 22,
  },
  listHealthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: IS_COMPACT ? 4 : 10,
    marginTop: IS_COMPACT ? 2 : 8,
    marginLeft: IS_COMPACT ? 3 : 18,
  },
  listHealthDot: {
    width: IS_COMPACT ? 5 : 16,
    height: IS_COMPACT ? 5 : 16,
    borderRadius: IS_COMPACT ? 2.5 : 8,
    backgroundColor: "#47b466",
  },
  listHealthText: {
    color: "#47aa60",
    fontSize: IS_COMPACT ? 10 : 25,
  },
  emptyHint: {
    color: "#7d7d7d",
    textAlign: "center",
    fontSize: IS_COMPACT ? 12 : 18,
    marginTop: IS_COMPACT ? 18 : 28,
    lineHeight: IS_COMPACT ? 16 : 24,
  },
  scrollTopButton: {
    position: "absolute",
    bottom: BOTTOM_NAV_HEIGHT + (IS_COMPACT ? 16 : 24),
    alignSelf: "center",
    width: IS_COMPACT ? 22 : 54,
    height: IS_COMPACT ? 22 : 54,
    borderRadius: IS_COMPACT ? 11 : 27,
    backgroundColor: "rgba(180,180,180,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollTopIcon: {
    color: "#676767",
    fontSize: IS_COMPACT ? 19 : 42,
    lineHeight: IS_COMPACT ? 22 : 46,
  },
  addPlantButton: {
    position: "absolute",
    right: IS_COMPACT ? 18 : 28,
    bottom: BOTTOM_NAV_HEIGHT + (IS_COMPACT ? 18 : 26),
    width: IS_COMPACT ? 42 : 110,
    height: IS_COMPACT ? 42 : 110,
    borderRadius: IS_COMPACT ? 21 : 55,
    backgroundColor: "#2fa36f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  addPlantIcon: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 42 : 92,
    lineHeight: IS_COMPACT ? 44 : 96,
    fontWeight: "600",
  },

  detailSheet: {
    marginHorizontal: CONTENT_PADDING + 4,
    marginTop: IS_COMPACT ? 62 : 74,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: IS_COMPACT ? 18 : 24,
    paddingTop: 12,
    paddingBottom: 34,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 2,
  },
  detailHandle: {
    alignSelf: "center",
    width: IS_COMPACT ? 28 : 34,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#cfcfcf",
    marginBottom: 6,
  },
  detailTitle: {
    color: TEXT,
    fontSize: IS_COMPACT ? 26 : 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginTop: 8,
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: IS_COMPACT ? 12 : 16,
    justifyContent: "space-between",
  },
  detailMetricCard: {
    width: "47.5%",
    minHeight: IS_COMPACT ? 132 : 150,
    borderRadius: 8,
    backgroundColor: "#f9f9f8",
    paddingHorizontal: IS_COMPACT ? 8 : 10,
    paddingVertical: 8,
    position: "relative",
  },
  detailMetricHeader: {
    minHeight: IS_COMPACT ? 28 : 32,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
  },
  detailMetricTitle: {
    flex: 1,
    color: "#111111",
    fontSize: IS_COMPACT ? 13 : 15,
    lineHeight: IS_COMPACT ? 16 : 18,
  },
  detailMetricIcon: {
    fontSize: IS_COMPACT ? 18 : 20,
    lineHeight: IS_COMPACT ? 20 : 22,
  },
  detailMetricBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },
  detailMetricValue: {
    color: "#47aa60",
    fontSize: IS_COMPACT ? 40 : 46,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  detailMetricValueCompact: {
    color: TEXT,
    fontSize: IS_COMPACT ? 19 : 22,
    lineHeight: IS_COMPACT ? 24 : 27,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  detailMetricUnit: {
    color: "#3f3f3f",
    fontSize: IS_COMPACT ? 11 : 12,
    textAlign: "center",
  },
  detailMetricDescription: {
    color: "#4f4f4f",
    fontSize: IS_COMPACT ? 10 : 11,
    lineHeight: IS_COMPACT ? 12 : 13,
    marginTop: 4,
    textAlign: "center",
  },
  detailChevron: {
    position: "absolute",
    right: 8,
    bottom: 4,
    color: "#333333",
    fontSize: 22,
    lineHeight: 22,
  },

  addScreenRoot: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  addScreenScroll: {
    flex: 1,
  },
  addScreenContent: {
    paddingHorizontal: IS_COMPACT ? 28 : 34,
    paddingTop: IS_COMPACT ? 104 : 118,
    paddingBottom: 220,
    alignItems: "center",
  },
  addBackButton: {
    position: "absolute",
    top: IS_COMPACT ? 54 : 62,
    left: IS_COMPACT ? 18 : 28,
    zIndex: 2,
    width: IS_COMPACT ? 48 : 58,
    height: IS_COMPACT ? 48 : 58,
    borderRadius: IS_COMPACT ? 24 : 29,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
  },
  addBackIcon: {
    color: "#6c6c6c",
    fontSize: IS_COMPACT ? 48 : 56,
    lineHeight: IS_COMPACT ? 48 : 56,
    marginTop: -4,
  },
  seedlingIcon: {
    color: "#151515",
    fontSize: IS_COMPACT ? 70 : 82,
    lineHeight: IS_COMPACT ? 76 : 88,
    marginBottom: IS_COMPACT ? 14 : 18,
    transform: [{ rotate: "28deg" }],
  },
  addQuestion: {
    color: "#000000",
    fontSize: IS_COMPACT ? 34 : 42,
    lineHeight: IS_COMPACT ? 42 : 50,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
    marginTop: IS_COMPACT ? 8 : 14,
    marginBottom: IS_COMPACT ? 20 : 26,
  },
  addDescription: {
    color: "#4b4b4b",
    fontSize: IS_COMPACT ? 22 : 26,
    lineHeight: IS_COMPACT ? 30 : 35,
    textAlign: "center",
    marginBottom: IS_COMPACT ? 28 : 36,
  },
  addInput: {
    width: "100%",
    height: IS_COMPACT ? 62 : 74,
    borderRadius: IS_COMPACT ? 31 : 37,
    backgroundColor: "#f4f4f4",
    paddingHorizontal: IS_COMPACT ? 24 : 30,
    color: TEXT,
    fontSize: IS_COMPACT ? 24 : 30,
    marginBottom: IS_COMPACT ? 42 : 58,
  },
  speciesGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: IS_COMPACT ? 28 : 34,
    marginBottom: IS_COMPACT ? 48 : 64,
  },
  speciesOption: {
    width: "46%",
    aspectRatio: 1,
    borderRadius: 26,
    backgroundColor: "#2fa36f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#2fa36f",
  },
  speciesOptionSelected: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },
  speciesOptionIcon: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 58 : 70,
    lineHeight: IS_COMPACT ? 64 : 76,
    marginBottom: 6,
  },
  speciesOptionText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 24 : 30,
    fontWeight: "800",
  },
  frequencyButton: {
    width: "100%",
    minHeight: IS_COMPACT ? 62 : 74,
    borderRadius: IS_COMPACT ? 31 : 37,
    backgroundColor: "#2fa36f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 22,
    opacity: 0.72,
  },
  frequencyButtonSelected: {
    opacity: 1,
  },
  lowFrequencyButton: {
    backgroundColor: "#bd3f40",
  },
  lowFrequencyButtonSelected: {
    opacity: 1,
  },
  frequencyButtonText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 22 : 27,
    fontWeight: "700",
    textAlign: "center",
  },
  deletePlantButton: {
    position: "absolute",
    left: IS_COMPACT ? 26 : 34,
    right: IS_COMPACT ? 26 : 34,
    bottom: IS_COMPACT ? 98 : 126,
    height: IS_COMPACT ? 58 : 72,
    borderRadius: IS_COMPACT ? 29 : 36,
    backgroundColor: "#bd3f40",
    alignItems: "center",
    justifyContent: "center",
  },
  deletePlantButtonText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 24 : 28,
    fontWeight: "700",
  },
  continueButton: {
    position: "absolute",
    left: IS_COMPACT ? 26 : 34,
    right: IS_COMPACT ? 26 : 34,
    bottom: IS_COMPACT ? 28 : 42,
    height: IS_COMPACT ? 58 : 72,
    borderRadius: IS_COMPACT ? 29 : 36,
    backgroundColor: "#2fa36f",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: IS_COMPACT ? 24 : 28,
    fontWeight: "700",
  },
  navButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  homeIconWrap: {
    width: IS_COMPACT ? 48 : 62,
    height: IS_COMPACT ? 48 : 62,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  homeIconRoof: {
    width: IS_COMPACT ? 31 : 40,
    height: IS_COMPACT ? 31 : 40,
    borderLeftWidth: IS_COMPACT ? 5 : 7,
    borderTopWidth: IS_COMPACT ? 5 : 7,
    borderColor: "#454545",
    transform: [{ rotate: "45deg" }],
    marginBottom: IS_COMPACT ? -18 : -24,
    backgroundColor: "#ffffff",
  },
  homeIconBody: {
    width: IS_COMPACT ? 38 : 48,
    height: IS_COMPACT ? 30 : 38,
    borderWidth: IS_COMPACT ? 5 : 7,
    borderTopWidth: 0,
    borderColor: "#454545",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  homeIconDoor: {
    width: IS_COMPACT ? 10 : 12,
    height: IS_COMPACT ? 15 : 20,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: "#454545",
    backgroundColor: "#ffffff",
  },
  homeIconDoorActive: {
    borderColor: "#ffffff",
  },
  plantIconWrap: {
    width: IS_COMPACT ? 58 : 74,
    height: IS_COMPACT ? 58 : 74,
    alignItems: "center",
    justifyContent: "center",
  },
  plantLeaf: {
    position: "absolute",
    width: IS_COMPACT ? 31 : 40,
    height: IS_COMPACT ? 31 : 40,
    borderRadius: IS_COMPACT ? 16 : 20,
    borderWidth: IS_COMPACT ? 5 : 7,
    borderColor: "#454545",
    backgroundColor: "#ffffff",
  },
  plantLeafTop: {
    top: IS_COMPACT ? 2 : 0,
    left: IS_COMPACT ? 14 : 17,
  },
  plantLeafLeft: {
    left: IS_COMPACT ? 3 : 5,
    top: IS_COMPACT ? 20 : 25,
  },
  plantLeafRight: {
    right: IS_COMPACT ? 3 : 5,
    top: IS_COMPACT ? 20 : 25,
  },
  plantStem: {
    position: "absolute",
    bottom: IS_COMPACT ? 4 : 2,
    width: IS_COMPACT ? 8 : 10,
    height: IS_COMPACT ? 26 : 34,
    borderRadius: 6,
    borderWidth: IS_COMPACT ? 4 : 5,
    borderColor: "#454545",
    backgroundColor: "#ffffff",
  },
  navShapeFilled: {
    backgroundColor: "#454545",
  },
});
