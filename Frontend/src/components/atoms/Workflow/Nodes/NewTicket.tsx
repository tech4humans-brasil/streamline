import { Box, Flex, useColorModeValue, Text } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { FaPlusSquare } from "react-icons/fa";

interface NewTicketProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
  };
}

const NewTicket: React.FC<NewTicketProps> = (props) => {
  return (
    <WrapperNode {...props}>
      <Box
        as={FaPlusSquare}
        size="30px"
        color={useColorModeValue("gray.500", "gray.300")}
      />
      <Text fontSize="xs" textAlign="center" noOfLines={1}>
        {props.data?.name}
      </Text>
    </WrapperNode>
  );
};

export default NewTicket;

export function NewTicketIcon() {
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
        as={FaPlusSquare}
        size="50px"
        color={useColorModeValue("gray.500", "gray.300")}
      />
    </Flex>
  );
}
