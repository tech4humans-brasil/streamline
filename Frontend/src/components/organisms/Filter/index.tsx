import { Button, Flex, Icon } from "@chakra-ui/react";
import { memo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { BiSearch } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";

interface FormData {
  [key: string]: string | string[];
}

const Container: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { resetPageOnSubmit?: boolean }
> = memo(({ children, resetPageOnSubmit = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const methods = useForm({
      defaultValues: Object.fromEntries(searchParams),
    });

    const onSubmit = methods.handleSubmit((data: FormData) => {
      const next = new URLSearchParams(searchParams);

      if (resetPageOnSubmit) {
        next.set("page", "1");
      }

      Object.keys(data).forEach((key) => {
        if (key.startsWith("pi")) return;
        const value = data[key];
        const str = Array.isArray(value) ? value.join(",") : String(value ?? "");
        if (str) next.set(key, str);
        else next.delete(key);
      });

      setSearchParams(next);
    });

    return (
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Flex
            direction={{ base: "column", md: "row" }}
            p={4}
            justify="space-between"
            align="end"
            gap={4}
          >
            {children}

            <div>
              <Button type="submit">
                <Icon as={BiSearch} />
              </Button>
            </div>
          </Flex>
        </form>
      </FormProvider>
    );
  }
);

export default {
  Container,
};
