import { Express } from 'express'
import http from 'http'

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

export function listenOnPort(app: Express, port: string) {
  const normalizedPort = normalizePort(port)
  app.set('port', normalizedPort)
  const server = http.createServer(app)
  server.listen(port)
  server.on('error', (error: NodeJS.ErrnoException) => {
    {
      if (error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges')
          process.exit(1)
          break
        case 'EADDRINUSE':
          console.error(bind + ' is already in use')
          process.exit(1)
          break
        default:
          throw error
      }
    }
  })
}
