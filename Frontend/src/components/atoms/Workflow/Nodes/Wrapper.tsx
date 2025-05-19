import {
  Badge,
  Box,
  Button,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import { Handle, NodeProps, Position, useReactFlow } from "reactflow";
import { BsX } from "react-icons/bs";
import { BiSliderAlt, BiInfoCircle } from "react-icons/bi";
import useDrawer from "@hooks/useDrawer";
import CustomHandle from "../CustomHandle";
import { NodeTypes } from "@interfaces/WorkflowDraft";
import { validateNode } from "@pages/Portal/WorkflowDraft/nodesSchema";

interface WrapperNodeProps extends NodeProps {
  children: React.ReactNode;
  deletable?: boolean;
  numberOfSources?: number;
  bgColor?: string;
  borderColor?: string;
  iconBgColor?: string;
  iconColor?: string;
}

const WrapperNode: React.FC<WrapperNodeProps> = ({
  id,
  children,
  selected,
  deletable,
  numberOfSources = 1,
  bgColor,
  borderColor,
}) => {
  const { deleteElements, getNode } = useReactFlow();
  const { onOpen } = useDrawer();
  const node = getNode(id);

  const isValid = useMemo(() => {
    return validateNode(node?.type as NodeTypes, node?.data);
  }, [node]);

  const onRemove = useCallback(() => {
    if (!node) return;

    deleteElements({
      nodes: [node],
    });
  }, [deleteElements, node]);

  const menuBg = useColorModeValue("white", "gray.700");
  const selectedBgColor = useColorModeValue("bg.page", "bg.cardDark");

  return (
    <Flex
      direction="column"
      p={4}
      bg={selected ? selectedBgColor : bgColor}
      borderWidth={"2px"}
      borderColor={borderColor}
      borderRadius="md"
      boxShadow={selected ? "lg" : "md"}
      width="12rem"
      transition="all 0.2s"
    >
      <Handle
        id="default-target"
        type="target"
        position={Position.Left}
        style={{ background: "#555", left: "-10px" }}
      />
      {numberOfSources > 0 && (
        <CustomHandle
          handleId="default-source"
          type="source"
          position={Position.Right}
          style={{ background: "#555", right: "-10px" }}
          title="Conexão Padrão"
        />
      )}
      {children}
      {selected && (
        <Flex
          position="absolute"
          top="-35px"
          right="0"
          cursor="pointer"
          bg={menuBg}
          borderRadius="5px"
          p="3px"
          gap="1"
        >
          {!deletable && (
            <Button
              className="edgebutton"
              onClick={onRemove}
              size="xs"
              rounded="full"
              colorScheme="red"
              p={0}
            >
              <BsX size="15px" />
            </Button>
          )}
          <Button
            className="edgebutton"
            onClick={onOpen}
            size="xs"
            rounded="full"
            p={0}
            colorScheme="gray"
          >
            <BiSliderAlt size="15px" />
          </Button>
        </Flex>
      )}
      {!isValid && (
        <Box position="absolute" top={-1} right={1} textAlign="center">
          <Badge colorScheme="red">
            <BiInfoCircle />
          </Badge>
        </Box>
      )}
    </Flex>
  );
};

export default WrapperNode;
