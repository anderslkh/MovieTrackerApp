const required = ["DATABASE_URL"] as const;

type RequiredKey = (typeof required)[number];

export function getEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    TMDB_API_KEY: process.env.TMDB_API_KEY ?? "",
    OMDB_API_KEY: process.env.OMDB_API_KEY ?? ""
  } satisfies Record<RequiredKey | "TMDB_API_KEY" | "OMDB_API_KEY", string>;
}
