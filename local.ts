import { knex } from 'knex'
import { LocalContainer } from './src/di/config'

const app = new LocalContainer()

app.run()
