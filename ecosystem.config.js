module.exports = {
  apps: [{
    name: 'asesorias-cyj',
    script: '.next/standalone/server.js',
    cwd: '/var/www/asesorias-cyj',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    // Logs
    error_file: '/var/log/asesorias-cyj/error.log',
    out_file: '/var/log/asesorias-cyj/out.log',
    log_file: '/var/log/asesorias-cyj/combined.log',
    time: true
  }]
}
