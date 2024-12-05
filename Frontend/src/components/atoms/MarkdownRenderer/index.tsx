import React from "react";
import ReactMarkdown from "react-markdown";
import { Text, Flex } from "@chakra-ui/react";

type MarkdownComponents = {
  [key: string]: React.ComponentType<{ children: React.ReactNode }>;
};

const markdownComponents: MarkdownComponents = {
  p: ({ children }) => <Text fontSize="sm">{children}</Text>,
  strong: ({ children }) => <Text as="strong">{children}</Text>,
  em: ({ children }) => <Text as="em">{children}</Text>,
  h1: ({ children }) => (
    <Text as="h1" fontSize="2xl" fontWeight="bold" mb={4}>
      {children}
    </Text>
  ),
  h2: ({ children }) => (
    <Text as="h2" fontSize="xl" fontWeight="bold" mb={4}>
      {children}
    </Text>
  ),
  h3: ({ children }) => (
    <Text as="h3" fontSize="lg" fontWeight="bold" mb={4}>
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Flex as="ul" direction="column" pl={4} mb={4}>
      {children}
    </Flex>
  ),
  ol: ({ children }) => (
    <Flex as="ol" direction="column" pl={4} mb={4}>
      {children}
    </Flex>
  ),
  li: ({ children }) => (
    <Text as="li" fontSize="sm" mb={4}>
      {children}
    </Text>
  ),
};

const MarkdownRenderer = ({ children: value }: { children: string }) => (
  <ReactMarkdown components={markdownComponents}>
    {value ?? "N/A"}
  </ReactMarkdown>
);

export default MarkdownRenderer;
