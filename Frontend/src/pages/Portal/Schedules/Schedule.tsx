import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import {
  createOrUpdateSchedule,
  getSchedule,
  getScheduleForms,
} from "@apis/schedule";
import Select from "@components/atoms/Inputs/Select";
import NumberInput from "@components/atoms/Inputs/NumberInput";
import cronstrue from "cronstrue/i18n";
import Switch from "@components/atoms/Inputs/Switch";
import { convertFromCron, convertToCron } from "@utils/convertCronExpression";
import { FaArrowLeft } from "react-icons/fa";

const Schema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
    interval: z.coerce.number().nullable().optional(),
    schedule: z.string().nullable().optional(),
    time: z.string().nullable().optional(),
    workflow: z.string().min(3, { message: "Workflow é obrigatório" }),
    expression: z.string().min(3, { message: "Expressão é obrigatória" }),
    day: z.coerce.number().min(1).max(31).nullable().optional(),
    advanced: z.boolean().optional(),
    form: z.string().min(3, { message: "Formulário é obrigatório" }),
    start: z.coerce.date(),
    end: z.union([z.null(), z.coerce.date()]).default(null),
    timezone: z.string().default("America/Sao_Paulo"),
    project: z.string().min(3, { message: "Projeto é obrigatório" }),
    active: z.boolean().default(true),
    repeat: z.coerce.number().min(0).nullable().default(null),
  })
  .refine(
    (data) => {
      if (data.end && new Date(data.start) > new Date(data.end)) {
        return false;
      }
      return true;
    },
    {
      message: "End date must be greater than start date",
    }
  )
  .refine(
    (data) => {
      if (!data.advanced) {
        if (!data.interval || !data.schedule || !data.time) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Interval, schedule and time are required",
      path: ["interval, schedule, time"],
    }
  );

type UniversityFormInputs = z.infer<typeof Schema>;

const schedules = [
  {
    value: "minute",
    label: "Minutos",
  },
  {
    value: "hour",
    label: "Horas",
  },
  {
    value: "day",
    label: "Dias",
  },
  {
    value: "week",
    label: "Semanas",
  },
  {
    value: "month",
    label: "Mêses",
  },
];

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const project = location.state?.project as string | undefined;

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: getSchedule,
    enabled: isEditing,
  });

  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["schedule", "forms", project ?? ""],
    queryFn: getScheduleForms,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({
        title: t(`institute.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`institute.${isEditing ? "updated" : "created"}`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<UniversityFormInputs>({
    resolver: zodResolver(Schema),
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = methods;

  const interval = watch("interval");
  const schedule = watch("schedule");
  const time = watch("time");
  const advanced = watch("advanced");
  const expression = watch("expression");
  const day = watch("day");

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (scheduleData) {
      const { schedule, interval, time } = convertFromCron(
        scheduleData.expression
      );
      reset({
        ...scheduleData,
        //@ts-ignore
        start: new Date(scheduleData.start).toISOString().split("T")[0],
        //@ts-ignore
        end: scheduleData.end
          ? new Date(scheduleData.end).toISOString().split("T")[0]
          : null,
        schedule,
        interval,
        time,
      });
    }
  }, [scheduleData, reset]);

  useEffect(() => {
    if (interval && schedule && time) {
      const cron = convertToCron(interval, schedule, time, day);

      methods.setValue("expression", cron);
    }
  }, [interval, schedule, time]);

  useEffect(() => {
    if (project) {
      methods.setValue("project", project);
    }
  }, [project]);

  console.log("errors", errors);

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="600px"
        >
          <CardHeader>
            <Flex align="center" justify="space-between">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                w="fit-content"
              >
                <FaArrowLeft />
              </Button>
              <Heading
                fontSize="2xl"
                fontWeight="bold"
                w="100%" 
                textAlign="center"
              >
                {t(`schedule.${isEditing ? "edit" : "create"}`)}
              </Heading>
            </Flex>
          </CardHeader>
          <CardBody display="flex" flexDirection="column" gap="4">
            <Text
              input={{
                id: "name",
                label: t("common.fields.name"),
                required: true,
              }}
            />
            <Switch
              input={{
                id: "active",
                label: t("common.fields.active"),
              }}
            />
            <Select
              input={{
                id: "timezone",
                label: t("common.fields.timezone"),
                options: [
                  "America/New_York",
                  "America/Los_Angeles",
                  "America/Sao_Paulo",
                  "Europe/London",
                  "Europe/Berlin",
                  "Asia/Tokyo",
                  "Australia/Sydney",
                ].map((tz) => ({
                  label: tz,
                  value: tz,
                })),
                required: true,
              }}
            />
            <Flex direction={["column", "row"]} gap="4">
              <Text
                input={{
                  id: "start",
                  type: "date",
                  label: t("common.fields.start"),
                  required: true,
                }}
              />

              <Text
                input={{
                  id: "end",
                  type: "date",
                  label: t("common.fields.end"),
                }}
              />
            </Flex>
            <Select
              input={{
                id: "workflow",
                label: t("common.fields.workflow"),
                options: formsData?.workflows ?? [],
                required: true,
              }}
              isLoading={isLoadingForms}
            />
            <Select
              input={{
                id: "form",
                label: t("common.fields.form"),
                options: formsData?.forms ?? [],
                required: true,
              }}
              isLoading={isLoadingForms}
            />
            <Select
              input={{
                id: "project",
                label: t("common.fields.project"),
                options: formsData?.projects ?? [],
                required: true,
                isDisabled: !!project,
              }}
              isLoading={isLoadingForms}
            />
            <Text
              input={{
                id: "repeat",
                label: "Quantidade de vezes que irá rodar (caso exista)",
                type: "number",
              }}
            />
            <Divider />
            <Flex
              direction={["column", "row"]}
              gap="4"
              justifyContent={"space-between"}
            >
              <p>Executa essa regra a cada:</p>
              <Flex justify="end">
                <Switch
                  input={{
                    id: "advanced",
                    label: "",
                  }}
                />
              </Flex>
            </Flex>
            {advanced ? (
              <Text
                input={{
                  id: "expression",
                  label: t("common.fields.expression"),
                  required: true,
                }}
              />
            ) : (
              <>
                <Flex direction={["column", "row"]} gap="4">
                  <NumberInput
                    input={{
                      id: "interval",
                      label: "",
                    }}
                  />
                  <Select
                    input={{
                      id: "schedule",
                      label: "",
                      options: schedules,
                    }}
                  />
                </Flex>
                {schedule !== "minute" && (
                  <>
                    As
                    <Text
                      input={{
                        id: "time",
                        type: "time",
                        label: "",
                      }}
                    />
                  </>
                )}
                {schedule === "month" && (
                  <Text
                    input={{
                      id: "day",
                      type: "number",
                      label: "Dia do mês",
                    }}
                  />
                )}
              </>
            )}
            {expression && (
              <Box
                mt="2"
                color="gray.600"
                bg="gray.100"
                p="2"
                borderRadius="md"
              >
                {cronstrue.toString(expression ?? "", {
                  locale: i18n.language.replace("-", "_"),
                  throwExceptionOnParseError: false,
                })}
              </Box>
            )}

            <Flex mt="8" justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>
              <Can
                permission={isEditing ? "institute.update" : "institute.create"}
              >
                <Button
                  mt={4}
                  colorScheme="blue"
                  isLoading={isPending || isLoading}
                  type="submit"
                >
                  {t("project.submit")}
                </Button>
              </Can>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}
