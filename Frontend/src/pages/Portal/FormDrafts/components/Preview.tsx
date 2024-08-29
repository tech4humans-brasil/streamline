import { Button, Divider, useToast } from "@chakra-ui/react";
import Inputs from "@components/atoms/Inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import IFormDraft from "@interfaces/FormDraft";
import convertToZodSchema from "@utils/convertToZodSchema";
import React, { memo } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface PreviewProps {
  form: Pick<IFormDraft, "fields">;
}

const Preview: React.FC<PreviewProps> = memo(({ form }) => {
  const methods = useForm({
    resolver: zodResolver(convertToZodSchema(form.fields)),
  });
  const toast = useToast();

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    toast({
      title: "Formulário enviado com sucesso",
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  });

  console.log(methods.formState.errors);

  return (
    <FormProvider {...methods}>
      <Divider />
      <Inputs fields={form.fields} />
      <Divider />
      <Button
        type="submit"
        colorScheme="green"
        variant="solid"
        onClick={onSubmit}
      >
        Enviar
      </Button>
    </FormProvider>
  );
});

export default Preview;
