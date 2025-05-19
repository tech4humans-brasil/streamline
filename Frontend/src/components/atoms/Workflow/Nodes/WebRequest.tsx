import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { RiWebhookLine } from "react-icons/ri";
import { IWebRequest } from "@interfaces/WorkflowDraft";
import CustomHandle from "../CustomHandle";
import { useTranslation } from "react-i18next";

interface WebRequestProps extends NodeProps {
  data: IWebRequest;
}

const WebRequest: React.FC<WebRequestProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("green.500", "green.200");
  const iconBgColor = useColorModeValue("green.100", "green.900");
  const iconColor = useColorModeValue("green.500", "green.200");

  return (
    <WrapperNode {...props} bgColor={bgColor} borderColor={borderColor} iconBgColor={iconBgColor} iconColor={iconColor}>
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={RiWebhookLine}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.web_request.title`)}
          </Text>
          {props.data.method && props.data.url && (
            <Text fontSize="xs" color="gray.500">
              {props.data.method}: {props.data.url.length > 15 
                ? `${props.data.url.substring(0, 15)}...` 
                : props.data.url}
            </Text>
          )}
        </Box>
      </Flex>
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
