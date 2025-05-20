import { Box, Button, Flex } from "@chakra-ui/react";
import IPagination from "@interfaces/Pagination";
import React, { useCallback, useMemo } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";

interface PaginationProps {
  pagination?: IPagination["pagination"];
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, isLoading }) => {
  const [, setSearchParams] = useSearchParams();

  const handlePageClick = useCallback(
    (data: { selected: number }) => {
      setSearchParams((prev) => {
        const searchParams = new URLSearchParams(prev);

        searchParams.set("page", (data.selected + 1).toString());

        return searchParams;
      });
    },
    [setSearchParams]
  );

  const arrayPages = useMemo(() => {
    if (!pagination) {
      return [];
    }

    const pages = Array.from(Array(pagination.totalPages | 0).keys());

    if (pages.length > 5) {
      if (pagination.page < 3) {
        return pages.slice(0, 5);
      }

      if (pagination.page > pagination.totalPages - 3) {
        return pages.slice(pagination.totalPages - 5, pagination.totalPages);
      }

      return pages.slice(pagination.page - 2, pagination.page + 3);
    }

    return pages;
  }, [pagination]);

  if (!pagination) {
    return null;
  }

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      mt={4}
      width="100%"
      p={4}
    >
      <Box>
        {pagination.count} de {pagination.total}
      </Box>
      <Box>
        <Button
          onClick={() => handlePageClick({ selected: pagination.page - 2 })}
          mr={2}
          size="sm"
          isDisabled={pagination.page === 1}
          isLoading={isLoading}
        >
          <BiChevronLeft size={20} />
        </Button>

        {arrayPages.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageClick({ selected: page })}
            mr={2}
            size="sm"
            isDisabled={pagination.page === page + 1 || isLoading}
            boxShadow="md"
          >
            {page + 1}
          </Button>
        ))}

        <Button
          onClick={() => handlePageClick({ selected: pagination.page })}
          mr={2}
          size="sm"
          isDisabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
          isLoading={isLoading}
        >
          <BiChevronRight size={20} />
        </Button>
      </Box>
    </Flex>
  );
};

export default Pagination;
