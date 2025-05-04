import { Box, Flex, Tag, Button } from "@chakra-ui/react";
import ProjectItem from "@components/molecules/ProjectItem";
import Pagination from "@components/organisms/Pagination";
import { useQuery } from "@tanstack/react-query";
import { getSchedules } from "@apis/schedule";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import { FaPen, FaPlusCircle } from "react-icons/fa";
import { memo, useCallback } from "react";
import cronstrue from "cronstrue/i18n";
import { useTabQuery } from "@hooks/useTabQuery";
import RefreshButton from "@components/molecules/RefreshButton";

const FIVE_MINUTES = 5 * 60 * 1000;

const SchedulesTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { project = "" } = useParams<{ project: string }>() || {};
  const params = searchParams.toString() + "&project=" + project;
  const isActiveTab = useTabQuery(4);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["schedules", params],
    queryFn: getSchedules,
    enabled: !!project && isActiveTab,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
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

  if (isLoading) return <Box>Loading...</Box>;
  if (isError) return <Box>Error loading schedules</Box>;

  return (
    <>
      <Box w="full" p={[4, 2]} textAlign="right" mb={4}>
        <Flex justifyContent="flex-end" gap={2}>
          <Create route="schedule" />
          <RefreshButton onClick={refetch} isLoading={isLoading} />
        </Flex>
      </Box>
      <ProjectItem.List>
        {data?.schedules?.map((schedule) => (
          <ProjectItem.Container key={schedule._id}>
            <ProjectItem.Body>
              <ProjectItem.Icon>
                <BsFileEarmarkTextFill />
              </ProjectItem.Icon>
              <div>
                <ProjectItem.Title>{schedule.name}</ProjectItem.Title>
                <ProjectItem.Text>
                  {cronTranslation(schedule.expression)}
                </ProjectItem.Text>
              </div>
            </ProjectItem.Body>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              gap={4}
              p={2}
            >
              <Tag colorScheme={schedule.active ? "green" : "red"}>
                {schedule.active
                  ? t("common.fields.active")
                  : t("common.fields.inactive")}
              </Tag>
              <Edit route="schedule" id={schedule._id} projectId={project} />
            </Flex>
          </ProjectItem.Container>
        ))}
      </ProjectItem.List>
      <Pagination pagination={data?.pagination} />
    </>
  );
};

const Create: React.FC<{
  route: "schedule";
}> = memo(({ route }) => {
  const navigate = useNavigate();
  const params = useParams<{ project: string }>();
  const project = params.project ?? "";

  const handleClick = useCallback(() => {
    navigate(`/portal/project/${project}/${route}`);
  }, [navigate, project, route]);

  if (!project) return null;

  return (
    <Box w="full" p={[4, 2]} textAlign="right" mb={4}>
      <Button onClick={handleClick} variant="outline">
        <FaPlusCircle />
      </Button>
    </Box>
  );
});

const Edit: React.FC<{
  route: "schedule";
  id: string;
  projectId: string;
}> = memo(({ route, id, projectId }) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/portal/project/${projectId}/${route}/${id}`);
  }, [navigate, projectId, route]);

  if (!projectId) return null;

  return (
    <Box textAlign="right">
      <Button onClick={handleClick} variant="outline">
        <FaPen />
      </Button>
    </Box>
  );
});

export default SchedulesTab; 