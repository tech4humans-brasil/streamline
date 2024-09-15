import axios from "axios";

const BASE_URL = import.meta.env.VITE_ASSISTANT_URL ?? "http://localhost:7071/api";

const assistant = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default assistant;
