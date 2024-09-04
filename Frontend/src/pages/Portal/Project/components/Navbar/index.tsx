import { getProjects } from "@apis/project";
import { Box, Button, Card, Flex, Heading } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import Select from "@components/atoms/Inputs/Select";
import ShareProject from "@components/atoms/ShareProject";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const methods = useForm({
    mode: "onBlur",
    defaultValues: {
      project: searchParams.get("project") ?? "",
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

  const handleAlterProject = useCallback(
    (e: { project: string }) => {
      if (e.project) {
        setSearchParams({ project: e.project });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
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

        <Box w="300px">
          <FormProvider {...methods}>
            <search onSubmit={onSubmit}>
              <Select
                input={{
                  label: "",
                  id: "project",
                  placeholder: t("projects.select"),
                  options: options ?? [],
                }}
                isLoading={isFetching}
              />
            </search>
          </FormProvider>

          {isError && (
            <Box color="red.500" fontSize="sm">
              {t("projects.error")}
            </Box>
          )}
        </Box>
      </Flex>

      <Flex gap="2" align="center">
        {projectData && <ShareProject permissions={projectData?.permissions} />}

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
