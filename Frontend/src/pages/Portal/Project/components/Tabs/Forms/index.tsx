import { Box, Flex, Tag, Button, Spinner } from "@chakra-ui/react";
import ProjectItem from "@components/molecules/ProjectItem";
import Pagination from "@components/organisms/Pagination";
import { useQuery } from "@tanstack/react-query";
import { getForms } from "@apis/form";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import { FaPen, FaPlusCircle } from "react-icons/fa";
import { memo, useCallback } from "react";
import { useTabQuery } from "@hooks/useTabQuery";
import RefreshButton from "@components/molecules/RefreshButton";

const FIVE_MINUTES = 5 * 60 * 1000;

const FormsTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { project = "" } = useParams<{ project: string }>() || {};
  const params = searchParams.toString() + "&project=" + project;
  const isActiveTab = useTabQuery(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["forms", params],
    queryFn: getForms,
    enabled: !!project && isActiveTab,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  if (isError) return <Box>Error loading forms</Box>;

  return (
    <>
      <Box w="full" p={[4, 2]} textAlign="right" mb={4}>
        <Flex justifyContent="flex-end" gap={2}>
          <Create route="form" />
          <RefreshButton onClick={refetch} isLoading={isLoading} />
        </Flex>
      </Box>
      <ProjectItem.List>
        {isLoading && (
          <Flex justifyContent="center" alignItems="center" h="100%">
            <Spinner />
          </Flex>
        )}
        {data?.forms?.map((form) => (
          <ProjectItem.Container key={form._id}>
            <ProjectItem.Body>
              <ProjectItem.Icon>
                <BsFileEarmarkTextFill />
              </ProjectItem.Icon>
              <div>
                <ProjectItem.Title>{form.name}</ProjectItem.Title>
                <ProjectItem.Text>
                  {t(`forms.type.${form.type}`)}
                </ProjectItem.Text>
              </div>
            </ProjectItem.Body>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              gap={4}
              p={2}
            >
              <Tag colorScheme={form.active ? "green" : "red"}>
                {form.active
                  ? t("common.fields.active")
                  : t("common.fields.inactive")}
              </Tag>
              <Edit route="form" id={form._id} projectId={project} />
            </Flex>
          </ProjectItem.Container>
        ))}
      </ProjectItem.List>
      <Pagination pagination={data?.pagination} />
    </>
  );
};

const Create: React.FC<{
  route: "form";
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
  route: "form";
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

export default FormsTab; 