export interface Profile {
  name: string;
  description?: string;
  env: Record<string, string>;
}

export interface Config {
  version: string;
  defaults: Record<string, string>;
  profiles: Profile[];
}

export const DEFAULT_CONFIG: Config = {
  version: "1",
  defaults: {},
  profiles: [],
};
