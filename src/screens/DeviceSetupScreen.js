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
import { registerDevice } from "../services/api";

const CATEGORIES = [
  { id: "All Devices", icon: "🌡️", label: "All Devices" },
  { id: "Home Automation", icon: "🏠", label: "Home Automation" },
  { id: "Supply Chain", icon: "🚚", label: "Supply Chain" },
  { id: "Medical", icon: "🏥", label: "Medical Assistance" },
  { id: "Environmental", icon: "🍃", label: "Environmental" },
  { id: "Logistics", icon: "📋", label: "Logistics" },
];

export default function DeviceSetupScreen({ navigation, route }) {
  const [deviceID, setDeviceID] = useState("");
  const [category, setCategory] = useState("All Devices");
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const user = route.params?.user;

  const validateInput = () => {
    if (!deviceID.trim()) {
      Alert.alert("Error", "Please enter a Device ID");
      return false;
    }
    return true;
  };

  const handleConnect = async () => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      await registerDevice(deviceID.trim(), category);
      navigation.replace("Dashboard", {
        user,
        deviceID: deviceID.trim(),
        category,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to connect device. Please try again.";
      Alert.alert("Connection Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.id === category);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Connect Device</Text>
          <Text style={styles.subtitle}>Enter your device ID & select category</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter Device ID"
              value={deviceID}
              onChangeText={setDeviceID}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategories(!showCategories)}
              disabled={loading}
            >
              <Text style={styles.categoryIcon}>{selectedCat?.icon}</Text>
              <Text style={styles.categoryText}>{selectedCat?.label}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      category === cat.id && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategories(false);
                    }}
                  >
                    <Text style={styles.categoryItemIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryItemText,
                        category === cat.id && styles.categoryItemTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Connect Device</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.replace("Dashboard", { user })}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categorySelector: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#666",
  },
  categoryList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryItemActive: {
    backgroundColor: "#2196F3",
  },
  categoryItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
  },
  categoryItemTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    marginTop: 25,
    padding: 10,
  },
  skipText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});