import { getConfigs } from "@apis/admin";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useConfig(acronym?: string) {
  const data = useQuery({
    queryKey: ["config", acronym ?? ""],
    queryFn: getConfigs,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return data;
}
