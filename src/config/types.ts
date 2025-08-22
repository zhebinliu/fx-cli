export interface Profile {
  name: string;
  corpId?: string;
  corpAccessToken?: string;
  tokenExpiry?: number;
  baseUrl?: string;
  timeout?: number;
  appId?: string;
  appSecret?: string;
  permanentCode?: string;
  [key: string]: string | number | undefined;
}

export interface Config {
  profiles: Profile[];
  currentProfile: string;
  defaultTimeout: number;
  userAgent: string;
}