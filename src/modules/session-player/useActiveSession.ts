import { useQuery } from "@tanstack/react-query";
import { getActiveSession } from "./repository";

export function useActiveSession() {
  return useQuery({
    queryKey: ["session", "active"],
    queryFn: getActiveSession,
  });
}
