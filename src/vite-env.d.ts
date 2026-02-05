/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTH_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta { // eslint-disable-line @typescript-eslint/no-unused-vars
  readonly env: ImportMetaEnv;
}

// Shell detection for Module Federation
declare global {
  interface Window {
    __SHELL__?: boolean;
  }
}

export {};
