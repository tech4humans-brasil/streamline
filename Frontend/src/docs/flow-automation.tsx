import { Flex, Text, Box, Heading, Divider } from "@chakra-ui/react";
import { SwapWorkflowIcon } from "@components/atoms/Workflow/Nodes/SwapWorkflow";
import { InteractionIcon } from "@components/atoms/Workflow/Nodes/Interaction";
import { ConditionalIcon } from "@components/atoms/Workflow/Nodes/Conditional";
import { SendEmailIcon } from "@components/atoms/Workflow/Nodes/SendEmail";
import { ChangeStatusIcon } from "@components/atoms/Workflow/Nodes/ChangeStatus";
import { WebRequestIcon } from "@components/atoms/Workflow/Nodes/WebRequest";

const data = [
  {
    icon: <SendEmailIcon />,
    title: "Envio de Email",
    description:
      "Gerencia o envio de emails automáticos para requisição de informações e comunicações gerais.",
  },
  {
    icon: <ChangeStatusIcon />,
    title: "Mudança de Status",
    description:
      "Atualiza o status atual de uma atividade para indicar em qual etapa do fluxo ela está.",
  },
  {
    icon: <SwapWorkflowIcon />,
    title: "Mudança de Fluxo",
    description:
      "Permite a alternância entre diferentes fluxos de trabalho, reutilizando fluxos existentes.",
  },
  {
    icon: <InteractionIcon />,
    title: "Interação",
    description:
      "Solicita informações específicas de um destinatário, como entregas parciais ou envio final de documentos.",
  },
  {
    icon: <ConditionalIcon />,
    title: "Condicional",
    description:
      "Avalia o desempenho do aluno em diferentes fases do TCC, com critérios configuráveis.",
  },
  {
    icon: <WebRequestIcon />,
    title: "Requisição Web",
    description:
      "Realiza solicitações HTTP para integração com sistemas externos, como jira, discord...",
  },
];

const HelpFlowAutomation = () => {
  return (
    <Flex
      p={5}
      mx="auto"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      gap={2}
    >
      <Heading as="h1" size="md" mb={5}>
        Blocos de Fluxo de Trabalho
      </Heading>

      <Box maxW="800px" mx="auto">
        <Heading as="h2" fontSize="lg" mb={3}>
          Componentes de Fluxo de Trabalho
        </Heading>
        <Text mb={5}>
          Abaixo estão listados os componentes principais que podem ser
          utilizados no fluxo de trabalho do TCC:
        </Text>

        {data.map((item, index) => (
          <Box key={index} mb={5}>
            <Flex alignItems="center" gap={3}>
              {item.icon}
              <Heading as="h3" size="md">
                {item.title}
              </Heading>
            </Flex>
            <Text>{item.description}</Text>

            <Divider my={3} />
          </Box>
        ))}
      </Box>

      <Heading as="h2" fontSize="lg" mt={5} mb={3}>
        Como Utilizar Esses Componentes?
      </Heading>
      <Text mb={5}>
        Esses componentes são utilizados para criar e gerenciar fluxos de
        trabalho automáticos dentro do sistema, garantindo que todas as etapas
        do TCC sejam seguidas conforme o planejado. Selecione os componentes
        adequados ao configurar seu fluxo para atender às necessidades
        específicas do processo.
      </Text>
    </Flex>
  );
};

export default HelpFlowAutomation;
