import { Button, Flex } from "@chakra-ui/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrUpdateComment } from "@apis/comment";
import { getActivity } from "@apis/activity";
import TextArea from "@components/atoms/Inputs/TextArea";

const formSchema = z.object({
  content: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommentFormProps {
  id: string;
}

const CommentForm: React.FC<CommentFormProps> = ({ id }) => {
  const queryClient = useQueryClient();

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { handleSubmit, reset } = methods;

  const { mutate, isPending } = useMutation({
    mutationKey: ["comment", id],
    mutationFn: createOrUpdateComment,
    onSuccess: (data) => {
      reset();
      queryClient.setQueryData(
        ["activity", id],
        (oldData: Awaited<ReturnType<typeof getActivity>>) => {
          return {
            ...oldData,
            comments: [...oldData.comments, data],
          };
        }
      );
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, activity: id });
  });

  return (
    <FormProvider {...methods}>
      <Flex as="form" onSubmit={onSubmit} w="full" gap={2} alignItems="end">
        <TextArea
          input={{
            id: "content",
            placeholder: "Escreva seu comentário",
          }}
        />
        <Button
          type="submit"
          mb="2"
          size="md"
          colorScheme="blue"
          isLoading={isPending}
        >
          Enviar
        </Button>
      </Flex>
    </FormProvider>
  );
};

export default CommentForm; 