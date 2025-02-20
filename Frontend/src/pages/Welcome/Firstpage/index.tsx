import React, { useCallback } from "react";
import { Box, Flex, Text, Heading, Divider, Icon } from "@chakra-ui/react";
import {
  FaCheck,
  FaTimesCircle,
  FaHourglassHalf,
  FaRobot,
  FaCogs,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { updateTutorials } from "@apis/users";
import useAuth from "@hooks/useAuth";
import Steps from "@components/organisms/Steps";

const steps = [
  {
    title: "Introdução",
    description: "Visão geral do Streamline",
    content: (
      <Box mt={4}>
        <Heading size="lg" mb={4}>
          Bem-vindo ao Streamline!
        </Heading>
        <Text fontSize="lg" mb={4}>
          O Streamline é uma plataforma de automação de processos que reduz o TOIL e melhora a eficiência operacional.
        </Text>
        <Text>
          Iremos guiá-lo pelos principais recursos do sistema, incluindo workflows, automação de tarefas e integrações com APIs.
        </Text>
      </Box>
    ),
  },
  {
    title: "Automação de Processos",
    description: "Automatize tarefas e reduza o TOIL",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Automação Inteligente
        </Heading>
        <Text fontSize="lg" mb={4}>
          Com o Streamline, você pode criar workflows sem precisar programar, utilizando triggers, requisições de APIs e assinaturas de documentos.
        </Text>
        <Divider my={4} />
        <Flex align="center" mb={4}>
          <Icon as={FaRobot} boxSize={6} color="blue.500" mr={4} />
          <Heading size="sm">Workflows</Heading>
        </Flex>
        <Text>
          Crie fluxos automatizados para envio de e-mails, integrações com times e processamento de tarefas recorrentes.
        </Text>
        <Divider my={4} />
        <Flex align="center" mb={4}>
          <Icon as={FaCogs} boxSize={6} color="green.500" mr={4} />
          <Heading size="sm">Triggers</Heading>
        </Flex>
        <Text>
          Dispare ações automáticas com base em formulários, rotinas e webhooks, garantindo eficiência nos processos.
        </Text>
      </Box>
    ),
  },
  {
    title: "Status dos Tickets",
    description: "Monitore o progresso das tarefas",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Status dos Tickets
        </Heading>
        <Text fontSize="lg" mb={4}>
          O Streamline permite acompanhar as tarefas por meio de status personalizáveis, garantindo visibilidade total do processo.
        </Text>
        <Divider my={4} />
        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaHourglassHalf} boxSize={6} color="yellow.500" mr={4} />
          <Text fontWeight="bold">Em Andamento</Text>
        </Flex>
        <Text>O ticket está em progresso e aguarda finalização.</Text>
        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaCheck} boxSize={6} color="teal.500" mr={4} />
          <Text fontWeight="bold">Concluído</Text>
        </Flex>
        <Text>O ticket foi finalizado com sucesso.</Text>
        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaTimesCircle} boxSize={6} color="red.500" mr={4} />
          <Text fontWeight="bold">Cancelado</Text>
        </Flex>
        <Text>O ticket foi cancelado e pode ser reavaliado.</Text>
      </Box>
    ),
  },
];

const FirstPage: React.FC = () => {
  const [auth] = useAuth();
  const navigate = useNavigate();

  const handleFinish = useCallback(() => {
    if (!auth) return;
    updateTutorials(auth.id, "first-page");
    navigate("/welcome/second-page");
  }, [navigate]);

  return <Steps steps={steps} onFinish={handleFinish} />;
};

export default FirstPage;
