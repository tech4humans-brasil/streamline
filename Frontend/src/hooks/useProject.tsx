import { getEmails } from "@apis/email";
import { getForms } from "@apis/form";
import { getSchedules } from "@apis/schedule";
import { getStatuses } from "@apis/status";
import { getWorkflows } from "@apis/workflows";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";

export default function useProject() {
  const [searchParams] = useSearchParams();
  const { project = "" } = useParams<{ project: string }>() || {};
  const params = searchParams.toString() + "&project=" + project;

  console.log("params", params);

  const hasProject = !!project;

  const formsQuery = useQuery({
    queryKey: ["forms", params],
    queryFn: getForms,
    enabled: !!hasProject,
  });

  const workflowQuery = useQuery({
    queryKey: ["workflows", params],
    queryFn: getWorkflows,
    enabled: !!hasProject,
  });

  const statusQuery = useQuery({
    queryKey: ["statuses", params],
    queryFn: getStatuses,
    enabled: !!hasProject,
  });

  const emailQuery = useQuery({
    queryKey: ["emails", params],
    queryFn: getEmails,
    enabled: !!hasProject,
  });

  const scheduleQuery = useQuery({
    queryKey: ["schedules", params],
    queryFn: getSchedules,
    enabled: !!hasProject,
  });

  return {
    forms: formsQuery.data?.forms,
    workflows: workflowQuery.data?.workflows,
    statuses: statusQuery.data?.statuses,
    emails: emailQuery.data?.emails,
    schedules: scheduleQuery.data?.schedules,
    pagination: {
      forms: formsQuery.data?.pagination,
      workflows: workflowQuery.data?.pagination,
      statuses: statusQuery.data?.pagination,
      emails: emailQuery.data?.pagination,
      schedules: scheduleQuery.data?.pagination,
    },
    isLoading:
      formsQuery.isPending ||
      workflowQuery.isPending ||
      statusQuery.isPending ||
      emailQuery.isPending ||
      scheduleQuery.isPending,
    isError:
      formsQuery.isError ||
      workflowQuery.isError ||
      statusQuery.isError ||
      emailQuery.isError ||
      scheduleQuery.isError,
  };
}
