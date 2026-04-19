// import axios from "axios";

// const API_BASE_URL = "http://172.20.234.218:5000";

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export const login = async (email, password) => {
//   return api.post("/api/users/login", {
//     email: email.trim().toLowerCase(),
//     password: password,
//   });
// };

// export const registerDevice = async (deviceID) => {
//   return api.post("/api/devices/register", {
//     deviceID: deviceID,
//     sector: "default",
//   });
// };

// export const getSensorReadings = async (deviceID) => {
//   return api.get("/api/sensors/readings", {
//     params: { deviceID },
//   });r
// };

// export default api;

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "https://final-year-project-gsll.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
  const response = await api.post("/api/users/login", {
    email: email.trim().toLowerCase(),
    password: password,
  });
  // Save token after login
  const token = response.data.token;
  if (token) {
    await AsyncStorage.setItem("token", token);
  }
  return response;
};

export const registerDevice = async (deviceID, category) => {
  return api.post("/api/devices/register", {
    deviceID: deviceID,
    sector: category || "All Devices",
  });
};

export const setDeviceSettings = async (deviceID, minTemp, maxTemp) => {
  return api.put(`/api/devices/${deviceID}/settings`, { minTemp, maxTemp });
};

export const getDeviceSettings = async (deviceID) => {
  return api.get(`/api/devices/${deviceID}/settings`);
};

export const getSensorReadings = async (deviceID) => {
  return api.get("/api/sensors/readings", {
    params: { deviceID },
  });
};

export const getMyDevices = async () => {
  return api.get("/api/devices/my");
};

export const logout = async () => {
  await AsyncStorage.removeItem("token");
};

export default api;
