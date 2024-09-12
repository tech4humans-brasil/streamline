import axios from "axios";

const IAG_INFERENCE_URI = process.env.IAG_INFERENCE_URI;
const IAG_INFERENCE_API_KEY = process.env.IAG_INFERENCE_API_KEY;
const IAG_INFERENCE_MODEL = process.env.IAG_INFERENCE_MODEL;

if (!IAG_INFERENCE_URI || !IAG_INFERENCE_API_KEY || !IAG_INFERENCE_MODEL) {
  throw new Error(
    "IAG_INFERENCE_URI, IAG_INFERENCE_API_KEY, IAG_INFERENCE_MODEL are required"
  );
}

const model = axios.create({
  baseURL: IAG_INFERENCE_URI,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": IAG_INFERENCE_API_KEY,
  },
});

export const baseBody = {
  max_tokens: 400,
  temperature: 0.7,
  top_p: 0.85,
  top_k: 50,
  model: IAG_INFERENCE_MODEL,
};

const llm = {
  model,
  baseBody,
};

export default llm;
