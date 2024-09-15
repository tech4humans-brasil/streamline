import assistant from "@services/assistant";

type AssistantFormHelp = {
  description: string;
};
export const getAssistantFormHelp = async (data : AssistantFormHelp) => {
  const res = await assistant.post("/assistant/form", data);

  return res.data.data;
};