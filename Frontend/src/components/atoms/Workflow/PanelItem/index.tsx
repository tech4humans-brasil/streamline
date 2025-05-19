import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { NodeTypes } from "@interfaces/WorkflowDraft";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface PanelItemProps {
  children: React.ReactNode;
  nodeType?: NodeTypes;
  isCategory?: boolean;
}

const PanelItem: React.FC<PanelItemProps> = ({ children, nodeType, isCategory }) => {
  const { t } = useTranslation();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBorderColor = useColorModeValue("blue.500", "blue.200");

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!isCategory && nodeType) {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
      }
    },
    [nodeType, isCategory]
  );

  if (isCategory) {
    return (
      <Text
        fontSize="sm"
        fontWeight="bold"
        color="gray.500"
        textTransform="uppercase"
        mt={4}
        mb={2}
        px={2}
      >
        {t(`workflow.categories.${children}`)}
      </Text>
    );
  }

  return (
    <Box
      p={4}
      bg={"bg.card"}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      cursor="grab"
      transition="all 0.2s"
      _hover={{
        borderColor: hoverBorderColor,
      }}
      draggable={!isCategory}
      onDragStart={onDragStart}
      role="button"
      aria-label={nodeType ? t(`workflow.nodes.${nodeType}.title`) : undefined}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" fontWeight="medium">
          {nodeType && t(`workflow.nodes.${nodeType}.title`)}
        </Text>
        <Box>{children}</Box>
      </Flex>
      {nodeType && (
        <Text fontSize="xs" color="gray.500">
          {t(`workflow.nodes.${nodeType}.description`)}
        </Text>
      )}
    </Box>
  );
};

export default React.memo(PanelItem);
