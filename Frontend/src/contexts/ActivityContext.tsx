import IActivity from "@interfaces/Activitiy";
import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

export interface TicketPageActions {
  onRefresh: () => void;
  isRefreshing: boolean;
  onExport: () => void;
  isExporting: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

interface ActivityType {
  activity: IActivity | null;
  alterActivity: (activity: IActivity | null) => void;
  removeActivity: () => void;
  handleRefetch: () => void;
  ticketPageActions: TicketPageActions | undefined;
}

export const ActivityContext = createContext<ActivityType | undefined>(
  undefined
);

interface ActivityProviderProps {
  children: ReactNode;
  refetch?: () => void;
  ticketPageActions?: TicketPageActions;
}

export function ActivityProvider({
  children,
  refetch,
  ticketPageActions,
}: Readonly<ActivityProviderProps>) {
  const [activity, setActivity] = useState<IActivity | null>(null);

  const alterActivity = useCallback((activity: IActivity | null) => {
    setActivity(activity);
  }, []);

  const removeActivity = useCallback(() => {
    setActivity(null);
  }, []);

  const handleRefetch = useCallback(() => {
    refetch?.();
  }, [refetch]);

  const providerValue = useMemo(
    () => ({
      activity,
      alterActivity,
      removeActivity,
      handleRefetch,
      ticketPageActions,
    }),
    [
      activity,
      alterActivity,
      removeActivity,
      handleRefetch,
      ticketPageActions,
    ]
  );

  return (
    <ActivityContext.Provider value={providerValue}>
      {children}
    </ActivityContext.Provider>
  );
}

export default ActivityProvider;
