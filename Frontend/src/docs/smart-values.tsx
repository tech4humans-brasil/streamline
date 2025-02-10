import {
  Flex,
  List,
  ListItem,
  Code,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaCopy } from "react-icons/fa";

const smartValuesData = [
  { field: "activity.name", description: "Nome da atividade" },
  { field: "activity.description", description: "Descrição da atividade" },
  { field: "activity.#users.name", description: "Nome do Usuário" },
  { field: "activity.#users.email", description: "Email do Usuário" },
  {
    field: "activity.#users.matriculation",
    description: "Matrícula do Usuário",
  },
  {
    field: "activity.#users.#institutes.name",
    description: "Nome do Instituto",
  },
  {
    field: "activity.#users.#institutes.acronym",
    description: "Sigla do Instituto",
  },
  { field: "activity.status.name", description: "Nome do Status" },
  { field: "activity.status.type", description: "Tipo do Status" },
  { field: "activity.protocol", description: "Protocolo do Sistema" },
];

const jsExamples = [
  {
    example: "${new Date().toLocaleDateString()}",
    description: "Data atual formatada",
  },
  {
    example: "${activity.#users.name.toUpperCase()}",
    description: "Nome do usuário em maiúsculas",
  },
  {
    example: "${activity.protocol.padStart(6, '0')}",
    description: "Protocolo com 6 dígitos preenchido com zeros à esquerda",
  },
  {
    example: "${activity.#users.length > 1 ? 'Usuários' : 'Usuário'}",
    description: "Texto condicional baseado na quantidade de usuários",
  },
];

const HelpSmartValues = () => {
  const toast = useToast();
  const { t } = useTranslation();

  const handleCopy = useCallback(
    (text: string) => {
      navigator.clipboard
        .writeText("${{" + text + "}}")
        .then(() => {
          toast({
            title: t("common.actions.copy.success"),
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
        })
        .catch(() => {
          toast({
            title: t("common.actions.copy.error"),
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
        });
    },
    [toast]
  );

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
        Guia do Smart Values
      </Heading>

      <Box maxW="800px" mx="auto">
        <Heading as="h2" fontSize="lg" mb={3}>
          O que é o Smart Values?
        </Heading>
        <Text mb={5}>
          O Smart Values é uma funcionalidade que permite a substituição
          dinâmica de variáveis em textos, usando dados específicos de uma
          atividade. Existem duas formas de utilizar o Smart Values:
        </Text>

        <List spacing={4} mb={8}>
          <ListItem>
            <Text fontWeight="bold">
              1. Substituição Simples ({"${{variavel}}"}):
            </Text>
            <Text>
              Substitui diretamente o valor da variável sem modificações.
            </Text>
            <Code p={2} mt={2} display="block">
              Olá, ${"{{activity.#users.name}}"}, seu protocolo é $
              {"{{activity.protocol}}"}
            </Code>
          </ListItem>

          <ListItem>
            <Text fontWeight="bold">
              2. Expressões JavaScript (${"{"}expressao{"}"}):
            </Text>
            <Text>
              Permite executar código JavaScript para manipular os valores.
            </Text>
            <Code p={2} mt={2} display="block">
              Olá, {"${activity.#users.name.toUpperCase()}"}, hoje é{" "}
              {"${new Date().toLocaleDateString()}"}
            </Code>
          </ListItem>
        </List>

        <Heading as="h2" size="md" mb={4}>
          Campos Disponíveis
        </Heading>

        <TableContainer mb={8}>
          <Table variant="striped" colorScheme="blue" size="sm">
            <Thead>
              <Tr>
                <Th>Campo</Th>
                <Th>Descrição</Th>
                <Th>Copiar</Th>
              </Tr>
            </Thead>
            <Tbody>
              {smartValuesData.map((item, index) => (
                <Tr key={index}>
                  <Td>
                    <Code>{item.field}</Code>
                  </Td>
                  <Td>{item.description}</Td>
                  <Td>
                    <Button size="sm" onClick={() => handleCopy(item.field)}>
                      <FaCopy />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Heading as="h2" size="md" mb={4}>
          Exemplos de Expressões JavaScript
        </Heading>

        <Alert status="info" mb={4}>
          <AlertIcon />
          Use chaves simples {"${}"} para incluir expressões JavaScript que
          serão avaliadas em tempo real.
        </Alert>

        <TableContainer mb={8}>
          <Table variant="striped" colorScheme="blue" size="sm">
            <Thead>
              <Tr>
                <Th>Exemplo</Th>
                <Th>Descrição</Th>
              </Tr>
            </Thead>
            <Tbody>
              {jsExamples.map((item, index) => (
                <Tr key={index}>
                  <Td>
                    <Code>{item.example}</Code>
                  </Td>
                  <Td>{item.description}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Heading as="h2" size="md" mb={4}>
          Dicas e Boas Práticas
        </Heading>

        <List spacing={3} mb={8}>
          <ListItem>
            <Text as="span" fontWeight="bold">
              • Verificação de Valores Nulos:
            </Text>
            <Text>
              Use operador opcional para evitar erros com valores indefinidos:
            </Text>
            <Code p={2} mt={2} display="block">
              {"${activity.#users?.[0]?.name ?? 'Usuário'}"}
            </Code>
          </ListItem>

          <ListItem>
            <Text as="span" fontWeight="bold">
              • Formatação de Datas:
            </Text>
            <Text>Use os métodos de Date para formatar datas:</Text>
            <Code p={2} mt={2} display="block">
              {"${new Date(activity.createdAt).toLocaleDateString()}"}
            </Code>
          </ListItem>

          <ListItem>
            <Text as="span" fontWeight="bold">
              • Arrays e Listas:
            </Text>
            <Text>Use # para acessar arrays e seus métodos:</Text>
            <Code p={2} mt={2} display="block">
              {"${{activity.#users.name}}"}
            </Code>
            <Text>
              Essa funcionalidade é extremamente útil pois ela já percorre o
              array realizando uma junção com o "," automática.
            </Text>
          </ListItem>
        </List>
      </Box>
    </Flex>
  );
};

export default HelpSmartValues;
