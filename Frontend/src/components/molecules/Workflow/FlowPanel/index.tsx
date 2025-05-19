import { Box, Heading, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Panel } from "reactflow";
import { NodeTypes, NodeCategory } from "@interfaces/WorkflowDraft";
import PanelItem from "@components/atoms/Workflow/PanelItem";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { BiMailSend, BiLogoJavascript } from "react-icons/bi";
import { GoTag, GoWorkflow } from "react-icons/go";
import { FaWpforms, FaPlusSquare } from "react-icons/fa";
import { RiWebhookLine } from "react-icons/ri";
import { AiFillSignature } from "react-icons/ai";
import { BiGitRepoForked } from "react-icons/bi";

interface NodeConfig {
  type: NodeTypes;
  icon: React.ReactNode;
  category: NodeCategory;
  requiresPermission?: string;
}

const FlowPanel: React.FC = () => {
  const { t } = useTranslation();

  const nodeConfigs = useMemo<NodeConfig[]>(
    () => [
      {
        type: NodeTypes.Conditional,
        icon: <BiGitRepoForked size={20} />,
        category: NodeCategory.Flow,
      },
      {
        type: NodeTypes.ChangeStatus,
        icon: <GoTag size={20} />,
        category: NodeCategory.Flow,
      },
      {
        type: NodeTypes.SwapWorkflow,
        icon: <GoWorkflow size={20} />,
        category: NodeCategory.Flow,
      },

      {
        type: NodeTypes.SendEmail,
        icon: <BiMailSend size={20} />,
        category: NodeCategory.Communication,
      },
      {
        type: NodeTypes.Interaction,
        icon: <FaWpforms size={20} />,
        category: NodeCategory.Communication,
      },

      {
        type: NodeTypes.WebRequest,
        icon: <RiWebhookLine size={20} />,
        category: NodeCategory.Integration,
      },
      {
        type: NodeTypes.Clicksign,
        icon: <AiFillSignature size={20} />,
        category: NodeCategory.Integration,
      },

      {
        type: NodeTypes.NewTicket,
        icon: <FaPlusSquare size={20} />,
        category: NodeCategory.Automation,
      },
      {
        type: NodeTypes.Script,
        icon: <BiLogoJavascript size={20} />,
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

  return (
    <Panel position="top-right" style={{ marginTop: "55px", marginRight: "10px" }}>
      <Box width="350px" p={4} bg={"bg.page"} borderRadius="lg" shadow="sm">
        <Heading size="md" mb={4}>
          {t("workflow.panel.add_block")}
        </Heading>
        <VStack spacing={4} align="stretch" overflowY="auto" maxHeight="calc(100vh - 140px)" p={2}>
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
        </VStack>
      </Box>
    </Panel>
  );
};

export default React.memo(FlowPanel);
