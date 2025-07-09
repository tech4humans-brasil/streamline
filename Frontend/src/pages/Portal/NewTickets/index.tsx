import { getOpenForms } from "@apis/dashboard";
import {
  Avatar,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Spinner,
  Card,
  Grid,
  VStack,
  Text,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useTransition } from "react";
import { FaArrowLeft, FaSearch, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const InstitutesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [_, startTransition] = useTransition();
  const [search, setSearch] = React.useState<string>("");

  const {
    data: forms,
    isLoading,
    refetch,
    isPending,
  } = useQuery({
    queryKey: ["open-forms"],
    queryFn: getOpenForms,
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setSearch(e.target.value);
    });
  }, []);

  const institutes = useMemo(() => {
    if (!forms) return [];
    return forms
      .map((form) => form.institute)
      .filter((institute) =>
        institute?.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [forms, search]);

  const handleInstituteClick = useCallback(
    (instituteId?: string | null) => {
      navigate(`/portal/new/${instituteId}`);
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <Card
        p={[0, 6]}
        borderRadius="2xl"
        minWidth={"60%"}
        boxShadow={"lg"}
        h="100%"
        bg="bg.card"
      >
        <Flex justify="center" align="center" h="100%">
          <Spinner />
        </Flex>
      </Card>
    );
  }

  return (
    <Box w="90%" mx="auto" py={6} maxW="7xl">
      <Flex alignItems="center" mb={6} justifyContent={"space-between"}>
        <Flex alignItems={"center"} gap={2}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FaArrowLeft />}
            mr={4}
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
          <Text fontSize={["lg", "2xl"]} fontWeight="bold">
            {t("dashboard.title.openForms")}
          </Text>
        </Flex>
        <Flex
          justifyContent="flex-end"
          alignItems="center"
          gap={2}
        >
          <InputGroup>
            <Input
              placeholder={t("common.fields.search")}
              onChange={handleSearch}
              isDisabled={isLoading}
            />
            <InputRightAddon>
              <FaSearch />
            </InputRightAddon>
          </InputGroup>

          <IconButton
            aria-label={t("common.actions.refresh")}
            icon={<FaSync />}
            isLoading={isPending}
            onClick={() => refetch()}
            ml={2}
          />
        </Flex>
      </Flex>

      <Grid templateColumns="1fr" gap={6}>
        <VStack spacing={6} align="stretch">
          <Card>
            <Box p={6}>
              <VStack spacing={4}>
                {institutes?.map((institute) => (
                  <Button
                    key={institute?._id}
                    onClick={() => handleInstituteClick(institute?._id)}
                    leftIcon={<Avatar size="md" name={institute?.name ?? ""} />}
                    justifyContent="flex-start"
                    h="auto"
                    p={4}
                    w="100%"
                    variant="outline"
                  >
                    <Text fontSize="md" fontWeight="medium">
                      {institute?.name ?? "Sem Responsável"}
                    </Text>
                  </Button>
                ))}
              </VStack>
            </Box>
          </Card>
        </VStack>
      </Grid>
    </Box>
  );
};

export default InstitutesPage;
