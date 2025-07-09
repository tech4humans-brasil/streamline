import { getOpenForms } from "@apis/dashboard";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Spinner,
  Stack,
  Tag,
  Text,
  Grid,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { useMemo, useState, useCallback, useTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaSearch, FaSync } from "react-icons/fa";

const NewTicket: React.FC = () => {
  const { institute_id } = useParams<{ institute_id: string }>(); // Pega o ID do instituto da URL
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: forms,
    isLoading,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["open-forms"],
    queryFn: getOpenForms,
    staleTime: 1000 * 60 * 5,
  });

  const [search, setSearch] = useState<string>(""); // Armazena o valor da pesquisa
  const [_, startTransition] = useTransition();

  const institute = useMemo(() => {
    if (!forms) return null;
    return forms.find((form) => form.institute?._id === institute_id)
      ?.institute;
  }, [forms, institute_id]);

  // Filtra os formulários com base no valor da pesquisa
  const filteredForms = useMemo(() => {
    if (!forms) return [];
    const institute = forms.find(
      (form) => form.institute?._id === institute_id
    );
    const allForms = institute?.forms ?? [];

    return allForms
      .filter(
        (form) =>
          form.name.toLowerCase().includes(search.toLowerCase()) ||
          form.description.toLowerCase().includes(search.toLowerCase())
      )
      ?.sort((a, b) => a?.name.localeCompare(b?.name));
  }, [forms, institute_id, search]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setSearch(e.target.value);
    });
  }, []);

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
      <Flex alignItems="center" mb={6} wrap={"wrap"} gap={2} justifyContent={"space-between"}>
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
            {` / ${institute?.name}`}
          </Text>
        </Flex>

        <Flex
          justifyContent="flex-end"
          alignItems="flex-end"
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
            aria-label={t("common.buttons.refresh")}
            icon={<FaSync />}
            onClick={() => refetch()}
            isLoading={isPending}
            ml={2}
          />
        </Flex>
      </Flex>

      <Grid templateColumns="1fr" gap={6}>
        <VStack spacing={6} align="stretch">
          <Card>
            <Box p={6}>

              <VStack spacing={4}>
                {filteredForms?.map((form) => (
                  <FormItem key={form._id} form={form} />
                ))}
              </VStack>
            </Box>
          </Card>
        </VStack>
      </Grid>
    </Box>
  );
};

export default NewTicket;

interface ActivityItemProps {
  form: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    period?: { open?: string | null; close?: string | null };
    published: boolean;
    type: "created" | "external" | "interaction" | "time-triggered";
    url: string | null;
    sla: number | null;
  };
}

const FormItem: React.FC<ActivityItemProps> = ({ form }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleView = useCallback(() => {
    if (form.type === "external") {
      if (!form.url) {
        alert(t("dashboard.alerts.invalidForm"));
        return;
      }

      window.open(form.url, "_blank");
      return;
    }

    navigate(`/response/${form.slug}`);
  }, [form.slug, navigate]);

  return (
    <Card
      boxShadow="md"
      borderWidth="1px"
      borderRadius="md"
      p={4}
      borderColor={"bg.border"}
      gap={2}
      onClick={handleView}
      cursor="pointer"
      _hover={{ bg: "bg.page" }}
      w="100%"
    >
      <Stack
        spacing={2}
        flexDirection={"row"}
        justifyContent={"space-between"}
        h="100%"
        wrap={"wrap"}
      >
        <Stack spacing={2}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading as="h2" size="sm">
              {form.name}
            </Heading>
          </Flex>
          <Text fontSize="sm" noOfLines={2}>
            {form.description}
          </Text>
        </Stack>
        {form.period?.close && (
          <Text fontSize="sm">
            {t("common.fields.closedAt")}: {convertDateTime(form.period.close)}
          </Text>
        )}
        {form.type === "external" && (
          <Tag colorScheme="blue" mt={2} size="sm">
            {t("common.fields.external")}
          </Tag>
        )}

        {form.sla && (
          <Tag colorScheme="orange" mt={2} size="sm">
            {t("common.fields.sla")}: {form.sla} {t("common.fields.days")}
          </Tag>
        )}
      </Stack>
    </Card>
  );
};
