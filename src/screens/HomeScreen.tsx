import { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlantDashboard } from '../hooks/usePlantDashboard';
import type { PlantDashboard, SensorReading } from '../types/plant';

const GREEN = '#2d624a';
const MINT = '#33b884';
const BACKGROUND = '#eeeeec';
const TEXT = '#282828';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_COMPACT = SCREEN_WIDTH < 390;
const CONTENT_PADDING = IS_COMPACT ? 14 : 20;
const PHOTO_SIZE = Math.min(206, Math.max(158, SCREEN_WIDTH * 0.44));
const PHOTO_BORDER = IS_COMPACT ? 13 : 18;
const PLANT_CARD_WIDTH = IS_COMPACT
  ? Math.min(184, Math.max(174, SCREEN_WIDTH * 0.48))
  : Math.min(218, Math.max(198, SCREEN_WIDTH * 0.53));
const HEADER_HEIGHT = IS_COMPACT ? 250 : 266;
type TabName = 'home' | 'plants';

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

function WaterToggle({ isEnabled, onPress }: { isEnabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isEnabled }}
      onPress={onPress}
      style={[styles.toggleTrack, isEnabled && styles.toggleTrackEnabled]}
    >
      <View style={[styles.toggleThumb, isEnabled && styles.toggleThumbEnabled]}>
        <Text style={[styles.toggleDrop, isEnabled && styles.toggleDropEnabled]}>💧</Text>
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
  onToggle
}: {
  name: string;
  species: string;
  updatedMinutes: number;
  automaticWatering: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.plantCard}>
      <Text style={styles.plantName} numberOfLines={1}>{name}</Text>
      <View style={styles.divider} />
      <View style={styles.speciesPill}>
        <Text style={styles.speciesText} numberOfLines={1}>⚚ {species}</Text>
      </View>
      <Text style={styles.updatedText} numberOfLines={1}>◷ Atualizado há {updatedMinutes} min</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          <WaterToggle isEnabled={automaticWatering} onPress={onToggle} />
          <Text style={styles.toggleLabel} numberOfLines={1}>Rega Automática</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.settingsButton}>
          <GearIcon />
        </Pressable>
      </View>
    </View>
  );
}

function SensorItem({ sensor, isLast }: { sensor: SensorReading; isLast: boolean }) {
  const dotColor = sensor.status === 'warning' ? '#d99a00' : '#69bd70';

  return (
    <View style={styles.sensorSlot}>
      <Text style={[styles.sensorIcon, { color: sensor.color }]}>{sensor.icon}</Text>
      <View style={styles.sensorValueRow}>
        <View style={[styles.sensorDot, { backgroundColor: dotColor }]} />
        <Text style={styles.sensorValue}>{sensor.value}</Text>
      </View>
      {!isLast && <View style={styles.sensorSeparator} />}
    </View>
  );
}

function StatusCard({ sensors, healthLabel }: { sensors: SensorReading[]; healthLabel: string }) {
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
          <SensorItem key={sensor.label} sensor={sensor} isLast={index === sensors.length - 1} />
        ))}
      </View>
    </View>
  );
}

function BottomNav({ activeTab, onChangeTab }: { activeTab: TabName; onChangeTab: (tab: TabName) => void }) {
  return (
    <View style={styles.bottomNav}>
      <Pressable accessibilityRole="button" onPress={() => onChangeTab('home')} style={styles.navButton}>
        <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>⌂</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onChangeTab('plants')} style={styles.navButton}>
        <Text style={[styles.navIcon, activeTab === 'plants' && styles.navIconActive]}>
          {activeTab === 'plants' ? '♣' : '♧'}
        </Text>
      </Pressable>
    </View>
  );
}

function DashboardContent({
  plant,
  isLoading,
  toggleAutomaticWatering
}: {
  plant: PlantDashboard;
  isLoading: boolean;
  toggleAutomaticWatering: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
      <BrandHeader />
      <View style={styles.heroCurve} />
      <View style={styles.contentArea}>
        <View style={styles.heroRow}>
          <View style={styles.photoFrame}>
            <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
            <View style={styles.photoOverlay} />
          </View>
          <PlantCard
            name={plant.name}
            species={plant.species}
            updatedMinutes={plant.lastUpdatedMinutes}
            automaticWatering={plant.automaticWatering}
            onToggle={toggleAutomaticWatering}
          />
        </View>
        {isLoading && <Text style={styles.loadingText}>Sincronizando com o Supabase...</Text>}
        <StatusCard sensors={plant.sensors} healthLabel={plant.healthLabel} />
      </View>
    </ScrollView>
  );
}

function CategoryPill({ label }: { label: string }) {
  return (
    <View style={styles.categoryPill}>
      <Text style={styles.categoryText}>{label}</Text>
    </View>
  );
}

