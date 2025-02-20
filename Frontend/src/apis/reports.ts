import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import api from "@services/api";

export default interface Dashboard {
  statusCounts: { _id: string; count: number }[];
  formTypeCounts: { _id: string; count: number }[];
  openActivitiesCount: number;
  closedActivitiesCount: number;
  countByMastermind: {
    count: number;
    mastermindId: string;
    mastermindName: string;
    status: string;
  }[];
  averageCompletionTime: number; // in days
  deadlineMetrics: {
    onTime: number;
    delayed: number;
    noDeadline: number;
  };
  monthlyActivities: {
    month: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    userName: string;
    count: number;
  }[];
  instituteDistribution: {
    _id: string;
    name: string;
    count: number;
  }[];
}

type ReqDashboard = Response<Dashboard & IPagination>;
export const getActivitiesDashboard = async ({
  queryKey: [, params],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqDashboard>(`activities/dashboard?${params}`);

  return res.data.data;
};

type ReqDashboardForms = Response<{
  forms: {
    value: string;
    label: string;
  }[];
}>;
export const getActivitiesDashboardForms = async () => {
  const res = await api.get<ReqDashboardForms>("activities/dashboard/forms");

  return res.data.data;
};
