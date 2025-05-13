import { Box, Flex, Button, Spinner } from "@chakra-ui/react";
import ProjectItem from "@components/molecules/ProjectItem";
import Pagination from "@components/organisms/Pagination";
import { useQuery } from "@tanstack/react-query";
import { getStatuses } from "@apis/status";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { FaTags, FaPen, FaPlusCircle } from "react-icons/fa";
import { memo, useCallback } from "react";
import { useTabQuery } from "@hooks/useTabQuery";
import RefreshButton from "@components/molecules/RefreshButton";

const FIVE_MINUTES = 5 * 60 * 1000;

const StatusesTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { project = "" } = useParams<{ project: string }>() || {};
  const params = searchParams.toString() + "&project=" + project;
  const isActiveTab = useTabQuery(3);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["statuses", params],
    queryFn: getStatuses,
    enabled: !!project && isActiveTab,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  if (isError) return <Box>Error loading statuses</Box>;

  return (
    <>
      <Box w="full" p={[4, 2]} textAlign="right" mb={4}>
        <Flex justifyContent="flex-end" gap={2}>
          <Create route="status" />
          <RefreshButton onClick={refetch} isLoading={isLoading} />
        </Flex>
      </Box>
      <ProjectItem.List>
        {isLoading && (
          <Flex justifyContent="center" alignItems="center" h="100%">
            <Spinner />
          </Flex>
        )}
        {data?.statuses?.map((status) => (
          <ProjectItem.Container key={status._id}>
            <ProjectItem.Body>
              <ProjectItem.Icon>{<FaTags />}</ProjectItem.Icon>
              <ProjectItem.Title>{status.name}</ProjectItem.Title>
            </ProjectItem.Body>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              gap={4}
              p={2}
            >
              <Edit route="status" id={status._id} projectId={project} />
            </Flex>
          </ProjectItem.Container>
        ))}
      </ProjectItem.List>
      <Pagination pagination={data?.pagination} />
    </>
  );
};

const Create: React.FC<{
  route: "status";
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
  route: "status";
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

export default StatusesTab; 