function PlantListItem({ plant }: { plant: PlantDashboard }) {
  return (
    <View style={styles.plantListItem}>
      <Image source={{ uri: plant.imageUrl }} style={styles.plantListImage} resizeMode="cover" />
      <View style={styles.plantListInfo}>
        <View style={styles.plantListHeader}>
          <Text style={styles.plantListTitle} numberOfLines={1}>{plant.name}</Text>
          <View style={styles.plantListActions}>
            <Text style={styles.listActionIcon}>ⓘ</Text>
            <Text style={styles.listActionIcon}>✎</Text>
          </View>
        </View>
        <View style={styles.listSpeciesPill}>
          <Text style={styles.listSpeciesText} numberOfLines={1}>⚚ {plant.species}</Text>
        </View>
        <View style={styles.listHealthRow}>
          <View style={styles.listHealthDot} />
          <Text style={styles.listHealthText}>{plant.healthLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function PlantsContent({ plants }: { plants: PlantDashboard[] }) {
  return (
    <View style={styles.plantsRoot}>
      <ScrollView contentContainerStyle={styles.plantsScrollContent} bounces={false}>
        <BrandHeader />
        <View style={styles.plantsHeaderArea}>
          <Text style={styles.plantsTitle}>Suas Plantas</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <Text style={styles.searchPlaceholder}>Buscar uma planta registrada no app</Text>
          </View>
        </View>
        <View style={styles.categoryArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
            <CategoryPill label="Categoria" />
          </ScrollView>
        </View>
        <View style={styles.listContent}>
          {plants.map((plant) => (
            <PlantListItem key={plant.id} plant={plant} />
          ))}
          <Text style={styles.emptyHint}>As plantas que você registra{'\n'}aparecem aqui</Text>
        </View>
      </ScrollView>
      <Pressable accessibilityRole="button" style={styles.scrollTopButton}>
        <Text style={styles.scrollTopIcon}>⌃</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.addPlantButton}>
        <Text style={styles.addPlantIcon}>+</Text>
      </Pressable>
    </View>
  );
}

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const { plant, plants, isLoading, toggleAutomaticWatering } = usePlantDashboard();

  return (
    <View style={styles.root}>
      {activeTab === 'home' ? (
        <DashboardContent
          plant={plant}
          isLoading={isLoading}
          toggleAutomaticWatering={toggleAutomaticWatering}
        />
      ) : (
        <PlantsContent plants={plants} />
      )}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND
  },
  scrollContent: {
    minHeight: '100%',
    paddingBottom: 126,
    backgroundColor: BACKGROUND
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: GREEN,
    paddingHorizontal: IS_COMPACT ? 32 : 40,
    paddingTop: IS_COMPACT ? 42 : 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  brandText: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 35 : 40,
    fontWeight: '800',
    letterSpacing: -1.5
  },
  brandAccent: {
    color: MINT
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_COMPACT ? 16 : 22
  },
  shield: {
    width: IS_COMPACT ? 54 : 58,
    height: IS_COMPACT ? 62 : 72,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shieldLeaf: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 30 : 34
  },
  menuDots: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 52 : 56,
    lineHeight: 60,
    marginTop: -8
  },
  heroCurve: {
    height: 18,
    marginTop: -18,
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44
  },
  contentArea: {
    paddingHorizontal: CONTENT_PADDING,
    marginTop: -(PHOTO_SIZE * 0.25)
  },
  heroRow: {
    minHeight: PHOTO_SIZE + (IS_COMPACT ? 112 : 108),
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  photoFrame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: PHOTO_BORDER,
    borderColor: '#f7f7f5',
    overflow: 'hidden',
    marginLeft: -CONTENT_PADDING,
    backgroundColor: '#ffffff'
  },
  plantImage: {
    width: '100%',
    height: '100%'
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)'
  },
  plantCard: {
    width: PLANT_CARD_WIDTH,
    minHeight: IS_COMPACT ? 148 : 206,
    marginLeft: IS_COMPACT ? 8 : -8,
    marginRight: 0,
    marginTop: PHOTO_SIZE * (IS_COMPACT ? 0.44 : 0.5),
    paddingVertical: IS_COMPACT ? 11 : 22,
    paddingHorizontal: IS_COMPACT ? 12 : 18,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  plantName: {
    color: TEXT,
    fontSize: IS_COMPACT ? 22 : 28,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  divider: {
    width: '88%',
    height: 1,
    backgroundColor: '#e8e8e8',
    marginVertical: IS_COMPACT ? 4 : 7
  },
  speciesPill: {
    borderRadius: 28,
    backgroundColor: GREEN,
    paddingHorizontal: IS_COMPACT ? 11 : 14,
    paddingVertical: IS_COMPACT ? 3 : 5,
    marginBottom: IS_COMPACT ? 8 : 14
  },
  speciesText: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 14 : 18
  },
  updatedText: {
    color: '#555555',
    width: '100%',
    fontSize: IS_COMPACT ? 12 : 17,
    marginBottom: IS_COMPACT ? 8 : 14,
    textAlign: 'center'
  },
  toggleGroup: {
    width: IS_COMPACT ? 106 : 130,
    alignItems: 'center'
  },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  toggleTrack: {
    width: IS_COMPACT ? 74 : 98,
    height: IS_COMPACT ? 36 : 50,
    borderRadius: 30,
    backgroundColor: '#696969',
    padding: 5,
    justifyContent: 'center'
  },
  toggleTrackEnabled: {
    backgroundColor: '#1085da'
  },
  toggleThumb: {
    width: IS_COMPACT ? 26 : 40,
    height: IS_COMPACT ? 26 : 40,
    borderRadius: IS_COMPACT ? 13 : 20,
    backgroundColor: '#9d9d9d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleThumbEnabled: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff'
  },
  toggleDrop: {
    fontSize: IS_COMPACT ? 16 : 24,
    opacity: 0.35
  },
  toggleDropEnabled: {
    opacity: 1
  },
  toggleLabel: {
    color: '#4d4d4d',
    fontSize: IS_COMPACT ? 12 : 18,
    marginTop: 3,
    textAlign: 'center'
  },
  settingsButton: {
    width: IS_COMPACT ? 36 : 52,
    height: IS_COMPACT ? 36 : 52,
    borderRadius: IS_COMPACT ? 18 : 26,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gearIcon: {
    width: IS_COMPACT ? 20 : 28,
    height: IS_COMPACT ? 20 : 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gearRing: {
    width: IS_COMPACT ? 15 : 22,
    height: IS_COMPACT ? 15 : 22,
    borderRadius: IS_COMPACT ? 7.5 : 11,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  gearCenter: {
    position: 'absolute',
    width: IS_COMPACT ? 4 : 7,
    height: IS_COMPACT ? 4 : 7,
    borderRadius: IS_COMPACT ? 2 : 3.5,
    backgroundColor: '#ffffff'
  },
  gearSpoke: {
    position: 'absolute',
    width: 3,
    height: IS_COMPACT ? 20 : 28,
    borderRadius: 2,
    backgroundColor: '#ffffff'
  },
  gearSpokeVertical: {},
  gearSpokeHorizontal: {
    transform: [{ rotate: '90deg' }]
  },
  gearSpokeDiagonalRight: {
    transform: [{ rotate: '45deg' }]
  },
  gearSpokeDiagonalLeft: {
    transform: [{ rotate: '-45deg' }]
  },
  loadingText: {
    marginTop: -10,
    marginBottom: 12,
    color: '#6c6c6c',
    textAlign: 'center'
  },
  statusCard: {
    marginHorizontal: CONTENT_PADDING,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    paddingHorizontal: IS_COMPACT ? 16 : 24,
    paddingTop: 14,
    paddingBottom: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statusTitle: {
    color: '#000000',
    fontSize: IS_COMPACT ? 30 : 33,
    fontWeight: '500'
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  healthDot: {
    width: IS_COMPACT ? 8 : 10,
    height: IS_COMPACT ? 8 : 10,
    borderRadius: IS_COMPACT ? 4 : 5,
    backgroundColor: '#47b466'
  },
  healthText: {
    color: '#47aa60',
    fontSize: IS_COMPACT ? 22 : 24
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginBottom: 12
  },
  sensorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sensorSlot: {
    flex: 1,
    alignItems: 'center',
    position: 'relative'
  },
  sensorIcon: {
    fontSize: IS_COMPACT ? 34 : 40,
    height: IS_COMPACT ? 44 : 50,
    marginBottom: 4,
    textAlign: 'center'
  },
  sensorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_COMPACT ? 4 : 6
  },
  sensorDot: {
    width: IS_COMPACT ? 8 : 10,
    height: IS_COMPACT ? 8 : 10,
    borderRadius: IS_COMPACT ? 4 : 5
  },
  sensorValue: {
    color: '#0a0a0a',
    fontSize: IS_COMPACT ? 23 : 26,
    fontWeight: '400'
  },
  sensorSeparator: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 1,
    height: IS_COMPACT ? 62 : 72,
    backgroundColor: '#ececec'
  },

  plantsRoot: {
    flex: 1,
    backgroundColor: BACKGROUND
  },
  plantsScrollContent: {
    paddingBottom: 132,
    backgroundColor: BACKGROUND
  },
  plantsHeaderArea: {
    backgroundColor: '#ffffff',
    paddingHorizontal: IS_COMPACT ? 18 : 34,
    paddingTop: IS_COMPACT ? 22 : 36,
    paddingBottom: IS_COMPACT ? 18 : 20
  },
  plantsTitle: {
    color: TEXT,
    fontSize: IS_COMPACT ? 24 : 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: IS_COMPACT ? 10 : 16,
    letterSpacing: -0.7
  },
  searchBar: {
    height: IS_COMPACT ? 28 : 54,
    borderRadius: 28,
    backgroundColor: '#f3f3f3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_COMPACT ? 10 : 18,
    gap: IS_COMPACT ? 6 : 12
  },
  searchIcon: {
    color: '#444444',
    fontSize: IS_COMPACT ? 17 : 34,
    lineHeight: IS_COMPACT ? 18 : 36
  },
  searchPlaceholder: {
    color: '#555555',
    fontSize: IS_COMPACT ? 9 : 21,
    flex: 1
  },
  categoryArea: {
    paddingVertical: IS_COMPACT ? 14 : 42,
    backgroundColor: BACKGROUND
  },
  categoryScroll: {
    paddingHorizontal: IS_COMPACT ? 12 : 20,
    gap: IS_COMPACT ? 10 : 18
  },
  categoryPill: {
    backgroundColor: '#2fa36f',
    borderRadius: 28,
    paddingHorizontal: IS_COMPACT ? 18 : 28,
    height: IS_COMPACT ? 34 : 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryText: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 15 : 30
  },
  listContent: {
    paddingHorizontal: IS_COMPACT ? 6 : 26,
    paddingBottom: 34
  },
  plantListItem: {
    minHeight: IS_COMPACT ? 52 : 118,
    borderRadius: IS_COMPACT ? 5 : 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    marginBottom: IS_COMPACT ? 5 : 22
  },
  plantListImage: {
    width: IS_COMPACT ? 82 : 296,
    height: IS_COMPACT ? 52 : 118
  },
  plantListInfo: {
    flex: 1,
    paddingHorizontal: IS_COMPACT ? 5 : 26,
    paddingVertical: IS_COMPACT ? 3 : 8,
    justifyContent: 'center'
  },
  plantListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  plantListTitle: {
    flex: 1,
    color: TEXT,
    fontSize: IS_COMPACT ? 14 : 30,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  plantListActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_COMPACT ? 7 : 20
  },
  listActionIcon: {
    color: '#383838',
    fontSize: IS_COMPACT ? 14 : 34,
    fontWeight: '800'
  },
  listSpeciesPill: {
    alignSelf: 'flex-start',
    backgroundColor: GREEN,
    borderRadius: 24,
    paddingHorizontal: IS_COMPACT ? 5 : 12,
    paddingVertical: IS_COMPACT ? 1 : 4,
    marginTop: IS_COMPACT ? 2 : 8,
    maxWidth: '72%'
  },
  listSpeciesText: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 10 : 22
  },
  listHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_COMPACT ? 4 : 10,
    marginTop: IS_COMPACT ? 2 : 8,
    marginLeft: IS_COMPACT ? 3 : 18
  },
  listHealthDot: {
    width: IS_COMPACT ? 5 : 16,
    height: IS_COMPACT ? 5 : 16,
    borderRadius: IS_COMPACT ? 2.5 : 8,
    backgroundColor: '#47b466'
  },
  listHealthText: {
    color: '#47aa60',
    fontSize: IS_COMPACT ? 10 : 25
  },
  emptyHint: {
    color: '#7d7d7d',
    textAlign: 'center',
    fontSize: IS_COMPACT ? 12 : 18,
    marginTop: IS_COMPACT ? 18 : 28,
    lineHeight: IS_COMPACT ? 16 : 24
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: IS_COMPACT ? 56 : 106,
    alignSelf: 'center',
    width: IS_COMPACT ? 22 : 54,
    height: IS_COMPACT ? 22 : 54,
    borderRadius: IS_COMPACT ? 11 : 27,
    backgroundColor: 'rgba(180,180,180,0.48)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollTopIcon: {
    color: '#676767',
    fontSize: IS_COMPACT ? 19 : 42,
    lineHeight: IS_COMPACT ? 22 : 46
  },
  addPlantButton: {
    position: 'absolute',
    right: IS_COMPACT ? 14 : 28,
    bottom: IS_COMPACT ? 54 : 112,
    width: IS_COMPACT ? 42 : 110,
    height: IS_COMPACT ? 42 : 110,
    borderRadius: IS_COMPACT ? 21 : 55,
    backgroundColor: '#2fa36f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7
  },
  addPlantIcon: {
    color: '#ffffff',
    fontSize: IS_COMPACT ? 42 : 92,
    lineHeight: IS_COMPACT ? 44 : 96,
    fontWeight: '600'
  },
  navButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  navIconActive: {
    color: '#454545',
    fontSize: 62,
    fontWeight: '800'
  },
  navIcon: {
    color: '#454545',
    fontSize: 58,
    fontWeight: '800'
  }
});
