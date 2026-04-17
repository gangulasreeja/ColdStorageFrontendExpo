import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getSensorReadings } from "../services/api";

const COLORS = {
  primary: "#2196F3",
  alert: "#F44336",
  alertBg: "#FFEBEE",
  normal: "#4CAF50",
  normalBg: "#E8F5E9",
  white: "#FFFFFF",
  background: "#F5F5F5",
  textDark: "#212121",
  textMedium: "#757575",
};

const TEMP_THRESHOLD = 10;

export default function DashboardScreen({ route, navigation }) {
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = route.params?.user || {};
  const deviceID = route.params?.deviceID;

  const fetchSensorData = useCallback(async () => {
    if (!deviceID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getSensorReadings(deviceID);
      setReadings(response.data.items || []);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load sensor data");
    } finally {
      setLoading(false);
    }
  }, [deviceID]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  useEffect(() => {
    const isHighTemp =
      readings.length > 0 &&
      typeof readings[0]?.temperature === "number" &&
      readings[0].temperature > TEMP_THRESHOLD;

    if (!loading && isHighTemp) {
      Alert.alert(
        "⚠️ Temperature Alert!",
        `Current temperature is ${readings[0].temperature}°C which exceeds the threshold of ${TEMP_THRESHOLD}°C.\n\nDevice: ${deviceID}`,
        [{ text: "OK" }],
      );
    }
  }, [loading, readings]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => navigation.replace("Login"),
      },
    ]);
  };

  const currentReading = readings.length > 0 ? readings[0] : null;
  const temperature = currentReading?.temperature ?? "--";
  const timestamp = currentReading?.timestamp ?? "--";
  const isHighTemp =
    typeof temperature === "number" && temperature > TEMP_THRESHOLD;
  const status = isHighTemp ? "ALERT" : "NORMAL";
  const statusColor = isHighTemp ? COLORS.alert : COLORS.normal;
  const statusBg = isHighTemp ? COLORS.alertBg : COLORS.normalBg;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cold Storage</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.headerLogout}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sensor data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cold Storage</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {user.name || "User"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.headerLogout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Device ID</Text>
          <Text style={styles.deviceValue}>{deviceID || "Not connected"}</Text>
        </View>

        <View style={[styles.tempCard, isHighTemp && styles.tempCardAlert]}>
          <Text style={styles.tempLabel}>Current Temperature</Text>
          <Text style={[styles.tempValue, isHighTemp && styles.tempValueAlert]}>
            {temperature}°C
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
          <Text style={styles.timestampText}>Updated: {timestamp}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{readings.length}</Text>
            <Text style={styles.statLabel}>Readings</Text>
          </View>
          <View
            style={[styles.statCard, alerts.length > 0 && styles.statCardAlert]}
          >
            <Text
              style={[
                styles.statValue,
                alerts.length > 0 && styles.statValueAlert,
              ]}
            >
              {alerts.length}
            </Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>
              Active Alerts ({alerts.length})
            </Text>
            {alerts.map((alert, index) => (
              <View key={index} style={styles.alertCard}>
                <Text style={styles.alertType}>{alert.type}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchSensorData}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  headerLogout: { color: COLORS.white, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textMedium },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    elevation: 3,
  },
  cardLabel: { fontSize: 14, color: COLORS.textMedium, marginBottom: 4 },
  deviceValue: { fontSize: 18, fontWeight: "bold", color: COLORS.textDark },
  tempCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    elevation: 6,
  },
  tempCardAlert: { backgroundColor: COLORS.alert },
  tempLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
  tempValue: {
    fontSize: 72,
    fontWeight: "bold",
    color: COLORS.white,
    marginVertical: 12,
  },
  tempValueAlert: { color: COLORS.white },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: "bold" },
  timestampText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 12,
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
  },
  statCardAlert: { backgroundColor: COLORS.alertBg },
  statValue: { fontSize: 32, fontWeight: "bold", color: COLORS.textDark },
  statValueAlert: { color: COLORS.alert },
  statLabel: { fontSize: 14, color: COLORS.textMedium, marginTop: 4 },
  alertsSection: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.alert,
    elevation: 2,
  },
  alertType: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  alertMessage: { fontSize: 14, color: COLORS.textMedium },
  refreshButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  refreshButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
});
