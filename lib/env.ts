import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const defaultAppUrl = "http://localhost:4005";
const MIN_SECRET_LENGTH = 32;

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH),
    BETTER_AUTH_BASE_URL: z.url().default(defaultAppUrl),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default(defaultAppUrl),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL:
      process.env.BETTER_AUTH_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      defaultAppUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl,
  },
});
