import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { GoTag } from "react-icons/go";
import { useTranslation } from "react-i18next";

interface ChangeStatusProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
    status?: string;
  };
}

const ChangeStatus: React.FC<ChangeStatusProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("orange.500", "orange.200");
  const iconBgColor = useColorModeValue("orange.100", "orange.900");
  const iconColor = useColorModeValue("orange.500", "orange.200");

  return (
    <WrapperNode {...props} bgColor={bgColor} borderColor={borderColor} iconBgColor={iconBgColor} iconColor={iconColor}>
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={GoTag}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.change_status.title`)}
          </Text>
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default ChangeStatus;
