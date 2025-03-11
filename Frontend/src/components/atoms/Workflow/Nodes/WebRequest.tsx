import { Box, Flex, useColorModeValue, Text } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { RiWebhookLine } from "react-icons/ri";
import { IWebRequest } from "@interfaces/WorkflowDraft";
import CustomHandle from "../CustomHandle";

interface WebRequestProps extends NodeProps {
  data: IWebRequest;
}

const WebRequest: React.FC<WebRequestProps> = (props) => {
  return (
    <WrapperNode {...props}>
      <Box
        as={RiWebhookLine}
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

export default WebRequest;

export function WebRequestIcon() {
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
        as={RiWebhookLine}
        size="50px"
        color={useColorModeValue("gray.500", "gray.300")}
      />
    </Flex>
  );
}
