import { getEmails } from "@apis/email";
import { getForms } from "@apis/form";
import { getSchedules } from "@apis/schedule";
import { getStatuses } from "@apis/status";
import { getWorkflows } from "@apis/workflows";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export default function useProject() {
  const [searchParams] = useSearchParams();

  const params = searchParams.toString();

  const hasProject = !!searchParams.get("project");

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
    queryKey: ["statuses", searchParams.toString()],
    queryFn: getStatuses,
    enabled: !!hasProject,
  });

  const emailQuery = useQuery({
    queryKey: ["emails", searchParams.toString()],
    queryFn: getEmails,
    enabled: !!hasProject,
  });

  const scheduleQuery = useQuery({
    queryKey: ["schedules", searchParams.toString()],
    queryFn: getSchedules,
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
