import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IForm from "@interfaces/Form";
import api from "@services/api";
import IFormDraft from "@interfaces/FormDraft";

type Form = IForm;
type ReqForms = Response<
  {
    forms: Pick<IForm, "_id" | "name" | "slug" | "type" | "active">[];
  } & IPagination
>;
type ReqForm = Response<Form>;
type ReqFormWithFields = Response<Form & { published: IFormDraft }>;

export const getForms = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqForms>(`/forms?${query}`);

  return res.data.data;
};

export const getForm = async ({ queryKey: [, id] }: { queryKey: string[] }) => {
  const res = await api.get<ReqForm>(`/form/${id}`);

  return {
    ...res.data.data,
    period: {
      open: res.data.data.period?.open
        ? res.data.data.period.open.split("T")[0]
        : null,
      close: res.data.data.period?.close
        ? res.data.data.period.close.split("T")[0]
        : null,
    },
  };
};

export const getFormWithFields = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqFormWithFields>(`/form/${id}`, {
    params: { fields: true },
  });

  return {
    ...res.data.data,
    period: {
      open: res.data.data.period?.open
        ? res.data.data.period.open.split("T")[0]
        : null,
      close: res.data.data.period?.close
        ? res.data.data.period.close.split("T")[0]
        : null,
    },
  };
};

export const createForm = async (data: Omit<Form, "_id">) => {
  const res = await api.post<ReqForm>("/form", data);

  return res.data.data;
};

export const updateForm = async (data: Form) => {
  const res = await api.put<ReqForm>(`/form/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateForm = async (
  data: Omit<Form, "_id"> & { _id?: string },
) => {
  if (data?._id) {
    return updateForm(data as Form);
  }

  return createForm(data);
};

export const getFormBySlug = async ({
  queryKey: [, slug],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqFormWithFields>(`/form/slug/${slug}`);

  return {
    ...res.data.data,
    period: {
      open: res.data.data.period?.open
        ? res.data.data.period.open.split("T")[0]
        : null,
      close: res.data.data.period?.close
        ? res.data.data.period.close.split("T")[0]
        : null,
    },
  };
};

type ReqFormForms = Response<{
  status: { label: string; value: string }[];
  workflows: { label: string; value: string }[];
  institutes: { label: string; value: string }[];
}>;
export const getFormForms = async ({
  queryKey: [, ,project],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqFormForms>("/form/forms", {
    params: {
      project,
    },
  });

  return res.data.data;
};
