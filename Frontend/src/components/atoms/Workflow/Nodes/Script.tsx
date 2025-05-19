import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { BiLogoJavascript } from "react-icons/bi";
import { IScript } from "@interfaces/WorkflowDraft";
import CustomHandle from "../CustomHandle";
import { useTranslation } from "react-i18next";

interface ScriptProps extends NodeProps {
  data: IScript;
}

const Script: React.FC<ScriptProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("purple.500", "purple.200");
  const iconBgColor = useColorModeValue("purple.100", "purple.900");
  const iconColor = useColorModeValue("purple.500", "purple.200");

  return (
    <WrapperNode {...props} bgColor={bgColor} borderColor={borderColor} iconBgColor={iconBgColor} iconColor={iconColor}>
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={BiLogoJavascript}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.script.title`)}
          </Text>
          {props.data.script && (
            <Text fontSize="xs" color="gray.500">
              {t(`workflow.nodes.script.script`)}: {props.data.script.length > 15 
                ? `${props.data.script.substring(0, 15)}...` 
                : props.data.script}
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

export default Script;