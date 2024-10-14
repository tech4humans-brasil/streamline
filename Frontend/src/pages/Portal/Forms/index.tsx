import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiRefresh, BiEdit } from "react-icons/bi";
import { getForms } from "@apis/form";
import Pagination from "@components/organisms/Pagination";
import IForm from "@interfaces/Form";
import Can from "@components/atoms/Can";
import Filter from "@components/organisms/Filter";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import { useTranslation } from "react-i18next";

const columns = [
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "type",
    label: "common.fields.type",
  },
  {
    key: "active",
    label: "common.fields.active",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
];

const FormTypes = {
  created: "Criação",
  interaction: "Interação",
  "time-trigger": "Tempo",
  external: "Externo",
};

const Action = memo((form: Pick<IForm, "_id" | "slug">) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/portal/form/${form._id}`);
  }, [navigate, form._id]);

  return (
    <div>
      <Button mr={2} onClick={handleEdit} size="sm">
        <BiEdit size={20} />
      </Button>
    </div>
  );
});

const Create = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelect = useCallback(() => {
    navigate(`/portal/form`);
  }, [navigate]);

  return (
    <div>
      <Can permission="form.create">
        <Button colorScheme="blue" mr={2} onClick={handleSelect} size="sm">
          {t("forms.create")}
        </Button>
      </Can>
    </div>
  );
});

const Forms: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: { forms, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["forms", searchParams.toString()],
    queryFn: getForms,
  });

  const data = useMemo(() => {
    if (!forms) return [];

    return forms.map((form) => ({
      ...form,
      active: form.active
        ? t("common.fields.active")
        : t("common.fields.inactive"),
      type: FormTypes[form.type],
      actions: <Action {...form} />,
    }));
  }, [forms]);

  return (
    <Box width="100%" p="10">
      <Heading>{t("forms.title")}</Heading>
      <Flex justifyContent="flex-end" mt="4" width="100%">
        <Button
          onClick={() => refetch()}
          mr={2}
          size="sm"
          isLoading={isFetching}
        >
          <BiRefresh size={20} />
        </Button>
        <Create />
      </Flex>

      <Filter.Container>
        <Text input={{ label: "Nome", id: "name" }} />

        <Select
          input={{
            label: t("common.fields.type"),
            id: "type",
            options: Object.entries(FormTypes).map(([key, value]) => ({
              label: value,
              value: key,
            })),
          }}
          isMulti
        />

        <Select
          input={{
            label: t("common.fields.active"),
            id: "active",
            options: [
              {
                label: t("common.fields.active"),
                value: "true",
              },
              {
                label: t("common.fields.inactive"),
                value: "false",
              },
            ],
          }}
        />
      </Filter.Container>

      <Flex
        justifyContent="center"
        alignItems="center"
        mt="4"
        width="100%"
        p="4"
        borderRadius="md"
        direction="column"
        bg={"bg.card"}
      >
        <Table columns={columns} data={data} />
        <Pagination pagination={pagination} isLoading={isFetching} />
      </Flex>
      {isError && (
        <Flex justifyContent="center" alignItems="center" mt="4" width="100%">
          <Heading color="red.500">{t("forms.error")}</Heading>
        </Flex>
      )}
    </Box>
  );
};

export default Forms;
