import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiRefresh, BiEdit } from "react-icons/bi";
import Pagination from "@components/organisms/Pagination";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { getSchedules } from "@apis/schedule";
import { ISchedule } from "@interfaces/Schedule";
import cronstrue from "cronstrue/i18n";

const columns = [
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "expression",
    label: "common.fields.expression",
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

const Action = memo((form: Pick<ISchedule, "_id">) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/portal/schedule/${form._id}`);
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
    navigate(`/portal/schedule`);
  }, [navigate]);

  return (
    <div>
      <Can permission="form.create">
        <Button colorScheme="blue" mr={2} onClick={handleSelect} size="sm">
          {t("schedule.create")}
        </Button>
      </Can>
    </div>
  );
});

const Schedules: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: { schedules, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["schedules", searchParams.toString()],
    queryFn: getSchedules,
  });

  const cronTranslation = useCallback(
    (expression: string) => {
      return cronstrue.toString(expression, {
        locale: i18n.language.replace("-", "_"),
        throwExceptionOnParseError: false,
      });
    },
    [i18n.language]
  );

  const data = useMemo(() => {
    if (!schedules) return [];

    return schedules.map((schedule) => ({
      ...schedule,
      active: schedule.active
        ? t("common.fields.active")
        : t("common.fields.inactive"),
      expression: cronTranslation(schedule.expression),
      actions: <Action {...schedule} />,
    }));
  }, [schedules, t, cronTranslation]);

  return (
    <Box width="100%" p="10">
      <Heading>{t("schedule.title")}</Heading>
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

export default Schedules;
