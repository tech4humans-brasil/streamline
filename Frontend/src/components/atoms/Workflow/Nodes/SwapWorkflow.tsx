import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { GoWorkflow } from "react-icons/go";
import { useTranslation } from "react-i18next";

interface SwapWorkflowProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
    targetFlow?: string;
  };
}

const SwapWorkflow: React.FC<SwapWorkflowProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("cyan.500", "cyan.200");
  const iconBgColor = useColorModeValue("cyan.100", "cyan.900");
  const iconColor = useColorModeValue("cyan.500", "cyan.200");

  return (
    <WrapperNode 
      {...props} 
      bgColor={bgColor}
      borderColor={borderColor}
      iconBgColor={iconBgColor}
      iconColor={iconColor}
      numberOfSources={0}
    >
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={GoWorkflow}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.swap_workflow.title`)}
          </Text>
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default SwapWorkflow;
