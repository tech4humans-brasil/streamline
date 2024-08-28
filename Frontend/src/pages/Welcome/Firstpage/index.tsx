import React, { useCallback } from "react";
import { Box, Flex, Text, Heading, Divider, Icon } from "@chakra-ui/react";
import {
  FaCheck,
  FaTimesCircle,
  FaHourglassHalf,
  FaUserShield,
  FaUserGraduate,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { updateTutorials } from "@apis/users";
import useAuth from "@hooks/useAuth";
import Steps from "@components/organisms/Steps";

const steps = [
  {
    title: "Introdução",
    description: "Visão geral do sistema de TCC",
    content: (
      <Box mt={4}>
        <Heading size="lg" mb={4}>
          Bem-vindo ao Streamline!
        </Heading>
        <Text fontSize="lg" mb={4}>
          Este sistema foi projetado para facilitar o processo de atividades e
          demandas, desde a criação das atividades até a finalização.
        </Text>
        <Text>
          Irei guiá-lo através dos principais componentes do sistema, incluindo
          formulários, fluxos de trabalho e modelos de email. Ao final desta
          jornada, você terá uma visão clara de como o Streamline pode ser
          personalizado para atender às necessidades específicas do seu negócio.
        </Text>
      </Box>
    ),
  },
  {
    title: "Tipos de Perfil",
    description: "Entenda os diferentes tipos de perfil",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Tipos de Perfil
        </Heading>

        <Text fontSize="lg" mb={4}>
          O sistema oferece diferentes tipos de perfil, cada um com permissões e
          responsabilidades específicas. Esses perfis são essenciais para o
          fluxo do TCC, garantindo que cada usuário possa desempenhar seu papel
          adequadamente.
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={FaUserGraduate} boxSize={6} color="blue.500" mr={4} />
          <Heading size="sm">Usuário</Heading>
        </Flex>
        <Text>
          O perfil de Usuário é utilizado pelos usuários finais, para interagir
          com o sistema e realizar as atividades propostas. Esse perfil é
          designado a colaborades da empresa que irão interagir com o sistema.
        </Text>
        <Text mt={2}>
          <b>Permissões:</b> Submissão de formulários de criação e interação,
          consulta das seus tickets;
        </Text>

        <Divider my={4} />

        <Flex align="center" mb={4}>
          <Icon as={FaUserShield} boxSize={6} color="red.500" mr={4} />
          <Heading size="sm">Administrador</Heading>
        </Flex>
        <Text>
          O perfil de Administrador tem acesso total ao sistema, sendo
          responsável por gerenciar usuários, configurações e fluxos de
          trabalho. Esse perfil garante que o sistema funcione corretamente para
          todos os usuários.
        </Text>
        <Text mt={2}>
          <b>Permissões:</b> Gestão de usuários, configuração de fluxos, gestão
          de templates de email, gestão de formulários, acompanhamento de todas
          as atividades.
        </Text>
      </Box>
    ),
  },

  {
    title: "Status",
    description: "Entenda os diferentes status no sistema",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Status
        </Heading>

        <Text fontSize="lg" mb={4}>
          O sistema permite que as atividades sejam acompanhadas por meio de
          diferentes status. Esses status indicam a situação atual de ticket,
          facilitando a identificação de tarefas pendentes e concluídas. Esses
          status são personalizáveis e podem ser adaptados às necessidades
          específicas de cada curso. Existindo 3 tipos de status:
        </Text>

        <Divider my={4} />

        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaHourglassHalf} boxSize={6} color="yellow.500" mr={4} />
          <Text fontWeight="bold">Em Andamento</Text>
        </Flex>
        <Text>
          Indica que o ticket está em andamento e ainda não foi finalizado.
          Os participantes devem seguir com suas atividades até a conclusão.
        </Text>

        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaCheck} boxSize={6} color="teal.500" mr={4} />
          <Text fontWeight="bold">Concluído</Text>
        </Flex>
        <Text>
          Status atribuído quando todas as etapas do ticket foram
          completadas, e o trabalho foi concluído com sucesso.
        </Text>

        <Flex align="center" mt={4} mb={2}>
          <Icon as={FaTimesCircle} boxSize={6} color="red.500" mr={4} />
          <Text fontWeight="bold">Cancelado</Text>
        </Flex>
        <Text>
          Este status indica que o ticket não atendeu aos critérios necessários e
          foi cancelado. O solicitante deve revisar as informações e reiniciar o
          processo, se necessário.
        </Text>
      </Box>
    ),
  },
  {
    title: "Modelos de Email",
    description: "Modelos de email para comunicação com os usuários",
    content: (
      <Box mt={4}>
        <Heading size="md" mb={4}>
          Modelos de Email
        </Heading>

        <Text mt={4}>
          Os modelos de email são estruturas pré-definidas que facilitam o envio
          de mensagens automáticas para os usuários do sistema. Esses templates
          permitem a personalização das comunicações de acordo com o contexto e
          o destinatário, garantindo que as informações sejam claras,
          pertinentes e personalizadas.
        </Text>

        <Text mt={4}>
          Cada template de email é composto por campos dinâmicos, conhecidos
          como SmartValues, que são preenchidos automaticamente com informações
          específicas de cada interação. Por exemplo, em um lembrete de prazo, o
          sistema pode inserir automaticamente o nome do aluno, o título do TCC
          ou a data de entrega, tornando a mensagem mais precisa e direcionada.
        </Text>

        <Text mt={4}>
          Ao utilizar templates de email, você otimiza o processo de
          comunicação, reduzindo o tempo necessário para criar mensagens
          personalizadas e garantindo que todos os usuários recebam informações
          consistentes e relevantes.
        </Text>
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
