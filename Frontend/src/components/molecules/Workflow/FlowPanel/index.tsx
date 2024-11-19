import { Flex, useColorModeValue } from "@chakra-ui/react";
import { ChangeStatusIcon } from "@components/atoms/Workflow/Nodes/ChangeStatus";
import { SendEmailIcon } from "@components/atoms/Workflow/Nodes/SendEmail";
import PanelItem from "@components/atoms/Workflow/PanelItem";
import React from "react";
import { Panel } from "reactflow";
import { NodeTypes } from "@interfaces/WorkflowDraft";
import { SwapWorkflowIcon } from "@components/atoms/Workflow/Nodes/SwapWorkflow";
import { InteractionIcon } from "@components/atoms/Workflow/Nodes/Interaction";
import { ConditionalIcon } from "@components/atoms/Workflow/Nodes/Conditional";
import { WebRequestIcon } from "@components/atoms/Workflow/Nodes/WebRequest";
import { ScriptIcon } from "@components/atoms/Workflow/Nodes/Script";
import Can from "@components/atoms/Can";

const FlowPanel: React.FC = () => {
  return (
    <Panel position="bottom-center" style={{ width: "fit-content", margin: 0 }}>
      <Flex
        bg={useColorModeValue("gray.100", "gray.700")}
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        px="10"
        py="2"
        gap={2}
        borderRadius="10px"
        border="1px solid"
        borderColor={useColorModeValue("gray.400", "gray.600")}
        position={"relative"}
      >
        <PanelItem nodeType={NodeTypes.SendEmail}>
          <SendEmailIcon />
        </PanelItem>
        <PanelItem nodeType={NodeTypes.ChangeStatus}>
          <ChangeStatusIcon />
        </PanelItem>
        <PanelItem nodeType={NodeTypes.SwapWorkflow}>
          <SwapWorkflowIcon />
        </PanelItem>
        <PanelItem nodeType={NodeTypes.Interaction}>
          <InteractionIcon />
        </PanelItem>
        <PanelItem nodeType={NodeTypes.Conditional}>
          <ConditionalIcon />
        </PanelItem>
        <PanelItem nodeType={NodeTypes.WebRequest}>
          <WebRequestIcon />
        </PanelItem>
        <Can permission="workflow.script">
          <PanelItem nodeType={NodeTypes.Script}>
            <ScriptIcon />
          </PanelItem>
        </Can>
      </Flex>
    </Panel>
  );
};

export default FlowPanel;
