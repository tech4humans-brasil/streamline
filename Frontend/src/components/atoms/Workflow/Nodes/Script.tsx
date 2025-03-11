import { Box, Flex, useColorModeValue, Text } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { BiLogoJavascript } from "react-icons/bi";
import { IScript } from "@interfaces/WorkflowDraft";
import CustomHandle from "../CustomHandle";

interface ScriptProps extends NodeProps {
  data: IScript;
}

const Script: React.FC<ScriptProps> = (props) => {
  return (
    <WrapperNode {...props}>
      <Box
        as={BiLogoJavascript}
        size="30px"
        color={useColorModeValue("gray.500", "gray.300")}
      />
      <Text fontSize="xs" textAlign="center" noOfLines={1}>
        {props.data?.name}
      </Text>
      <CustomHandle
        type="source"
        position={Position.Bottom}
        handleId="alternative-source"
        style={{ background: "red", bottom: "-10px" }}
        title="Conexão Alternativa"
      />
    </WrapperNode>
  );
};

export default Script;

export function ScriptIcon() {
  return (
    <Flex
      bg={"bg.card"}
      width="100px"
      height="80px"
      alignItems="center"
      justifyContent="center"
      border="1px solid"
      borderRadius="3px"
      transition="border-color 0.3s ease-in-out"
      borderColor={"bg.page"}
    >
      <Box
        as={BiLogoJavascript}
        size="50px"
        color={useColorModeValue("gray.500", "gray.300")}
      />
    </Flex>
  );
}
