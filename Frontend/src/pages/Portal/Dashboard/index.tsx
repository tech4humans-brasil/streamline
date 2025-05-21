import React from "react";
import MyActivities from "./components/MyActivities";
import { Flex } from "@chakra-ui/react";
import OpenForms from "./components/OpenForms";
import PendingInteractions from "./components/MyPendingInteractions";
import Can from "@components/atoms/Can";
import Tutorial, { JoyrideSteps } from "@components/molecules/Tutorial";

const steps: JoyrideSteps = [
  {
    target: "#open-forms",
    content: "dashboard.joyride.open-forms",
  },
  {
    target: "#my-activities",
    content: "dashboard.joyride.my-activities",
  },
  {
    target: "#pending-interactions",
    content: "dashboard.joyride.pending-interactions",
  },
  {
    target: "#switch-theme",
    content: "dashboard.joyride.switch-theme",
  },
  {
    target: "#profile-menu",
    content: "dashboard.joyride.profile-menu",
  },
];

const Dashboard: React.FC = () => {
  return (
    <Flex p={[4, 8]} width="100%" direction="column" gap={8}>
      <Tutorial steps={steps} name="dashboard" />
      <Can permission="activity.create">
        <OpenForms />
      </Can>
      <PendingInteractions />
      <MyActivities />
    </Flex>
  );
};

export default Dashboard;
