import {
  Accordion as ChakraAccordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Heading,
} from "@chakra-ui/react";

interface AccordionProps {
  defaultIndex: number[];
  allowToggle: boolean;
  allowMultiple: boolean;
  children: React.ReactNode[] | React.ReactNode;
}

const Container: React.FC<AccordionProps> = ({
  defaultIndex,
  allowMultiple,
  children,
  ...rest
}) => {
  return (
    <ChakraAccordion
      defaultIndex={defaultIndex}
      allowMultiple={allowMultiple}
      {...rest}
    >
      {children}
    </ChakraAccordion>
  );
};

interface AccordionHeaderProps {
  children: React.ReactNode | React.ReactNode[];
}

const Item: React.FC<AccordionHeaderProps> = ({ children, ...rest }) => {
  return <AccordionItem {...rest}>{children}</AccordionItem>;
};

interface AccordionButtonProps {
  children: React.ReactNode;
  fontSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

const Button: React.FC<AccordionButtonProps> = ({
  children,
  fontSize = "md",
  ...rest
}) => {
  return (
    <AccordionButton {...rest} _focus={{ boxShadow: "none" }} p={4}>
      <Box as="span" flex="1" textAlign="left">
        <Heading as="h2" fontSize={fontSize}>
          {children}
        </Heading>
      </Box>
      <AccordionIcon />
    </AccordionButton>
  );
};

interface AccordionPanelProps {
  children: React.ReactNode;
}

const Panel: React.FC<AccordionPanelProps> = ({ children, ...rest }) => {
  return <AccordionPanel {...rest}>{children}</AccordionPanel>;
};

const Accordion = {
  Container,
  Item,
  Button,
  Panel,
};

export default Accordion;
