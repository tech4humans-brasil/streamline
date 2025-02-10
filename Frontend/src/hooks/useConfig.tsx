import { getConfigs } from "@apis/admin";
import { useQuery } from "@tanstack/react-query";

export function useConfig() {
  const data = useQuery({
    queryKey: ["config"],
    queryFn: getConfigs,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return data;
}
