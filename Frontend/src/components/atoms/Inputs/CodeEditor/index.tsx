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
import CodeMirror from "@uiw/react-codemirror";
import { Controller, useFormContext } from "react-hook-form";
import InfoTooltip from "../InfoTooltip";
import ErrorMessage from "../ErrorMessage";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";

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

const activityCompletions = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);

  if (!word) return null;

  if (word.from === word.to && !context.explicit) return null;

  const suggestions = [
    // Propriedades gerais
    { label: "activity", type: "variable", info: "Objeto global de atividade." },
    { label: "activity._id", type: "property", info: "ID único da atividade." },
    { label: "activity.name", type: "property", info: "Nome da atividade." },
    { label: "activity.protocol", type: "property", info: "Protocolo da atividade." },
    { label: "activity.state", type: "enum", info: "Estado atual da atividade." },
    { label: "activity.description", type: "property", info: "Descrição da atividade." },
    { label: "activity.createdAt", type: "property", info: "Data de criação da atividade." },
    { label: "activity.updatedAt", type: "property", info: "Data da última atualização da atividade." },
    { label: "activity.finished_at", type: "property", info: "Data de finalização da atividade." },

    // Propriedades relacionadas a usuários
    { label: "activity.users", type: "property", info: "Lista de usuários associados à atividade." },
    { label: "activity.users[].name", type: "property", info: "Nome do usuário." },
    { label: "activity.users[].email", type: "property", info: "E-mail do usuário." },

    // Propriedades relacionadas ao formulário
    { label: "activity.form", type: "property", info: "Formulário associado à atividade." },
    { label: "activity.form_draft", type: "property", info: "Rascunho do formulário associado à atividade." },

    // Propriedades relacionadas ao status
    { label: "activity.status", type: "property", info: "Status da atividade." },

    // Propriedades relacionadas a interações
    { label: "activity.interactions", type: "array", info: "Interações associadas à atividade." },
    { label: "activity.interactions[]._id", type: "property", info: "ID único da interação." },
    { label: "activity.interactions[].activity_workflow_id", type: "property", info: "ID do fluxo de trabalho associado." },
    { label: "activity.interactions[].activity_step_id", type: "property", info: "ID do passo associado à interação." },
    { label: "activity.interactions[].form", type: "property", info: "Formulário usado na interação." },
    { label: "activity.interactions[].answers", type: "property", info: "Respostas da interação." },
    { label: "activity.interactions[].answers[]._id", type: "property", info: "ID único da resposta." },
    { label: "activity.interactions[].answers[].status", type: "property", info: "Status da resposta." },
    { label: "activity.interactions[].answers[].user", type: "property", info: "Usuário que respondeu." },
    { label: "activity.interactions[].answers[].data", type: "property", info: "Dados da resposta." },
    { label: "activity.interactions[].finished", type: "property", info: "Indica se a interação foi finalizada." },

    // Propriedades relacionadas aos fluxos de trabalho
    { label: "activity.workflows", type: "property", info: "Fluxos de trabalho associados à atividade." },
    { label: "activity.workflows[]._id", type: "property", info: "ID único do fluxo de trabalho." },
    { label: "activity.workflows[].workflow_draft", type: "property", info: "Rascunho do fluxo de trabalho." },
    { label: "activity.workflows[].steps", type: "property", info: "Passos no fluxo de trabalho." },
    { label: "activity.workflows[].steps[]._id", type: "property", info: "ID único do passo." },
    { label: "activity.workflows[].steps[].step", type: "property", info: "Nome do passo." },
    { label: "activity.workflows[].steps[].status", type: "property", info: "Status do passo." },
    { label: "activity.workflows[].steps[].data", type: "property", info: "Dados associados ao passo." },
    { label: "activity.workflows[].finished", type: "property", info: "Indica se o fluxo de trabalho foi finalizado." },
  ];

  return {
    from: word.from,
    options: suggestions,
  };
};

const CodeEditor: React.FC<CodeEditorProps> = ({ input }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
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
                  <CodeMirror
                    {...field}
                    value={editorValue || field.value} // Usa o valor local ou o valor do formulário
                    theme={mode.colorMode === "dark" ? githubDark : githubLight}
                    placeholder={input?.placeholder}
                    onChange={(e) => setEditorValue(e)}
                    data-color-mode={mode.colorMode}
                    extensions={[
                      javascript({ jsx: true }),
                      autocompletion({ override: [activityCompletions] }),
                    ]}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onClick={() => {
                      field.onChange(editorValue); // Atualiza o valor do formulário
                      onClose();
                    }}
                  >
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
