import { getOpenForms } from "@apis/dashboard";
import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useTransition } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const InstitutesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [_, startTransition] = useTransition();
  const [search, setSearch] = React.useState<string>("");

  const { data: forms, isLoading } = useQuery({
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

  return (
    <Box p={4} bg="bg.card" borderRadius="md" id="institutes" w="95%" m={8}>
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

      <Stack spacing={4}>
        {institutes?.map((institute) => (
          <Button
            key={institute?._id}
            onClick={() => handleInstituteClick(institute?._id)}
            leftIcon={<Avatar size="md" name={institute?.name ?? ""} />}
            justifyContent="flex-start"
            h="auto"
            p={2}
          >
            {institute?.name ?? "Sem Responsável"}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default InstitutesPage;
