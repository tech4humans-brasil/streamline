import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { BiTime } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import { IDelay } from "@interfaces/WorkflowDraft";

interface DelayProps extends NodeProps {
  data: IDelay;
}

const Delay: React.FC<DelayProps> = (props) => {
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
            as={BiTime}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {props.data.name || t(`workflow.nodes.delay.title`)}
          </Text>
          {props.data.time_value && (
             <Text fontSize="xs" color="gray.500">
                {props.data.time_value} {t(`workflow.nodes.delay.units.${props.data.time_unit}`)}
             </Text>
          )}
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default Delay;

