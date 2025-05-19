import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { FaWpforms } from "react-icons/fa";
import { IInteraction } from "@interfaces/WorkflowDraft";
import CustomHandle from "../CustomHandle";
import { useTranslation } from "react-i18next";

interface InteractionProps extends NodeProps {
  data: IInteraction;
}

const Interaction: React.FC<InteractionProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("yellow.500", "yellow.200");
  const iconBgColor = useColorModeValue("yellow.100", "yellow.900");
  const iconColor = useColorModeValue("yellow.500", "yellow.200");

  return (
    <WrapperNode
      {...props}
      bgColor={bgColor}
      borderColor={borderColor}
      iconBgColor={iconBgColor}
      iconColor={iconColor}
      numberOfSources={props.data?.conditional?.length > 0 ? 2 : 1}
    >
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={FaWpforms}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.interaction.title`)}
          </Text>
        </Box>
      </Flex>
      <CustomHandle
        type="source"
        position={Position.Bottom}
        handleId="alternative-source"
        style={{
          background: "violet",
          bottom: "-10px",
          opacity: props.data?.conditional?.length > 0 ? 1 : 0,
        }}
        title="Conexão Alternativa"
        isConnectable={props.data?.conditional?.length > 0}
      />
    </WrapperNode>
  );
};

export default Interaction;
