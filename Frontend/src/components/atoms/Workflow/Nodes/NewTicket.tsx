import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { FaPlusSquare } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface NewTicketProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
    title?: string;
  };
}

const NewTicket: React.FC<NewTicketProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("red.500", "red.200");
  const iconBgColor = useColorModeValue("red.100", "red.900");
  const iconColor = useColorModeValue("red.500", "red.200");

  return (
    <WrapperNode {...props} bgColor={bgColor} borderColor={borderColor} iconBgColor={iconBgColor} iconColor={iconColor}>
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={FaPlusSquare}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.new_ticket.title`)}
          </Text>
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default NewTicket;
