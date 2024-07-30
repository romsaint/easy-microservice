module.exports = {
    apps: [
      {
        name: 'server',
        script: 'npm',
        args: 'run server',
        cwd: './server',
      },
      {
        name: 'db-action',
        script: 'npm',
        args: 'run db',
        cwd: './db-action',
      },
      {
        name: 'auth',
        script: 'npm',
        args: 'run auth',
        cwd: './auth',
      },
    ],
  };