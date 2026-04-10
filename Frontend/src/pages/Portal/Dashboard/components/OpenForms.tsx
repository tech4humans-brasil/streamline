import { Button } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/** CTA "Novo ticket" — o cabeçalho com id `open-forms` fica no `Dashboard/index.tsx`. */
const OpenForms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Link to="/portal/new">
      <Button colorScheme="blue" fontSize="sm" fontWeight="medium">
        {t("dashboard.title.openForms")}
      </Button>
    </Link>
  );
};

export default OpenForms;
