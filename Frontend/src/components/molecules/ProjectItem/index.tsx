import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Text as ChakraText,
} from "@chakra-ui/react";
import React from "react";

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Card
      boxShadow="md"
      border="1px solid"
      borderRadius="8"
      borderColor="gray.600"
    >
      <Flex justifyContent="start" alignItems="center" direction="row">
        {children}
      </Flex>
    </Card>
  );
};

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CardBody p={2}>
      <Flex direction={"row"} gap={3}>
        {children}
      </Flex>
    </CardBody>
  );
};

const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <CardHeader>{children}</CardHeader>;
};

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <CardFooter>{children}</CardFooter>;
};

const Text: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChakraText fontSize="md" as="p">
      {children}
    </ChakraText>
  );
};

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      mr={4}
      bg="bg.page"
      borderRadius="md"
      w="70px"
      h="70px"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Heading as="h2" fontSize="xx-large" fontWeight="bold">
        {children}
      </Heading>
    </Box>
  );
};

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Heading fontSize={"lg"}>{children}</Heading>;
};

const Actions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Box>{children}</Box>;
};

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Flex direction="column" gap={3}>
      {children}
    </Flex>
  );
};

const ProjectItem = {
  List,
  Container,
  Icon,
  Title,
  Actions,
  Body,
  Header,
  Footer,
  Text,
};

export default ProjectItem;
