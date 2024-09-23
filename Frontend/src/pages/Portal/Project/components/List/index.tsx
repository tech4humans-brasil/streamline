import { Box, Button, Flex, Tag } from "@chakra-ui/react";
import Accordion from "@components/atoms/Accordion";
import ProjectItem from "@components/molecules/ProjectItem";
import Pagination from "@components/organisms/Pagination";
import useProject from "@hooks/useProject";
import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import { FaPen, FaPlusCircle, FaRegEnvelope, FaTags } from "react-icons/fa";
import { GoWorkflow } from "react-icons/go";
import { useNavigate, useSearchParams } from "react-router-dom";
import cronstrue from "cronstrue/i18n";

const List: React.FC = () => {
  const project = useProject();
  const { t, i18n } = useTranslation();

  const cronTranslation = useCallback(
    (expression: string) => {
      return cronstrue.toString(expression, {
        locale: i18n.language.replace("-", "_"),
        throwExceptionOnParseError: false,
      });
    },
    [i18n.language]
  );

  return (
    <Box w="full" p={[4, 2]}>
      <Accordion.Container
        defaultIndex={[0, 1, 2, 3]}
        allowToggle
        allowMultiple
      >
        <Accordion.Item>
          <Accordion.Button>{t("workflows.title")}</Accordion.Button>
          <Accordion.Panel>
            <ProjectItem.List>
              <Create route="workflow" />
              {project?.workflows?.map((workflow) => (
                <ProjectItem.Container key={workflow._id}>
                  <ProjectItem.Body>
                    <ProjectItem.Icon>
                      <GoWorkflow />
                    </ProjectItem.Icon>

                    <div>
                      <ProjectItem.Title>{workflow.name}</ProjectItem.Title>
                    </div>
                  </ProjectItem.Body>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    gap={4}
                    p={2}
                  >
                    <Tag colorScheme={workflow.active ? "green" : "red"}>
                      {workflow.active
                        ? t("common.fields.active")
                        : t("common.fields.inactive")}
                    </Tag>
                    <Edit route="workflow" id={workflow._id} />
                  </Flex>
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>

            <Pagination pagination={project?.pagination?.workflows} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item>
          <Accordion.Button>{t("forms.title")}</Accordion.Button>
          <Accordion.Panel>
            <ProjectItem.List>
              <Create route="form" />
              {project?.forms?.map((form) => (
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
                    <Edit route="form" id={form._id} />
                  </Flex>
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>
            <Pagination pagination={project?.pagination?.forms} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item>
          <Accordion.Button>{t("emails.title")}</Accordion.Button>
          <Accordion.Panel>
            <Create route="email" />
            <ProjectItem.List>
              {project?.emails?.map((email) => (
                <ProjectItem.Container key={email._id}>
                  <ProjectItem.Body>
                    <ProjectItem.Icon>{<FaRegEnvelope />}</ProjectItem.Icon>
                    <div>
                      <ProjectItem.Title>{email.slug}</ProjectItem.Title>
                      <ProjectItem.Text>{email.subject}</ProjectItem.Text>
                    </div>
                  </ProjectItem.Body>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    gap={4}
                    p={2}
                  >
                    <Edit route="email" id={email._id} />
                  </Flex>
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>

            <Pagination pagination={project?.pagination?.emails} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item>
          <Accordion.Button>{t("statuses.title")}</Accordion.Button>
          <Accordion.Panel>
            <Create route="status" />
            <ProjectItem.List>
              {project?.statuses?.map((status) => (
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
                    <Edit route="status" id={status._id} />
                  </Flex>
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>
            <Pagination pagination={project?.pagination?.statuses} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item>
          <Accordion.Button>{t("schedule.title")}</Accordion.Button>
          <Accordion.Panel>
            <ProjectItem.List>
              <Create route="schedule" />
              {project?.schedules?.map((schedule) => (
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
                    <Edit route="schedule" id={schedule._id} />
                  </Flex>
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>
            <Pagination pagination={project?.pagination?.forms} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Container>
    </Box>
  );
};

export default List;

const Create: React.FC<{
  route: "email" | "workflow" | "status" | "form" | "schedule";
}> = memo(({ route }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const project = searchParams.get("project");

  const handleClick = useCallback(() => {
    navigate(`/portal/${route}`, { state: { project } });
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
  route: "email" | "workflow" | "status" | "form" | "schedule";
  id: string;
}> = memo(({ route, id }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const project = searchParams.get("project");

  const handleClick = useCallback(() => {
    navigate(`/portal/${route}/${id}`, { state: { project } });
  }, [navigate, project, route]);

  if (!project) return null;

  return (
    <Box textAlign="right">
      <Button onClick={handleClick} variant="outline">
        <FaPen />
      </Button>
    </Box>
  );
});
