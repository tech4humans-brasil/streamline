import { getEmails } from "@apis/email";
import { getForms } from "@apis/form";
import { getSchedules } from "@apis/schedule";
import { getStatuses } from "@apis/status";
import { getWorkflows } from "@apis/workflows";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";

const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function useProject() {
  const [searchParams] = useSearchParams();
  const { project = "" } = useParams<{ project: string }>() || {};
  const params = searchParams.toString() + "&project=" + project;
  const activeTab = searchParams.get('tab') || '0';

  const hasProject = !!project;

  const formsQuery = useQuery({
    queryKey: ["forms", params],
    queryFn: getForms,
    enabled: !!hasProject && activeTab === '1',
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const workflowQuery = useQuery({
    queryKey: ["workflows", params],
    queryFn: getWorkflows,
    enabled: !!hasProject && activeTab === '0',
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const statusQuery = useQuery({
    queryKey: ["statuses", params],
    queryFn: getStatuses,
    enabled: !!hasProject && activeTab === '3',
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const emailQuery = useQuery({
    queryKey: ["emails", params],
    queryFn: getEmails,
    enabled: !!hasProject && activeTab === '2',
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const scheduleQuery = useQuery({
    queryKey: ["schedules", params],
    queryFn: getSchedules,
    enabled: !!hasProject && activeTab === '4',
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  return {
    project,
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
