import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setDeviceSettings, getDeviceSettings } from "../services/api";

const COLORS = {
  primary: "#2196F3",
  normal: "#4CAF50",
  alert: "#F44336",
  white: "#FFFFFF",
  background: "#F5F5F5",
  textDark: "#212121",
  textMedium: "#757575",
};

export default function SettingsScreen({ route, navigation }) {
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [loading, setLoading] = useState(false);

  const deviceID = route.params?.deviceID;

  const handleSave = async () => {
    const min = parseFloat(minTemp);
    const max = parseFloat(maxTemp);

    if (isNaN(min) || isNaN(max)) {
      Alert.alert("Error", "Please enter valid numbers");
      return;
    }
    if (min > max) {
      Alert.alert("Error", "Min temperature must be less than max");
      return;
    }

    setLoading(true);
    try {
      await setDeviceSettings(deviceID, min, max);
      Alert.alert("Success", "Temperature thresholds saved!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Temperature Settings</Text>
          <Text style={styles.subtitle}>Set alerts for {deviceID}</Text>

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Min Temperature (°C)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2"
                  value={minTemp}
                  onChangeText={setMinTemp}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Temperature (°C)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 8"
                  value={maxTemp}
                  onChangeText={setMaxTemp}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Alerts will be triggered when temperature goes below min or above max.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Save Settings</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.textMedium,
    marginBottom: 30,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 15,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.primary,
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMedium,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textMedium,
    fontSize: 16,
  },
});