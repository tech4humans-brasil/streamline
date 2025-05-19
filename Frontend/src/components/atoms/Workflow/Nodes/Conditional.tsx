import { Box, Flex, useColorModeValue, Text, Circle } from "@chakra-ui/react";
import { NodeProps, Position } from "reactflow";
import WrapperNode from "./Wrapper";
import { BiGitRepoForked } from "react-icons/bi";
import CustomHandle from "../CustomHandle";
import { useTranslation } from "react-i18next";

interface ConditionalProps extends NodeProps {
  data: {
    name: string;
    visible: boolean;
    form_id: string;
    conditional: Array<{
      field: string;
      value: string;
      operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains";
    }>;
    ifNotExists: string;
    condition?: string;
    trueLabel?: string;
    falseLabel?: string;
  };
}

const Conditional: React.FC<ConditionalProps> = (props) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("purple.500", "purple.200");
  const iconBgColor = useColorModeValue("purple.100", "purple.900");
  const iconColor = useColorModeValue("purple.500", "purple.200");

  return (
    <WrapperNode 
      {...props} 
      bgColor={bgColor}
      borderColor={borderColor}
      iconBgColor={iconBgColor}
      iconColor={iconColor}
      numberOfSources={0}
    >
      <Flex direction="column" gap={2}>
        <Flex align="center" gap={2}>
          <Circle size="32px" bg={iconBgColor}>
            <Box
              as={BiGitRepoForked}
              boxSize="16px"
              color={iconColor}
            />
          </Circle>
          <Box>
            <Text fontSize="sm" fontWeight="bold">
              {t(`workflow.nodes.conditional.title`)}
            </Text>
            {props.data.condition && (
              <Text fontSize="xs" color="gray.500">
                {t(`workflow.nodes.conditional.if`)}: {props.data.condition.length > 15 
                  ? `${props.data.condition.substring(0, 15)}...` 
                  : props.data.condition}
              </Text>
            )}
          </Box>
        </Flex>

        <Flex justify="space-between" fontSize="xs" mt={2}>
          <Text color="green.500">{props.data.trueLabel || t(`workflow.nodes.conditional.yes`)}</Text>
          <Text color="red.500">{props.data.falseLabel || t(`workflow.nodes.conditional.no`)}</Text>
        </Flex>

        <CustomHandle
          type="source"
          position={Position.Bottom}
          handleId="default-source"
          style={{ background: "green", left: "30%" }}
          title={t(`workflow.nodes.conditional.true_path`)}
        />
        <CustomHandle
          type="source"
          position={Position.Bottom}
          handleId="alternative-source"
          style={{ background: "red", left: "70%" }}
          title={t(`workflow.nodes.conditional.false_path`)}
        />
      </Flex>
    </WrapperNode>
  );
};

export default Conditional;
