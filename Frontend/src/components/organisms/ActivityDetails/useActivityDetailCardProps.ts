import { useColorModeValue } from "@chakra-ui/react";

type Options = { hero?: boolean };

/** Estilo consistente para superfícies na página de detalhe do ticket */
export function useActivityDetailCardProps(options?: Options) {
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  return {
    bg: "bg.card" as const,
    borderRadius: (options?.hero ? "2xl" : "xl") as "xl" | "2xl",
    boxShadow: "sm" as const,
    borderWidth: "1px" as const,
    borderColor,
    overflow: "hidden" as const,
  };
}
