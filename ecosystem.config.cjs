module.exports = {
  apps: [
    {
      name: "netmonitor",
      script: "dist/server/index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOST: "127.0.0.1",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "256M",
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "5s",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/error.log",
      out_file: "logs/out.log",
    },
  ],
};
