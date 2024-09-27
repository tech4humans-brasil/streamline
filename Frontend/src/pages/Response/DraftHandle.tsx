import React, { memo, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Flex, Icon, Spinner, Text } from "@chakra-ui/react";
import { saveDraft, getDraftAnswer } from "@apis/answer";
import { MdCheck, MdError } from "react-icons/md";

interface DraftHandleProps {
  form_id?: string | null;
  activity_id?: string | null;
  isSubmitting: boolean;
}

const DraftHandle: React.FC<DraftHandleProps> = memo(
  ({ form_id, activity_id, isSubmitting }) => {
    const { data: draftAnswer } = useQuery({
      queryKey: ["form", form_id ?? "", "draft-answer", activity_id ?? ""],
      queryFn: getDraftAnswer,
      enabled: !!form_id,
    });

    const methods = useFormContext();
    const lastSaveDate = useRef(new Date());

    const {
      formState: { isDirty },
      reset,
    } = methods;

    const { mutateAsync, isPending, isError, isSuccess } = useMutation({
      mutationFn: saveDraft,
    });

    useEffect(() => {
      if (draftAnswer) {
        reset(draftAnswer.data);
      }
    }, [draftAnswer, reset]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (isDirty && !isSubmitting) {
          mutateAsync({
            activityId: activity_id ?? "",
            formId: form_id ?? "",
            data: methods.getValues(),
          });
          lastSaveDate.current = new Date();
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [isDirty, methods, mutateAsync, form_id, isSubmitting, activity_id]);

    return (
      <Flex p={0} w="100%" justify={"end"} alignItems={"center"} gap="2" mb="2">
        {isPending && <Spinner size="sm" color="blue.500" />}
        {isPending && <Span>Salvando rascunho...</Span>}
        {isError && (
          <>
            <Icon as={MdError} color="red.500" />
            <Span>Erro ao salvar rascunho</Span>
          </>
        )}

        {isSuccess && (
          <>
            <Icon as={MdCheck} color="green.500" />
            <Span>Rascunho salvo com sucesso</Span>
          </>
        )}
      </Flex>
    );
  }
);

export default DraftHandle;

interface SpanProps {
  children: React.ReactNode;
}

const Span = memo(({ children }: SpanProps) => {
  return <Text fontSize="smaller">{children}</Text>;
});
