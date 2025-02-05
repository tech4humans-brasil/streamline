import { Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Panel } from "reactflow";
import { NodeTypes, NodeCategory } from "@interfaces/WorkflowDraft";
import { ChangeStatusIcon } from "@components/atoms/Workflow/Nodes/ChangeStatus";
import { SendEmailIcon } from "@components/atoms/Workflow/Nodes/SendEmail";
import PanelItem from "@components/atoms/Workflow/PanelItem";
import { SwapWorkflowIcon } from "@components/atoms/Workflow/Nodes/SwapWorkflow";
import { InteractionIcon } from "@components/atoms/Workflow/Nodes/Interaction";
import { ConditionalIcon } from "@components/atoms/Workflow/Nodes/Conditional";
import { WebRequestIcon } from "@components/atoms/Workflow/Nodes/WebRequest";
import { ScriptIcon } from "@components/atoms/Workflow/Nodes/Script";
import Can from "@components/atoms/Can";
import { NewTicketIcon } from "@components/atoms/Workflow/Nodes/NewTicket";
import { ClicksignIcon } from "@components/atoms/Workflow/Nodes/Clicksign";

interface NodeConfig {
  type: NodeTypes;
  icon: React.ReactNode;
  category: NodeCategory;
  requiresPermission?: string;
}

const FlowPanel: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const nodeConfigs = useMemo<NodeConfig[]>(
    () => [
      {
        type: NodeTypes.Conditional,
        icon: <ConditionalIcon />,
        category: NodeCategory.Flow,
      },
      {
        type: NodeTypes.ChangeStatus,
        icon: <ChangeStatusIcon />,
        category: NodeCategory.Flow,
      },
      {
        type: NodeTypes.SwapWorkflow,
        icon: <SwapWorkflowIcon />,
        category: NodeCategory.Flow,
      },

      {
        type: NodeTypes.SendEmail,
        icon: <SendEmailIcon />,
        category: NodeCategory.Communication,
      },
      {
        type: NodeTypes.Interaction,
        icon: <InteractionIcon />,
        category: NodeCategory.Communication,
      },

      {
        type: NodeTypes.WebRequest,
        icon: <WebRequestIcon />,
        category: NodeCategory.Integration,
      },
      {
        type: NodeTypes.Clicksign,
        icon: <ClicksignIcon />,
        category: NodeCategory.Integration,
      },

      {
        type: NodeTypes.NewTicket,
        icon: <NewTicketIcon />,
        category: NodeCategory.Automation,
      },
      {
        type: NodeTypes.Script,
        icon: <ScriptIcon />,
        category: NodeCategory.Automation,
        requiresPermission: "workflow.script",
      },
    ],
    []
  );

  const groupedNodes = useMemo(() => {
    return nodeConfigs.reduce((acc, node) => {
      const category = node.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(node);
      return acc;
    }, {} as Record<NodeCategory, typeof nodeConfigs>);
  }, [nodeConfigs]);

  const panelStyles = {
    bg: useColorModeValue("gray.100", "gray.700"),
    borderColor: useColorModeValue("gray.400", "gray.600"),
    transform: `translateX(${isOpen ? "0" : "calc(100% - 8px)"})`,
    opacity: isOpen ? 1 : 0.7,
  };

  return (
    <Panel position="top-right" style={{ marginTop: "55px" }}>
      <Flex
        position="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <Flex
          width="250px"
          padding={2}
          borderRadius="10px"
          border="1px solid"
          direction="column"
          position="relative"
          transition="transform 0.3s ease-in-out"
          _hover={{ opacity: 1 }}
          overflow="auto"
          height="calc(100vh - 100px)"
          {...panelStyles}
        >
          <Heading size="sm" mb={4}>
            Blocos
          </Heading>
          {Object.entries(groupedNodes).map(([category, nodes]) => (
            <React.Fragment key={category}>
              <PanelItem isCategory>{category}</PanelItem>
              {nodes.map(({ type, icon, requiresPermission }) =>
                requiresPermission ? (
                  <Can key={type} permission={requiresPermission}>
                    <PanelItem nodeType={type}>{icon}</PanelItem>
                  </Can>
                ) : (
                  <PanelItem key={type} nodeType={type}>
                    {icon}
                  </PanelItem>
                )
              )}
            </React.Fragment>
          ))}
        </Flex>
      </Flex>
    </Panel>
  );
};

export default React.memo(FlowPanel);
