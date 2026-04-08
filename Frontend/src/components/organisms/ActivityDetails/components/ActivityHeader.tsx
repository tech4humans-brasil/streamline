import React from "react";
import { Box, Button, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ActivityHeaderProps {
  title: string;
  protocol: string;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ title, protocol }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const headerBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const protocolChipBg = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Box
      borderBottomWidth="1px"
      borderColor={headerBorder}
      pb={6}
      mb={6}
    >
      <Flex alignItems="flex-start" gap={4} flexWrap="wrap">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon as={FaArrowLeft} />}
          flexShrink={0}
          onClick={() => navigate(-1)}
        >
          {t("activityDetails.back")}
        </Button>
        <Box flex="1" minW={0}>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            lineHeight="short"
            letterSpacing="-0.02em"
            noOfLines={3}
          >
            {title}
          </Text>
          <Text
            as="span"
            display="inline-block"
            mt={2}
            px={2}
            py={1}
            borderRadius="md"
            bg={protocolChipBg}
            fontSize="sm"
            fontFamily="mono"
            color="gray.600"
            _dark={{ color: "gray.300" }}
          >
            {t("activityDetails.ticket")}
            {protocol}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default ActivityHeader;
