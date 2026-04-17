import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { registerDevice } from "../services/api";

export default function DeviceSetupScreen({ navigation, route }) {
  const [deviceID, setDeviceID] = useState("");
  const [loading, setLoading] = useState(false);

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
      await registerDevice(deviceID.trim());
      navigation.replace("Dashboard", {
        user,
        deviceID: deviceID.trim(),
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Connect Device</Text>
        <Text style={styles.subtitle}>Enter your cold storage device ID</Text>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
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
    marginTop: 30,
    padding: 10,
  },
  skipText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});
