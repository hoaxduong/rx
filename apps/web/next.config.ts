import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
  experimental: {
    srcPath: '.',
    extract: {
      sourceLocale: 'vi'
    },
    messages: {
      path: './messages',
      format: 'po',
      locales: ['vi', 'en']
    }
  }
});

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db"],
};

export default withNextIntl(nextConfig);
