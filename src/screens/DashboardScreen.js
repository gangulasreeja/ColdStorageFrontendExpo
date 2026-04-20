import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMyDevices, getSensorReadings, getDeviceSettings, requestNewData, logout } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 60;
const GRAPH_HEIGHT = 150;

const COLORS = {
  primary: "#2196F3",
  primaryDark: "#1565C0",
  alert: "#F44336",
  alertBg: "#FFEBEE",
  normal: "#4CAF50",
  normalBg: "#E8F5E9",
  white: "#FFFFFF",
  background: "#F5F5F5",
  textDark: "#212121",
  textMedium: "#757575",
  textLight: "#BDBDBD",
  overlay: "rgba(0,0,0,0.5)",
  graphLine: "#2196F3",
  graphFill: "rgba(33, 150, 243, 0.2)",
  graphGrid: "#E0E0E0",
};

const CATEGORIES = [
  { id: "All Devices", icon: "🌡️", label: "All Devices" },
  { id: "Home Automation", icon: "🏠", label: "Home Automation" },
  { id: "Supply Chain", icon: "🚚", label: "Supply Chain" },
  { id: "Medical", icon: "🏥", label: "Medical" },
  { id: "Environmental", icon: "🍃", label: "Environmental" },
  { id: "Logistics", icon: "📋", label: "Logistics" },
];

const TEMP_THRESHOLD = 10;

