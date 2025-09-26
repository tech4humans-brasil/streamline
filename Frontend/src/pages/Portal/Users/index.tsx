import { getUsers } from "@apis/users";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import Select from "@components/atoms/Inputs/Select";
import Text from "@components/atoms/Inputs/Text";
import Filter from "@components/organisms/Filter";
import Pagination from "@components/organisms/Pagination";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BiEdit, BiRefresh } from "react-icons/bi";
import { FaLaptop } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

const roleMap = {
  admin: "Admin",
  student: "Usuário",
  equipment: "Equipamento",
};

const columns = [
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "email",
    label: "common.fields.email",
  },
  {
    key: "institutes",
    label: "common.fields.institute",
  },
  {
    key: "active",
    label: "common.fields.active",
  },
  {
    key: "roles",
    label: "common.fields.profiles",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
];

const Action = memo((user: { _id: string }) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/portal/user/${user._id}`);
  }, [navigate, user._id]);

  const handleAllocations = useCallback(() => {
    navigate(`/portal/allocations/${user._id}`);
  }, [navigate, user._id]);

  return (
    <div>
      <Can permission="allocation.view">
        <Button mr={2} onClick={handleAllocations} size="sm">
          <FaLaptop size={20} />
        </Button>
      </Can>
      <Can permission="user.update">
        <Button mr={2} onClick={handleEdit} size="sm">
          <BiEdit size={20} />
        </Button>
      </Can>
    </div>
  );
});

const Create = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCreate = useCallback(() => {
    navigate(`/portal/user`);
  }, [navigate]);

  return (
    <div>
      <Can permission="user.create">
        <Button colorScheme="blue" mr={2} onClick={handleCreate} size="sm">
          {t("users.create")}
        </Button>
      </Can>
    </div>
  );
});

const Users: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: { users, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["users", searchParams.toString()],
    queryFn: getUsers,
  });

  const data = useMemo(() => {
    if (!users) return [];

    return users.map((user) => ({
      ...user,
      roles: user.roles.map((role) => roleMap[role]).join(", "),
      active: user.active
        ? t("common.fields.active")
        : t("common.fields.inactive"),
      institutes: user.institutes?.at(0)?.name,
      actions: <Action {...user} />,
    }));
  }, [users]);

  return (
    <Box width="100%" p={[4, 10]}>
      <Heading>{t("users.title")}</Heading>
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
        <Text
          input={{
            label: t("common.fields.name"),
            id: "name",
          }}
        />

        <Text
          input={{
            label: t("common.fields.matriculation"),
            id: "matriculation",
          }}
        />

        <Select
          input={{
            label: t("common.fields.active"),
            id: "active",
            options: [
              { label: t("common.fields.active"), value: "true" },
              { label: t("common.fields.inactive"), value: "false" },
            ],
          }}
        />

        <Select
          input={{
            label: t("common.fields.external"),
            id: "isExternal",
            options: [
              { label: t("common.yes"), value: "true" },
              { label: t("common.no"), value: "false" },
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
          <Heading color="red.500">{t("table.error")}</Heading>
        </Flex>
      )}
    </Box>
  );
};

export default Users;
