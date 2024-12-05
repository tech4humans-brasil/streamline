import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllocations } from "@apis/allocation";
import AllocationForm from "./AllocationForm";
import AllocationCard from "./AllocationCard";
import {
  Button,
  Box,
  Heading,
  useDisclosure,
  Flex,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

const UserAllocations: React.FC = () => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { id: userId = "" } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["allocations", userId],
    queryFn: getAllocations,
  });

  const allocationsData = useMemo(() => {
    if (!user)
      return {
        actives: [],
        inactive: [],
      };
    return {
      actives: user.allocations.filter((allocation) => !allocation.endDate),
      inactive: user.allocations.filter((allocation) => allocation.endDate),
    };
  }, [user]);

  return (
    <Box p={4}>
      <Flex direction="row" justify="space-between" align="center">
        <Flex direction="row" justify={"flex-start"} align="center" gap={4}>
          <Button variant="ghost" onClick={handleBack} w="fit-content">
            <FaArrowLeft />
          </Button>
          <Heading size="lg">
            {t("allocations.title")} do {user?.name}
          </Heading>
        </Flex>

        <Button colorScheme="blue" onClick={onOpen}>
          {t("allocation.create")}
        </Button>
      </Flex>

      <Divider mt={4} />

      {isLoading && <Spinner margin="auto" />}

      <Box mt={4}>
        <Heading size="md">{t("common.fields.active")}</Heading>
        <Flex direction="row" mt={4} wrap="wrap">
          {allocationsData?.actives.map((allocation) => (
            <AllocationCard key={allocation._id} allocation={allocation} />
          ))}
        </Flex>
      </Box>

      <Box mt={4}>
        <Heading size="md">{t("common.fields.inactive")}</Heading>
        <Flex direction="row" mt={4} wrap="wrap">
          {allocationsData?.inactive.map((allocation) => (
            <AllocationCard key={allocation._id} allocation={allocation} />
          ))}
        </Flex>
      </Box>

      <AllocationForm isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default UserAllocations;
