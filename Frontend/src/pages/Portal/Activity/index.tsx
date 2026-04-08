import { deleteActivity, exportActivity, getActivity } from "@apis/activity";
import { Center, useToast } from "@chakra-ui/react";
import ActivityDetails from "@components/organisms/ActivityDetails";
import ActivityProvider from "@contexts/ActivityContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import React, { useCallback, useMemo } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Activity: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const { mutateAsync: exportMutate, isPending: isExportPending } =
    useMutation({
      mutationKey: ["activity", id, "export"],
      mutationFn: exportActivity,
      onSuccess: (data) => {
        toast({
          title: t("activityDetails.actions.exportSuccess"),
          status: "success",
          duration: 9000,
          isClosable: true,
          icon: <FaCheckCircle />,
        });
        window.open(data.url);
      },
      onError: (
        error: AxiosError<{ message: string; statusCode: number }>
      ) => {
        toast({
          title: t("activityDetails.actions.exportError"),
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
          icon: <FaExclamationCircle />,
        });
      },
    });

  const { mutateAsync: deleteMutate, isPending: isDeletePending } = useMutation(
    {
      mutationKey: ["activity", id, "delete"],
      mutationFn: deleteActivity,
      onSuccess: () => {
        toast({
          title: t("activityDetails.actions.deleteSuccess"),
          status: "success",
          duration: 9000,
          isClosable: true,
          icon: <FaCheckCircle />,
        });
        navigate(-1);
      },
      onError: (
        error: AxiosError<{ message: string; statusCode: number }>
      ) => {
        toast({
          title: t("activityDetails.actions.deleteError"),
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
          icon: <FaExclamationCircle />,
        });
      },
    }
  );

  const handleExport = useCallback(() => {
    exportMutate(id);
  }, [exportMutate, id]);

  const handleDelete = useCallback(() => {
    deleteMutate(id);
  }, [deleteMutate, id]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const ticketPageActions = useMemo(
    () => ({
      onRefresh: handleRefresh,
      isRefreshing: isRefetching,
      onExport: handleExport,
      isExporting: isExportPending,
      onDelete: handleDelete,
      isDeleting: isDeletePending,
    }),
    [
      handleRefresh,
      isRefetching,
      handleExport,
      isExportPending,
      handleDelete,
      isDeletePending,
    ]
  );

  return (
    <Center p={0} flexDirection={"column"}>
      <ActivityProvider
        refetch={refetch}
        ticketPageActions={ticketPageActions}
      >
        <ActivityDetails {...{ activity, isLoading }} />
      </ActivityProvider>
    </Center>
  );
};

export default Activity;
