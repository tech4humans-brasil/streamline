import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaSadCry } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = useCallback(() => {

    if(window.location.pathname === "/404") {
      navigate("/");
      return;
    }

    navigate(-1);
  }, [navigate]);

  return (
    <Flex align="center" justify="center" height="100vh">
      <Box textAlign="center">
        <i>
          <FaSadCry fontSize={"5rem"} style={{ margin: "0 auto" }} />
        </i>
        <Heading size="2xl" my={4}>
          {t("notFound.title")}
        </Heading>
        <p>{t("notFound.description")}</p>
        <Button onClick={handleBack} colorScheme="teal" mt="5">
          {t("notFound.back")}
        </Button>
      </Box>
    </Flex>
  );
}
