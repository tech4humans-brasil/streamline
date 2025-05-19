import {
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Handle, NodeProps, Position } from "reactflow";
import CustomHandle from "../CustomHandle";

interface CircleNodeProps extends NodeProps {
  data: {
    label: string;
    hasHandleLeft?: boolean;
    hasHandleRight?: boolean;
    hasMenu?: boolean;
    name?: string;
  };
}

const CircleNode: React.FC<CircleNodeProps> = ({ data }) => {

  const borderColor = useColorModeValue("gray.400", "gray.500");
  const iconBgColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Flex
      align="center"
      justify="center"
      width="50px"
      height="50px"
      borderRadius="50%"
      bg={iconBgColor}
      border="2px solid"
      borderColor={borderColor}
    >
      <div>{data.label}</div>
      {data?.hasHandleLeft && (
        <Handle
          type="target"
          id="default-target"
          position={Position.Left}
          style={{ background: "#555", left: "-10px" }}
        />
      )}

      {data?.hasHandleRight && (
        <CustomHandle
          handleId="default-source"
          type="source"
          position={Position.Right}
          style={{ background: "#555", right: "-10px" }}
        />
      )}
    </Flex>
  );
};

export default CircleNode;
