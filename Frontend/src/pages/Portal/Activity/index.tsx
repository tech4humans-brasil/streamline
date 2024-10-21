import { exportActivity, getActivity } from "@apis/activity";
import { Box, Button, Center, IconButton, useToast } from "@chakra-ui/react";
import ActivityDetails from "@components/organisms/ActivityDetails";
import ActivityProvider from "@contexts/ActivityContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import React, { useCallback } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaDownload,
  FaExclamationCircle,
  FaSync,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const Activity: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: activity,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["activity", id],
    queryFn: getActivity,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["activity", id, "export"],
    mutationFn: exportActivity,
    onSuccess: (data) => {
      toast({
        title: "Dados exportados com sucesso",
        status: "success",
        duration: 9000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
      window.open(data.url);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: "Erro ao exportar dados",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleExport = useCallback(() => {
    mutateAsync(id);
  }, [mutateAsync, id]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Center width="100%" p={4} flexDirection={"column"}>
      <Box w="100%" mb={4}>
        <Button variant="ghost" onClick={() => navigate(-1)} w="fit-content">
          <FaArrowLeft />
        </Button>
      </Box>
      <ActivityProvider refetch={refetch}>
        <ActivityDetails {...{ activity, isLoading }} />
      </ActivityProvider>
      <Box
        position="fixed"
        top={4}
        right={4}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <IconButton
          aria-label="Refresh"
          onClick={handleRefresh}
          isLoading={isRefetching}
        >
          <FaSync />
        </IconButton>

        <IconButton
          aria-label="export"
          onClick={handleExport}
          isLoading={isPending}
        >
          <FaDownload />
        </IconButton>
      </Box>
    </Center>
  );
};

export default Activity;
