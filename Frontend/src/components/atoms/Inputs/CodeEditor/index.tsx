import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useColorMode,
} from "@chakra-ui/react";
import CodeEditorArea from "@uiw/react-textarea-code-editor";
import { Controller, useFormContext } from "react-hook-form";
import InfoTooltip from "../InfoTooltip";
import ErrorMessage from "../ErrorMessage";

interface CodeEditorProps {
  input: {
    id: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    isDisabled?: boolean;
    describe?: string | null;
  };
}

const CodeEditor: React.FC<CodeEditorProps> = ({ input }) => {
  const { control, formState: { errors } } = useFormContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editorValue, setEditorValue] = useState("");

  const mode = useColorMode();

  return (
    <FormControl
      id={input.id}
      isInvalid={!!errors?.[input.id]}
      isRequired={input.required}
      isDisabled={input?.isDisabled}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "start",
          position: "relative",
        }}
      >
        <FormLabel>{input?.label}</FormLabel>
      </div>
      <InfoTooltip describe={input?.describe} />
      <Controller
        name={input.id}
        control={control}
        render={({ field }) => (
          <>
            <Button onClick={onOpen}>Open Editor</Button>
            <Modal isOpen={isOpen} onClose={onClose} size={"cover"}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Code</ModalHeader>
                <ModalBody>
                  <CodeEditorArea
                    {...field}
                    value={editorValue || field.value} // Usa o valor local ou o valor do formulário
                    language="javascript"
                    placeholder={input?.placeholder}
                    onChange={(e) => setEditorValue(e.target.value)}
                    data-color-mode={mode.colorMode}
                    minHeight={400}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button onClick={() => {
                    field.onChange(editorValue); // Atualiza o valor do formulário
                    onClose();
                  }}>
                    Save
                  </Button>
                  <Button onClick={onClose} ml={3}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </>
        )}
      />
      <ErrorMessage id={input.id} />
    </FormControl>
  );
};

export default CodeEditor;
