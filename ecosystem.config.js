module.exports = {
  apps: [
    {
      name: 'ai-clinic-assistant',
      script: './backend/server.js',
      instances: 1, // Change to 'max' if you want to use all CPU cores in cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      time: true, // Add timestamps to logs
    },
  ],
};
