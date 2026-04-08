import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Icon,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrUpdateComment } from "@apis/comment";
import { getActivity } from "@apis/activity";
import { useTranslation } from "react-i18next";
import { FaRegCommentDots } from "react-icons/fa";

const formSchema = z.object({
  content: z.string().trim().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface CommentFormProps {
  id: string;
}

const CommentForm: React.FC<CommentFormProps> = ({ id }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const iconBg = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("gray.200", "gray.600");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["comment", id],
    mutationFn: createOrUpdateComment,
    onSuccess: (data) => {
      reset();
      queryClient.setQueryData(
        ["activity", id],
        (oldData: Awaited<ReturnType<typeof getActivity>>) => {
          if (!oldData) return oldData;
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
    <Flex
      as="form"
      onSubmit={onSubmit}
      w="full"
      direction="column"
      p={4}
      gap={0}
    >
      <Flex align="flex-start" gap={3}>
        <Flex
          align="center"
          justify="center"
          flexShrink={0}
          w={9}
          h={9}
          borderRadius="full"
          bg={iconBg}
        >
          <Icon as={FaRegCommentDots} color="blue.400" boxSize={4} />
        </Flex>
        <Box flex="1" minW={0}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
            {t("activityDetails.comments.composerTitle")}
          </Text>
          <FormControl isInvalid={!!errors.content}>
            <Textarea
              {...register("content")}
              placeholder={t("activityDetails.comments.composerPlaceholder")}
              borderRadius="lg"
              minH="100px"
              resize="vertical"
              bg={inputBg}
              borderColor={inputBorder}
              _focusVisible={{
                borderColor: "blue.400",
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
              }}
            />
            <FormErrorMessage>{errors.content?.message}</FormErrorMessage>
          </FormControl>
          <Flex justify="flex-end" mt={3}>
            <Button
              type="submit"
              size="sm"
              colorScheme="blue"
              borderRadius="md"
              isLoading={isPending}
            >
              {t("activityDetails.comments.send")}
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default CommentForm;
