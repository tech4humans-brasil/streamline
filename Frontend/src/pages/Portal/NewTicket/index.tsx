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
import Accordion from "@components/atoms/Accordion";
import IForm from "@interfaces/Form";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { memo, useCallback, useMemo, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const NewTicket: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [_, startTransition] = useTransition();
  const [search, setSearch] = React.useState<string>("");

  const { data: forms, isLoading } = useQuery({
    queryKey: ["open-forms"],
    queryFn: getOpenForms,
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setSearch(e.target.value);
    });
  }, []);

  const filteredForms = useMemo(() => {
    if (!forms) return [];

    return forms.filter((form) =>
      form.forms.some(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [forms, search]);

  return (
    <Box p={4} bg="bg.card" borderRadius="md" id="open-forms" w="100%" m={8}>
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
          <Heading size="md">{t("dashboard.title.openForms")}</Heading>
        </Flex>

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

      <Accordion.Container
        defaultIndex={[0, 1, 2, 3]}
        allowToggle
        allowMultiple
      >
        {filteredForms?.map((form) => (
          <Accordion.Item key={form.institute?._id}>
            <Accordion.Button>
              {form.institute?.name ?? "Sem Responsável"}
            </Accordion.Button>
            <Accordion.Panel>
              <Flex gap={4} mt={4} width="100%" direction={"column"}>
                {form.forms?.map((form) => (
                  <FormItem key={form._id} form={form} />
                ))}
              </Flex>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Container>
    </Box>
  );
};

export default NewTicket;

interface ActivityItemProps {
  form: Pick<IForm, "name" | "description" | "period" | "slug">;
}

const FormItem: React.FC<ActivityItemProps> = memo(({ form }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleView = useCallback(() => {
    navigate(`/response/${form.slug}`);
  }, [navigate, form.slug]);

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
        display={"flex"}
        justifyContent={"space-between"}
        h="100%"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h2" size="md">
            {form.name}
          </Heading>
        </Flex>
        <Text fontSize="sm" noOfLines={2}>
          {form.description}
        </Text>
        <Text fontSize="sm">
          {t("common.fields.closedAt")}:
          {form.period?.open
            ? convertDateTime(form.period.close)
            : t("common.fields.undefined")}
        </Text>
      </Stack>
    </Card>
  );
});
