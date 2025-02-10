import api from "@services/api";
import Response from "@interfaces/Response";

type TemplateResponse = Response<
  { id: string; name: string; created: string; modified: string }[]
>;

export const listClicksignTemplates = async (): Promise<TemplateResponse> => {
  const response = await api.get<TemplateResponse>("/clicksign/templates");
  return response.data;
};
