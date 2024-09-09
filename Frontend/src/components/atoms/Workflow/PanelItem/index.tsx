import { Box, Tooltip } from "@chakra-ui/react";
import { NodeTypes } from "@interfaces/WorkflowDraft";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface PanelItemProps {
  children: React.ReactNode;
  nodeType: NodeTypes;
}

const PanelItem: React.FC<PanelItemProps> = ({ children, nodeType }) => {
  const { t } = useTranslation();

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
    },
    [nodeType]
  );

  return (
    <Tooltip
      label={t(`workflow.nodes.${nodeType}.title`)}
      aria-label="A tooltip"
    >
      <Box
        transition="transform 0.3s ease-in-out"
        _hover={{
          transform: "translateY(-20px)",
        }}
        height="50px"
        cursor="pointer"
        draggable
        shadow="md"
        onDragStart={onDragStart}
        pb="2"
      >
        {children}
      </Box>
    </Tooltip>
  );
};

export default PanelItem;
