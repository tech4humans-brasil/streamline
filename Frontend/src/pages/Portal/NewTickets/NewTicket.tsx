import { getOpenForms } from "@apis/dashboard";
import {
  Box,
  Button,
  Card,
  Center,
  Divider,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { useMemo, useState, useCallback, useTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

const NewTicket: React.FC = () => {
  const { institute_id } = useParams<{ institute_id: string }>(); // Pega o ID do instituto da URL
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: forms, isLoading } = useQuery({
    queryKey: ["open-forms"],
    queryFn: getOpenForms,
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

    return allForms.filter(
      (form) =>
        form.name.toLowerCase().includes(search.toLowerCase()) ||
        form.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [forms, institute_id, search]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setSearch(e.target.value);
    });
  }, []);

  return (
    <Box p={4} bg="bg.card" borderRadius="md" id="forms" w="95%" m={8}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        wrap={"wrap"}
      >
        <Flex alignItems="center" gap={2}>
          <Button variant="ghost" onClick={() => navigate(-1)} w="fit-content">
            <FaArrowLeft />
          </Button>
          <Heading size="md">
            {t("dashboard.title.openForms")}
            {` / ${institute?.name}`}
          </Heading>
        </Flex>

        {/* Barra de pesquisa */}
        <Flex>
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
        </Flex>
      </Flex>
      <Divider my={2} />

      {isLoading && (
        <Center w="100%" h="50%">
          <Spinner />
        </Center>
      )}

      <Stack spacing={4}>
        {filteredForms?.map((form) => (
          <FormItem key={form._id} form={form} />
        ))}
      </Stack>
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
  };
}

const FormItem: React.FC<ActivityItemProps> = ({ form }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/response/${form.slug}`);
  };

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
      </Stack>
    </Card>
  );
};
