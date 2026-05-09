declare module 'next-pwa' {
  import { NextConfig } from 'next';
  function withPWAInit(options: Record<string, unknown>): (config: NextConfig) => NextConfig;
  export default withPWAInit;
}
