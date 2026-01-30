import { QueryClient } from "@tanstack/react-query";

const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const ONE_MINUTE_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE_MS,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
