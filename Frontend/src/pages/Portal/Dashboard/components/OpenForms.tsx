import { Flex, Button, Text } from "@chakra-ui/react";
import { useConfig } from "@hooks/useConfig";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useAuth from "@hooks/useAuth";

const OpenForms: React.FC = () => {
  const { t } = useTranslation();
  const [authData] = useAuth();
  const { data } = useConfig(authData?.slug);

  return (
    <Flex
      borderRadius="md"
      id="open-forms"
      w="100%"
      justifyContent={"space-between"}
    >
      <Text fontSize="lg" fontWeight="bold">
        {data?.name} | {t("welcome.title")}
      </Text>

      <Link to="/portal/new">
        <Button colorScheme="blue" fontSize="sm" fontWeight="normal" mb={2}>
          {t("dashboard.title.openForms")}
        </Button>
      </Link>
    </Flex>
  );
};

export default OpenForms;