export default function DashboardScreen({ route, navigation }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [readings, setReadings] = useState([]);
  const [deviceSettings, setDeviceSettings] = useState({ minTemp: null, maxTemp: null });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = route.params?.user || {};

  // Default thresholds
  const defaultMinTemp = 2;
  const defaultMaxTemp = 8;
  const minTemp = deviceSettings.minTemp ?? defaultMinTemp;
  const maxTemp = deviceSettings.maxTemp ?? defaultMaxTemp;

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await getMyDevices();
      setDevices(response.data.devices || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceData = async (deviceID) => {
    try {
      const [readingsRes, settingsRes] = await Promise.all([
        getSensorReadings(deviceID),
        getDeviceSettings(deviceID).catch(() => ({ data: {} })),
      ]);
      setReadings(readingsRes.data.items || []);
      setDeviceSettings({
        minTemp: settingsRes.data?.minTemp ?? null,
        maxTemp: settingsRes.data?.maxTemp ?? null,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load sensor data");
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceData(selectedDevice.deviceID);
    }
  }, [selectedDevice]);

  // Check for temperature alerts
  useEffect(() => {
    if (readings.length > 0 && readings[0]) {
      const temp = readings[0].temperature;
      if (temp != null && (temp < minTemp || temp > maxTemp)) {
        Alert.alert(
          "⚠️ Temperature Alert!",
          `Current: ${temp}°C (Required: ${minTemp}°C - ${maxTemp}°C)`,
          [{ text: "OK" }]
        );
      }
    }
  }, [readings, minTemp, maxTemp]);

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleBack = () => {
    setSelectedDevice(null);
    setReadings([]);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  const handleAddDevice = () => {
    setMenuOpen(false);
    navigation.navigate("DeviceSetup", { user });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "--";
    // If timestamp is a number like 2166, return as-is for now
    if (typeof ts === "number") return ts.toString();
    // Try to format if it's a date string
    try {
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    } catch (e) {}
    return String(ts);
  };

  const handleSettings = () => {
    navigation.navigate("Settings", { deviceID: selectedDevice?.deviceID });
  };

  const handleRefresh = async () => {
    if (!selectedDevice) return;
    
    try {
      const cmdRes = await requestNewData(selectedDevice.deviceID);
      const command = cmdRes.data.command;
      Alert.alert(
        "Request Sent!",
        `Command ID: ${command.commandID}\nStatus: ${command.status}`,
        [{ text: "OK" }]
      );
      // Fetch latest data after command
      fetchDeviceData(selectedDevice.deviceID);
    } catch (error) {
      Alert.alert("Error", "Failed to send request");
    }
  };

  const getDevicesByCategory = (categoryId) => {
    if (categoryId === "All Devices") return devices;
    return devices.filter((d) => d.sector === categoryId);
  };

  // Temperature Graph Component
  const TemperatureGraph = ({ data, minTemp, maxTemp }) => {
    const temps = data.slice(0, 20).reverse();
    if (temps.length === 0) {
      return (
        <View style={styles.graphContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const allTemps = temps.map(r => r.temperature);
    const minData = Math.min(...allTemps, minTemp) - 2;
    const maxData = Math.max(...allTemps, maxTemp) + 2;
    const range = maxData - minData || 1;
    const dataPoints = temps.map(r => r.temperature);

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>Temperature History</Text>
          <Text style={styles.graphCount}>{temps.length} readings</Text>
        </View>
        
        <View style={styles.graph}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{Math.round(maxData)}°</Text>
            <Text style={styles.yAxisLabel}>{(minData + maxData) / 2}°</Text>
            <Text style={styles.yAxisLabel}>{Math.round(minData)}°</Text>
          </View>
          
          <View style={styles.graphArea}>
            <View style={[styles.gridLine, { top: ((maxTemp - minData) / range) * GRAPH_HEIGHT }]} />
            <View style={[styles.gridLine, { top: ((minTemp - minData) / range) * GRAPH_HEIGHT }]} />
            
            <View style={styles.lineContainer}>
              {dataPoints.map((temp, index) => {
                if (temp == null) return null;
                const x = (index / (dataPoints.length - 1 || 1)) * (GRAPH_WIDTH - 40);
                const y = GRAPH_HEIGHT - ((temp - minData) / range) * GRAPH_HEIGHT;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dataPoint,
                      { left: x, top: y },
                      temp > maxTemp || temp < minTemp ? styles.dataPointAlert : styles.dataPointNormal,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.alert }]} />
            <Text style={styles.legendText}>Min: {minTemp}° Max: {maxTemp}°</Text>
          </View>
        </View>
      </View>
    );
  };

  // Device Detail View
  if (selectedDevice) {
    const currentReading = readings.length > 0 ? readings[0] : null;
    const temperature = currentReading?.temperature ?? "--";
    const timestamp = currentReading?.timestamp ?? "--";
    const isHighTemp = typeof temperature === "number" && temperature > maxTemp;
    const isLowTemp = typeof temperature === "number" && temperature < minTemp;
    const isNormal = !isHighTemp && !isLowTemp;

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedDevice.deviceID}</Text>
          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Temperature */}
<View style={[styles.tempCard, !isNormal && styles.tempCardAlert]}>
            <View style={[styles.statusBadge, { backgroundColor: isNormal ? COLORS.normalBg : COLORS.alertBg }]}>
              <Text style={[styles.statusText, { color: isNormal ? COLORS.normal : COLORS.alert }]}>
                {isHighTemp ? "HIGH" : isLowTemp ? "LOW" : "NORMAL"}
              </Text>
            </View>
            <Text style={styles.timestampText}>Updated: {formatTimestamp(timestamp)}</Text>
          </View>

          {/* Graph */}
          <TemperatureGraph data={readings} minTemp={minTemp} maxTemp={maxTemp} />

          {/* Request New Data Button */}
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>🔄 Request New Data</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.settingsButtonText}>⚙️ Temperature Settings</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Menu Modal */}
        <Modal visible={menuOpen} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setMenuOpen(false)}>
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>☰ Menu</Text>
                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addDeviceButton} onPress={handleAddDevice}>
                <Text style={styles.addDeviceText}>+ Add New Device</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Home View
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>TM</Text>
        </View>
        <Text style={styles.headerTitle}>Tiny Matrix</Text>
        <TouchableOpacity onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Device List */}
      <ScrollView style={styles.content}>
        {CATEGORIES.map((category) => {
          const categoryDevices = getDevicesByCategory(category.id);
          if (categoryDevices.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryCount}>{categoryDevices.length}</Text>
              </View>
              <FlatList
                data={categoryDevices}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceCard}
                    onPress={() => handleDeviceSelect(item)}
                  >
                    <Text style={styles.deviceID}>{item.deviceID}</Text>
                    <Text style={styles.deviceArrow}>›</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.deviceID}
                scrollEnabled={false}
              />
            </View>
          );
        })}

        {devices.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No devices registered</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddDevice}>
              <Text style={styles.emptyButtonText}>+ Add Device</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>☰ Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User Profile */}
            <View style={styles.userProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>TM</Text>
              </View>
              <Text style={styles.userName}>{user.name || "User"}</Text>
            </View>

            <Text style={styles.sectionLabel}>Sub Applications</Text>

            {CATEGORIES.map((cat) => {
              const catDevices = getDevicesByCategory(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.menuItem}
                  onPress={() => setMenuOpen(false)}
                >
                  <Text style={styles.menuItemIcon}>{cat.icon}</Text>
                  <Text style={styles.menuItemText}>{cat.label}</Text>
                  {catDevices.length > 0 && (
                    <Text style={styles.menuItemBadge}>{catDevices.length}</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addDeviceButton} onPress={handleAddDevice}>
              <Text style={styles.addDeviceText}>+ Add New Device</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  menuIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  
  // Content
  content: {
    flex: 1,
    padding: 15,
  },
  
  // Category
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    flex: 1,
  },
  categoryCount: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  deviceCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  deviceID: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  deviceArrow: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  
  // Temperature Card
  tempCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: "center",
  },
  tempCardAlert: {
    backgroundColor: COLORS.alert,
  },
  tempLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  tempValue: {
    fontSize: 56,
    fontWeight: "bold",
    color: COLORS.white,
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 8,
  },
  
  // Graph
  graphContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  graphCount: {
    fontSize: 12,
    color: COLORS.textMedium,
  },
  graph: {
    flexDirection: "row",
    height: GRAPH_HEIGHT,
  },
  yAxis: {
    width: 30,
    justifyContent: "space-between",
  },
  yAxisLabel: {
    fontSize: 10,
    color: COLORS.textMedium,
  },
  graphArea: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.graphGrid,
  },
  lineContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataPoint: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
  },
  dataPointNormal: {
    backgroundColor: COLORS.primary,
  },
  dataPointAlert: {
    backgroundColor: COLORS.alert,
  },
  xAxisLabel: {
    fontSize: 10,
    color: COLORS.textMedium,
    textAlign: "right",
    marginTop: 5,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMedium,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: "center",
    padding: 20,
  },
  
  // Buttons
  refreshButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  settingsButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  settingsButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Empty
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMedium,
    marginBottom: 15,
  },
  emptyButton: {
    backgroundColor: COLORS.normal,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Modal/Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textMedium,
  },
  
  // User Profile
  userProfile: {
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  
  // Section Label
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textMedium,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  
  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },
  menuItemBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  
  // Buttons
  addDeviceButton: {
    backgroundColor: COLORS.normal,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  addDeviceText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.alert,
    marginTop: 15,
  },
  logoutText: {
    color: COLORS.alert,
    fontSize: 16,
    fontWeight: "bold",
  },
});