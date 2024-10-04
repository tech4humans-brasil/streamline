import { getProjects } from "@apis/project";
import { Box, Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import Select from "@components/atoms/Inputs/Select";
import ShareProject from "@components/atoms/ShareProject";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import VariableForm from "../Variables";
import { FaPen } from "react-icons/fa";

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ project: string }>();

  const methods = useForm({
    defaultValues: {
      project: params.project ?? "",
    },
  });

  const project = methods.watch("project");

  const {
    data: { projects } = {},
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const handleCreate = useCallback(() => {
    navigate(`/portal/project`);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/portal/project/${project}`);
  }, [navigate, project]);

  const handleAlterProject = useCallback(
    (e: { project: string }) => {
      if (e.project) {
        navigate(`/portal/projects/${e.project}`);
      } else {
        navigate(`/portal/projects`);
      }
    },
    [navigate]
  );

  const onSubmit = methods.handleSubmit((data) => {
    handleAlterProject(data);
  });

  const options = useMemo(() => {
    return projects?.map((project) => ({
      value: project._id,
      label: project.name,
    }));
  }, [projects]);

  useEffect(() => {
    handleAlterProject({ project });
  }, [project]);

  const projectData = useMemo(() => {
    return projects?.find((p) => p._id === project);
  }, [projects, project]);

  return (
    <Card
      w="100%"
      display="flex"
      direction="row"
      borderRadius={0}
      justifyContent="space-between"
      alignItems="center"
      p="2"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="bg.navbar"
    >
      <Flex direction="row" gap="3" alignItems="center">
        <Heading size="md" fontWeight="bold">
          {t(`projects.title`)}
        </Heading>

        <Flex alignItems="center" gap="2">
          <FormProvider {...methods}>
            <search onSubmit={onSubmit}>
              <Box w={300}>
                <Select
                  input={{
                    label: "",
                    id: "project",
                    placeholder: t("projects.select"),
                    options: options ?? [],
                  }}
                  isLoading={isFetching}
                />
              </Box>
            </search>
          </FormProvider>

          <Button
            colorScheme="blue"
            onClick={handleEdit}
            variant="outline"
            size="sm"
            isDisabled={!project}
          >
            <FaPen />
          </Button>

          {isError && (
            <Box color="red.500" fontSize="sm">
              {t("projects.error")}
            </Box>
          )}
        </Flex>
        <Box opacity={0.7}>
          <Text fontSize="sm" noOfLines={1}>
            {projectData?.description}
          </Text>
        </Box>
      </Flex>

      <Flex gap="2" align="center">
        {projectData && <ShareProject permissions={projectData?.permissions} />}
        {projectData && (
          <Can permission="project.update">
            <VariableForm />
          </Can>
        )}

        <Can permission="project.create">
          <Button
            colorScheme="blue"
            onClick={handleCreate}
            variant="outline"
            size="sm"
          >
            {t("projects.create")}
          </Button>
        </Can>
      </Flex>
    </Card>
  );
};

export default Navbar;
