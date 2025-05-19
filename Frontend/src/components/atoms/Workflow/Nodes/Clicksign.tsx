import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import WrapperNode from "./Wrapper";
import { AiFillSignature } from "react-icons/ai";
import { useTranslation } from "react-i18next";

interface ClicksignProps extends NodeProps {
  data: {
    to: string;
    subject: string;
    template_id: string;
    name: string;
    documentName?: string;
    signers?: string[];
  };
}

const Clicksign: React.FC<ClicksignProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("pink.500", "pink.200");
  const iconBgColor = useColorModeValue("pink.100", "pink.900");
  const iconColor = useColorModeValue("pink.500", "pink.200");

  return (
    <WrapperNode
      {...props}
      bgColor={bgColor}
      borderColor={borderColor}
      iconBgColor={iconBgColor}
      iconColor={iconColor}
    >
      <Flex align="center" gap={2}>
        <Circle size="32px" bg={iconBgColor}>
          <Box
            as={AiFillSignature}
            boxSize="16px"
            color={iconColor}
          />
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="bold">
            {t(`workflow.nodes.clicksign.title`)}
          </Text>
          {props.data.documentName && (
            <Text fontSize="xs" color="gray.500">
              {t(`workflow.nodes.clicksign.document`)}: {props.data.documentName.length > 15
                ? `${props.data.documentName.substring(0, 15)}...`
                : props.data.documentName}
            </Text>
          )}
          {props.data.signers && props.data.signers.length > 0 && (
            <Text fontSize="xs" color="gray.500">
              {props.data.signers.length} {t(`workflow.nodes.clicksign.signers`)}
            </Text>
          )}
        </Box>
      </Flex>
    </WrapperNode>
  );
};

export default Clicksign;
