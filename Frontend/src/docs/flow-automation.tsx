import { Flex, Text, Box, Heading, Divider } from "@chakra-ui/react";
import { BiMailSend, BiLogoJavascript } from "react-icons/bi";
import { GoTag, GoWorkflow } from "react-icons/go";
import { FaWpforms, FaPlusSquare } from "react-icons/fa";
import { RiWebhookLine } from "react-icons/ri";
import { AiFillSignature } from "react-icons/ai";
import { BiGitRepoForked } from "react-icons/bi";

const data = [
  {
    category: "Fluxo",
    nodes: [
      {
        icon: <BiGitRepoForked size={24} />,
        title: "Condicional",
        description:
          "Avalia condições e direciona o fluxo com base em critérios configuráveis.",
      },
      {
        icon: <GoTag size={24} />,
        title: "Mudança de Status",
        description:
          "Atualiza o status atual de uma atividade para indicar em qual etapa do fluxo ela está.",
      },
      {
        icon: <GoWorkflow size={24} />,
        title: "Mudança de Fluxo",
        description:
          "Permite a alternância entre diferentes fluxos de trabalho, reutilizando fluxos existentes.",
      },
    ],
  },
  {
    category: "Comunicação",
    nodes: [
      {
        icon: <BiMailSend size={24} />,
        title: "Envio de Email",
        description:
          "Gerencia o envio de emails automáticos para requisição de informações e comunicações gerais.",
      },
      {
        icon: <FaWpforms size={24} />,
        title: "Interação",
        description:
          "Solicita informações específicas de um destinatário, como entregas parciais ou envio final de documentos.",
      },
    ],
  },
  {
    category: "Integração",
    nodes: [
      {
        icon: <RiWebhookLine size={24} />,
        title: "Requisição Web",
        description:
          "Realiza solicitações HTTP para integração com sistemas externos, como jira, discord...",
      },
      {
        icon: <AiFillSignature size={24} />,
        title: "Assinatura Clicksign",
        description:
          "Integra com a plataforma Clicksign para gerenciamento e coleta de assinaturas digitais.",
      },
    ],
  },
  {
    category: "Automação",
    nodes: [
      {
        icon: <FaPlusSquare size={24} />,
        title: "Criar Novo Ticket",
        description:
          "Cria automaticamente um novo ticket baseado em um formulário pré-definido.",
      },
      {
        icon: <BiLogoJavascript size={24} />,
        title: "Script",
        description:
          "Executa scripts personalizados para automação de tarefas específicas.",
      },
    ],
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
        <Text mb={5}>
          Abaixo estão listados os componentes principais que podem ser
          utilizados para construir fluxos de trabalho automatizados:
        </Text>

        {data.map((category, categoryIndex) => (
          <Box key={categoryIndex} mb={8}>
            <Heading as="h2" size="md" mb={4} color="blue.500">
              {category.category}
            </Heading>
            
            {category.nodes.map((node, nodeIndex) => (
              <Box key={nodeIndex} mb={5}>
                <Flex alignItems="center" gap={3}>
                  {node.icon}
                  <Heading as="h3" size="sm">
                    {node.title}
                  </Heading>
                </Flex>
                <Text mt={2}>{node.description}</Text>
                {nodeIndex < category.nodes.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <Heading as="h2" fontSize="lg" mt={5} mb={3}>
        Como Utilizar Esses Componentes?
      </Heading>
      <Text mb={5}>
        Esses componentes são utilizados para criar e gerenciar fluxos de
        trabalho automáticos dentro do sistema. Cada bloco possui uma função
        específica e pode ser combinado com outros blocos para criar fluxos
        complexos e personalizados. Arraste e solte os blocos desejados no
        editor de fluxo e configure suas propriedades para atender às
        necessidades do seu processo.
      </Text>
    </Flex>
  );
};

export default HelpFlowAutomation;
