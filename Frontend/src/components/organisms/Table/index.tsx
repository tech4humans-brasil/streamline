import React from "react";
import {
  useBreakpointValue,
  Box,
  Table as ChakraTable,
  TableCaption,
  Text,
  VStack,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import TableBody, { TableData } from "@components/molecules/Table/TableBody";
import TableHead, {
  TableHeadProps,
} from "@components/molecules/Table/TableHead";
import { useTranslation } from "react-i18next";

type TableProps = {
  columns: TableHeadProps["columns"];
  tableTitle?: string;
  data: TableData[] | null;
  isLoading?: boolean;
};

const Table: React.FC<TableProps> = ({
  columns,
  data,
  tableTitle,
  isLoading,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { t } = useTranslation();

  return isMobile ? (
    <Box w="100%">
      <Text fontSize="lg" fontWeight="bold" w="100%">
        {tableTitle}
      </Text>
      <Flex direction="column" gap={4}>
        {isLoading && <Spinner />}

        {data?.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            {t("table.noData")}
          </Text>
        )}

        {data?.map((item) => (
          <CardBody columns={columns} data={item} key={item._id} />
        ))}
      </Flex>
    </Box>
  ) : (
    <ChakraTable>
      <TableCaption>{tableTitle}</TableCaption>
      <TableHead columns={columns} />
      <TableBody columns={columns} data={data ?? []} />
    </ChakraTable>
  );
};

export default Table;

const CardBody = ({
  columns,
  data,
}: {
  columns: TableHeadProps["columns"];
  data: TableData;
}) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" display="relative" w="100%">
      <VStack spacing={4} align="start" w="100%">
        {columns.map((column) => (
          <CardItem key={column.key} column={column} data={data} />
        ))}
      </VStack>
    </Box>
  );
};

const CardItem = ({
  column,
  data,
}: {
  column: TableHeadProps["columns"][0];
  data: TableData;
}) => {
  const { t } = useTranslation();

  return (
    <Flex key={column.key} gap={2} direction="column">
      <Text fontSize="sm" fontWeight="bold">
        {t(column.label)}:
      </Text>
      <Text fontSize="sm">{data[column.key] as React.ReactNode}</Text>
    </Flex>
  );
};
