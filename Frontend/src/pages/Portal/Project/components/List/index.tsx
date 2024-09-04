import { Box, Button } from "@chakra-ui/react";
import Accordion from "@components/atoms/Accordion";
import ProjectItem from "@components/molecules/ProjectItem";
import Pagination from "@components/organisms/Pagination";
import useProject from "@hooks/useProject";
import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import { FaPlusCircle, FaRegEnvelope, FaTags } from "react-icons/fa";
import { GoWorkflow } from "react-icons/go";
import { useNavigate, useSearchParams } from "react-router-dom";

// import { Container } from './styles';

const List: React.FC = () => {
  const project = useProject();
  const { t } = useTranslation();

  return (
    <Box w="full" p={[4, 2]}>
      <Accordion.Container defaultIndex={[0, 1]} allowToggle allowMultiple>
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
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>
            <Pagination pagination={project?.pagination?.forms} />
          </Accordion.Panel>
        </Accordion.Item>

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
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>

            <Pagination pagination={project?.pagination?.workflows} />
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
                </ProjectItem.Container>
              ))}
            </ProjectItem.List>
            <Pagination pagination={project?.pagination?.statuses} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Container>
    </Box>
  );
};

export default List;

const Create: React.FC<{ route: "email" | "workflow" | "status" | "form" }> =
  memo(({ route }) => {
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
