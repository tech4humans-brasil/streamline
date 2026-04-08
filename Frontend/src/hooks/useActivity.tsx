import React from "react";
import {
  ActivityContext,
  TicketPageActions,
} from "@contexts/ActivityContext";
import IActivity from "@interfaces/Activitiy";

export default function useActivity(): {
  activity: IActivity | null;
  alterActivity: (activity: IActivity | null) => void;
  removeActivity: () => void;
  handleRefetch: () => void;
  ticketPageActions: TicketPageActions | undefined;
} {
  const context = React.useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return {
    activity: context.activity,
    alterActivity: context.alterActivity,
    removeActivity: context.removeActivity,
    handleRefetch: context.handleRefetch,
    ticketPageActions: context.ticketPageActions,
  };
}
