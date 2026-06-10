import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlantDashboard } from '../hooks/usePlantDashboard';
import type { SensorReading } from '../types/plant';

const GREEN = '#2d624a';
const MINT = '#33b884';
const BACKGROUND = '#eeeeec';
const TEXT = '#282828';

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
      <Text style={styles.plantName}>{name}</Text>
      <View style={styles.divider} />
      <View style={styles.speciesPill}>
        <Text style={styles.speciesText}>⚚ {species}</Text>
      </View>
      <Text style={styles.updatedText}>◷ Atualizado há {updatedMinutes} min</Text>
      <View style={styles.toggleRow}>
        <View>
          <WaterToggle isEnabled={automaticWatering} onPress={onToggle} />
          <Text style={styles.toggleLabel}>Rega Automática</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
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

function BottomNav() {
  return (
    <View style={styles.bottomNav}>
      <Text style={styles.navIconActive}>⌂</Text>
      <Text style={styles.navIcon}>♣</Text>
    </View>
  );
}

export function HomeScreen() {
  const { plant, isLoading, toggleAutomaticWatering } = usePlantDashboard();

  return (
    <View style={styles.root}>
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
      <BottomNav />
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
    height: 292,
    backgroundColor: GREEN,
    paddingHorizontal: 40,
    paddingTop: 76,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  brandText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5
  },
  brandAccent: {
    color: MINT
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22
  },
  shield: {
    width: 58,
    height: 72,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shieldLeaf: {
    color: '#ffffff',
    fontSize: 34
  },
  menuDots: {
    color: '#ffffff',
    fontSize: 56,
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
    paddingHorizontal: 20,
    marginTop: -91
  },
  heroRow: {
    minHeight: 318,
    flexDirection: 'row',
    alignItems: 'center'
  },
  photoFrame: {
    width: 242,
    height: 242,
    borderRadius: 121,
    borderWidth: 24,
    borderColor: '#f7f7f5',
    overflow: 'hidden',
    marginLeft: -18,
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
    flex: 1,
    minHeight: 230,
    marginLeft: -2,
    marginRight: 0,
    paddingVertical: 24,
    paddingHorizontal: 20,
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
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  divider: {
    width: '88%',
    height: 1,
    backgroundColor: '#e8e8e8',
    marginVertical: 7
  },
  speciesPill: {
    borderRadius: 28,
    backgroundColor: GREEN,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14
  },
  speciesText: {
    color: '#ffffff',
    fontSize: 18
  },
  updatedText: {
    color: '#555555',
    fontSize: 18,
    marginBottom: 14
  },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  toggleTrack: {
    width: 104,
    height: 52,
    borderRadius: 30,
    backgroundColor: '#696969',
    padding: 5,
    justifyContent: 'center'
  },
  toggleTrackEnabled: {
    backgroundColor: '#1085da'
  },
  toggleThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9d9d9d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleThumbEnabled: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff'
  },
  toggleDrop: {
    fontSize: 26,
    opacity: 0.35
  },
  toggleDropEnabled: {
    opacity: 1
  },
  toggleLabel: {
    color: '#4d4d4d',
    fontSize: 19,
    marginTop: 3,
    textAlign: 'center'
  },
  settingsButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsIcon: {
    color: '#ffffff',
    fontSize: 31
  },
  loadingText: {
    marginTop: -10,
    marginBottom: 12,
    color: '#6c6c6c',
    textAlign: 'center'
  },
  statusCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
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
    fontSize: 33,
    fontWeight: '500'
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#47b466'
  },
  healthText: {
    color: '#47aa60',
    fontSize: 24
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
    fontSize: 43,
    height: 52,
    marginBottom: 4,
    textAlign: 'center'
  },
  sensorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  sensorDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  sensorValue: {
    color: '#0a0a0a',
    fontSize: 28,
    fontWeight: '400'
  },
  sensorSeparator: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 1,
    height: 72,
    backgroundColor: '#ececec'
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
