import { deleteActivity, exportActivity, getActivity } from "@apis/activity";
import { Box, Center, IconButton, useToast } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import ActivityDetails from "@components/organisms/ActivityDetails";
import ActivityProvider from "@contexts/ActivityContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import React, { memo, useCallback } from "react";
import {
  FaCheckCircle,
  FaDownload,
  FaExclamationCircle,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const Activity: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const toast = useToast();

  const {
    data: activity,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["activity", id],
    queryFn: getActivity,
    refetchInterval: 5000,
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
    <Center p={0} flexDirection={"column"}>
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

        <Can permission="activity.delete">
          <DeleteButton id={id} />
        </Can>
      </Box>
    </Center>
  );
};

export default Activity;

const DeleteButton = memo(({ id }: { id: string }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const { mutateAsync: mutateDelete, isPending: isPendingDelete } = useMutation(
    {
      mutationKey: ["activity", id],
      mutationFn: deleteActivity,
      onSuccess: () => {
        toast({
          title: "Ticket excluído com sucesso",
          status: "success",
          duration: 9000,
          isClosable: true,
          icon: <FaCheckCircle />,
        });
        navigate(-1);
      },
      onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
        toast({
          title: "Erro ao excluir ticket",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
          icon: <FaExclamationCircle />,
        });
      },
    }
  );

  const handleDelete = useCallback(() => {
    mutateDelete(id);
  }, [mutateDelete, id]);

  return (
    <IconButton
      aria-label="delete"
      colorScheme="red"
      onClick={handleDelete}
      isLoading={isPendingDelete}
    >
      <FaTrash />
    </IconButton>
  );
});
