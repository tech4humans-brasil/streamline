import React, { useCallback } from "react";
import { Box, Flex, Text, Heading, Divider, Icon } from "@chakra-ui/react";
import { FaTasks, FaFileAlt, FaWpforms } from "react-icons/fa";
import { GoTag, GoWorkflow } from "react-icons/go";
import { BiGitRepoForked, BiMailSend } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { updateTutorials } from "@apis/users";
import useAuth from "@hooks/useAuth";
import { RiWebhookLine } from "react-icons/ri";
import Steps from "@components/organisms/Steps";

const steps = [
  {
    title: "Formulários",
    description: "Tipos de formulários",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Formulários
        </Heading>

        <Text fontSize="lg" mb={4}>
          Os formulários são a base do sistema e são utilizados para capturar as
          informações necessárias ao longo do fluxo de TCC. Eles permitem a
          definição de atividades, submissão de informações e avaliação do
          desempenho dos alunos.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={FaTasks} boxSize={6} color="teal.500" mr={4} />
          <Heading size="sm">
            Formulário de Criação da Atividade (Criação)
          </Heading>
        </Flex>
        <Text>
          Este formulário é utilizado para criar novos tickets no sistema,
          permitindo a definição de parâmetros iniciais como título, descrição,
          prazo e responsáveis.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Enviar solicitação de ferias para o RH.
          Solicitar troca de equipamento.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={FaFileAlt} boxSize={6} color="blue.500" mr={4} />
          <Heading size="sm">
            Formulário de Submissão de Informações (Interação)
          </Heading>
        </Flex>
        <Text>
          Usado durante o fluxo para a submissão de informações necessárias em
          várias etapas, como ações intermediárias, solicitação de novas
          informações ou entrega de documentos.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Enviar informações adicionais caso seja
          aprovado para o cargo.
        </Text>
      </Box>
    ),
  },
  {
    title: "Fluxos de Trabalho",
    description: "Tipos de blocos de automação",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Fluxos de Trabalho
        </Heading>

        <Text fontSize="lg" mb={4}>
          Com base no mapeamento do processo, o fluxo de TCC pode ser modelado
          utilizando cinco componentes parametrizáveis. Esses componentes são
          fundamentais para garantir a flexibilidade e a adaptabilidade do
          sistema, permitindo que ele seja configurado conforme as necessidades
          específicas de diferentes cursos e instituições.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={BiMailSend} boxSize={6} color="teal.500" mr={4} />
          <Heading size="sm">Envio de Email</Heading>
        </Flex>
        <Text>
          Gerencia o envio de emails automáticos para requisição de informações,
          avaliações e comunicações gerais. Pode ser configurado para enviar
          notificações em diferentes pontos do fluxo, como avisos de prazos,
          solicitações de documentos ou feedbacks de avaliações. Ele é ligado a
          um template de email específico e pode ser personalizado conforme a
          necessidade.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Enviar um email para o solicitante informando
          que a solicitação foi aprovada.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={GoWorkflow} boxSize={6} color="orange.500" mr={4} />
          <Heading size="sm">Mudança de Fluxo</Heading>
        </Flex>
        <Text>
          Permite a alternância entre diferentes fluxos de trabalho,
          possibilitando a reutilização de fluxos existentes. Essencial para
          garantir que o sistema possa ser adaptado a diversas situações e
          requisitos específicos.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Após a criação de um ticket, o fluxo pode ser
          alterado para um fluxo de aprovação específico para determinado tipo
          de solicitação.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={GoTag} boxSize={6} color="purple.500" mr={4} />
          <Heading size="sm">Mudança de Status</Heading>
        </Flex>
        <Text>
          Utilizado para atualizar o status atual de uma atividade e indicar em
          qual etapa do fluxo ela está. Este componente é crucial para o
          monitoramento do progresso do TCC, permitindo que todos os envolvidos
          saibam exatamente em que estágio o trabalho se encontra.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Após a criação de um ticket, o status pode ser
          alterado para "Em Andamento" para indicar que o trabalho foi iniciado.
        </Text>
      </Box>
    ),
  },
  {
    title: "Blocos de Interação",
    description: "Blocos de interação com os usuários",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Fluxos de Trabalho
        </Heading>

        <Text fontSize="lg" mb={4}>
          Esses blocos são responsáveis por gerenciar as interações entre os
          formulários e os usuários do sistema. Eles são responsáveis por
          controlar o fluxo de informações, requisitando informações e
          avaliações nos momentos corretos e para as pessoas certas.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={FaWpforms} boxSize={6} color="blue.500" mr={4} />
          <Heading size="sm">Interação</Heading>
        </Flex>
        <Text>
          Utilizado para solicitar informações específicas de um destinatário.
          Este componente permite configurar requisições para entregas parciais,
          solicitações de defesa ou envio final de documentos. Ele é ligado a um
          formulário específico do tipo "Interação" e pode ser configurado para
          diferentes etapas do fluxo.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> O sistema pode solicitar ao aluno que envie a
          versão final do TCC para avaliação, ou pode solicitar a um membro da
          banca que forneça feedback sobre uma apresentação.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={RiWebhookLine} boxSize={6} color="green.500" mr={4} />
          <Heading size="sm">Requisição Web</Heading>
        </Flex>
        <Text>
          Utilizado para integrar o sistema com outras ferramentas e serviços,
          permitindo a troca de informações em tempo real. Este componente pode
          ser configurado para enviar dados para sistemas externos, como Jira,
          Discord ou Google Drive, e receber informações de volta para atualizar
          o status do ticket.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Após a submissão de um ticket iformar ao
          Discord que o ticket foi criado e notificar o usuário.
        </Text>

        <Divider my={4} />
        <Flex align="center" mb={4}>
          <Icon as={BiGitRepoForked} boxSize={6} color="green.500" mr={4} />
          <Heading size="sm">Condicional</Heading>
        </Flex>
        <Text>
          Utilizado para realizar ações condicionais com base em informações
          fornecidas pelo usuário ou por sistemas externos. Com isso é possível
          criar ramificações no fluxo de trabalho, permitindo que diferentes
          ações sejam tomadas com base em critérios específicos.
        </Text>
        <Text mt={2}>
          <b>Exemplo de Uso:</b> Se um campo específico for preenchido com
          "Sim", enviar um email de notificação para o responsável.
        </Text>
      </Box>
    ),
  },
];

const SecondPage: React.FC = () => {
  const [auth] = useAuth();
  const navigate = useNavigate();

  const handleFinish = useCallback(() => {
    if (!auth) return;

    updateTutorials(auth.id, "first-page");
    navigate("/portal");
  }, [navigate]);

  return <Steps steps={steps} onFinish={handleFinish} />;
};

export default SecondPage;
