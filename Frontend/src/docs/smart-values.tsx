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
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaCopy } from "react-icons/fa";

const data = [
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
        Guia do Usuário para Utilização do Smart Values
      </Heading>

      <Heading as="h2" fontSize="lg" mb={3}>
        O que é o Smart Values?
      </Heading>
      <Text mb={5}>
        O Smart Values é uma funcionalidade que permite a substituição
        automática de variáveis em textos, usando dados específicos de uma
        atividade. Isso é útil para personalizar mensagens, e-mails e outros
        conteúdos sem precisar fazer isso manualmente.
      </Text>

      <Box maxW="800px" mx="auto">
        <Heading as="h1" size="mb" mb={5}>
          Campos Disponíveis para Smart Values
        </Heading>
        <Text mb={5}>
          Abaixo estão listados os campos que podem ser utilizados no Smart
          Values para personalizar suas mensagens:
        </Text>
        <TableContainer>
          <Table variant="striped" colorScheme="blue" size={"sm"}>
            <Thead>
              <Tr>
                <Th>Campo</Th>
                <Th>Descrição</Th>
                <Th>Copiar</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, index) => (
                <Tr key={index}>
                  <Td>
                    <Code>{item.field}</Code>
                  </Td>
                  <Td>{item.description}</Td>
                  <Td>
                    <Button onClick={() => handleCopy(item.field)}>
                      <FaCopy />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Heading as="h2" fontSize="lg" mb={3}>
        Como Funciona?
      </Heading>
      <Text mb={5}>
        Imagine que você tem uma atividade com várias informações, como o nome
        do cliente, a data da atividade, etc. Com o Smart Values, você pode
        criar templates de texto que serão automaticamente preenchidos com esses
        dados.
      </Text>

      <Heading as="h2" fontSize="lg" mb={3}>
        Exemplos de Uso
      </Heading>

      <Heading as="h3" size="sm" mb={3}>
        1. Template Simples
      </Heading>
      <Text mb={2}>
        Você pode criar um template de texto com variáveis que serão
        substituídas. Por exemplo:
      </Text>
      <Code
        p={2}
        mb={2}
        display="block"
        whiteSpace="pre"
        maxW="100%"
        overflowX="auto"
      >
        Olá, ${"{{'activity.#users.name'}}"}! Seu protocolo é $
        {"{{'activity.protocol'}}"}.
      </Code>
      <Text mb={2}>
        Se você tiver uma atividade com o nome do cliente como "João" e
        protocolo 123456, o texto será automaticamente convertido para:
      </Text>
      <Code p={2} mb={5} display="block" whiteSpace="pre">
        Olá, João! Seu protocolo é 123456.
      </Code>

      <Heading as="h3" size="sm" mb={3}>
        2. Listas e Arrays
      </Heading>
      <Text mb={2}>
        O Smart Values também lida com listas e arrays. Por exemplo:
      </Text>
      <Code p={2} mb={2} display="block" whiteSpace="pre">
        Participantes: ${"{{'activity.#users.name'}}"}.
      </Code>
      <Text mb={2}>
        Se a atividade tiver itens com os nomes "João", "Maria" e "Pedro", o
        texto será convertido para:
      </Text>
      <Code p={2} mb={5} display="block" whiteSpace="pre">
        Participantes: João, Maria, Pedro.
      </Code>

      <Heading as="h2" fontSize="lg" mb={3}>
        Como Usar
      </Heading>
      <List spacing={3} mb={5}>
        <ListItem>
          1.{" "}
          <Text as="span" fontWeight="bold">
            Identifique as variáveis que você quer substituir
          </Text>
          : Estas variáveis devem estar dentro de <Code>${"{{}}"}</Code>.
        </ListItem>
        <ListItem>
          2.{" "}
          <Text as="span" fontWeight="bold">
            Crie seu template de texto
          </Text>
          : Use as variáveis dentro do template. Por exemplo:{" "}
          <Code>Olá, ${"{{'activity.summary'}}"}!</Code>
        </ListItem>
        <ListItem>
          3.{" "}
          <Text as="span" fontWeight="bold">
            Utilize a função Smart Values para fazer a substituição
          </Text>
          : A função cuidará de substituir as variáveis pelos valores corretos
          da atividade.
        </ListItem>
      </List>

      <Heading as="h2" fontSize="lg" my={3}>
        Campos Customizados
      </Heading>

      <Text mb={2}>
        Além dos campos padrão, você também pode acessar campos customizados
        criados nos formulários da atividade. Por exemplo:
      </Text>

      <Text mb={2}>
        Se você tiver um campo customizado com id "custom_field", você pode
        acessá-lo da seguinte forma:
      </Text>

      <Code p={2} mb={2} display="block" whiteSpace="pre">
        Nome do Campo: ${"{{'activity.custom_field'}}"}
      </Code>

      <Heading as="h2" fontSize="lg" mb={3}>
        Dicas Úteis
      </Heading>
      <List spacing={3} mb={5}>
        <ListItem>
          <Text as="span" fontWeight="bold">
            Verifique os nomes das variáveis
          </Text>
          : As variáveis devem corresponder exatamente aos nomes dos dados na
          atividade.
        </ListItem>
        <ListItem>
          <Text as="span" fontWeight="bold">
            Use sempre <Code>${"{{}}"}</Code>
          </Text>
          : Isso ajuda a identificar claramente as variáveis que devem ser
          substituídas.
        </ListItem>
        <ListItem>
          <Text as="span" fontWeight="bold">
            Arrays e Listas
          </Text>
          : Use <Code>#</Code> para indicar que está lidando com listas ou
          arrays. Por exemplo, <Code>${"{{activity.#user.name}}"}</Code>.
        </ListItem>
      </List>

      <Heading as="h2" fontSize="lg" mb={3}>
        Perguntas Frequentes
      </Heading>
      <Text mb={2}>
        <Text as="span" fontWeight="bold">
          P: O que acontece se a variável não existir?
        </Text>
      </Text>
      <Text mb={5}>
        R: Se a variável não for encontrada, será substituída por um hífen{" "}
        <Code>-</Code>.
      </Text>

      <Text mb={2}>
        <Text as="span" fontWeight="bold">
          P: Posso usar múltiplas variáveis em um único texto?
        </Text>
      </Text>
      <Text mb={5}>
        R: Sim! Você pode usar quantas variáveis precisar dentro do seu
        template.
      </Text>
    </Flex>
  );
};

export default HelpSmartValues;
