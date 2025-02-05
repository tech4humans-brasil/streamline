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
  const borderColor = useColorModeValue("gray.200", "gray.600");

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
    <Flex
      alignItems="center"
      justifyContent="start"
      flexDirection="row"
      gap={2}
      p={2}
      borderRadius="md"
      _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
      border="1px solid transparent"
      _active={{ borderColor }}
      role="button"
      aria-label={nodeType ? t(`workflow.nodes.${nodeType}.title`) : undefined}
      transition="transform 0.2s"
      cursor="grab"
      draggable={!isCategory}
      onDragStart={onDragStart}
    >
      <Box>{children}</Box>
      {nodeType && (
        <Text fontSize="sm" fontWeight="medium">
          {t(`workflow.nodes.${nodeType}.title`)}
        </Text>
      )}
    </Flex>
  );
};

export default React.memo(PanelItem);
