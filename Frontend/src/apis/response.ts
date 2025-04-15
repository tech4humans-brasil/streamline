
import api from "@services/api";
import Response from "@interfaces/Response";
import IForm from "@interfaces/Form";
import IUser from "@interfaces/User";
import { FileUploaded } from "@interfaces/Answer";
import IActivity from "@interfaces/Activitiy";

type Activitiy = IActivity

type ReqActivity = Response<Activitiy>;

export const responseForm = async ({
  form,
  activity_id,
  data,
}: {
  form: IForm;
  activity_id?: string;
  data: Record<string, string | { file: string }>;
}) => {
  return createAnswer({ form, data, activity_id });
};

const createAnswer = async ({
  form,
  data,
  activity_id,
}: {
  form: IForm;
  data: Record<string, string | { file: string }>;
  activity_id?: string;
}) => {
  const res = await api.post<ReqActivity>(
    `/response/${form._id}/${form.type}${activity_id ? "/" + activity_id : ""}`,
    data
  );

  return res.data.data;
};

export const updateResponseForm = async ({
  activity_id,
  data,
}: {
  activity_id: string;
  data: Record<string, string | FileUploaded | Pick<IUser, "_id" | "name" | "matriculation" | "email"> | null>;
}) => {
  const res = await api.post<ReqActivity>(
    `/response/${activity_id}/edit`,
    data
  );

  return res.data.data;
};

export const getSasUrl = async ({
  fileName,
  mimeType,
  size,
}: {
  fileName: string;
  mimeType: string;
  size: number;
}) => {
  const res = await api.post<
    Response<{ url: string; fileName: string; containerName: string }>
  >(`/client-sas`, {
    fileName,
    mimeType,
    size,
  });

  return res.data;
};
