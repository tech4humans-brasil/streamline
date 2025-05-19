import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { BiMailSend } from "react-icons/bi";
import { useTranslation } from "react-i18next";

interface SendEmailProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
  };
}

const SendEmail: React.FC<SendEmailProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("blue.500", "blue.200");
  const iconBgColor = useColorModeValue("blue.100", "blue.900");
  const iconColor = useColorModeValue("blue.500", "blue.200");

  return (
    <WrapperNode {...props} bgColor={bgColor} borderColor={borderColor} iconBgColor={iconBgColor} iconColor={iconColor}>

      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={BiMailSend}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.send_email.title`)}
          </Text>
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default SendEmail;
