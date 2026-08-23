export default {
  apps: [
    {
      name: 'forsil99-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 7039',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 7039,
      },
    },
  ],
};
