import { createConnection } from 'typeorm'
import { Entities as DAFEntities } from 'daf-core'
import { Entities } from '../src/entities'

export const createSqliteConnection = (database: string) => createConnection({
  type: 'sqlite',
  database,
  entities: [...Entities, ...DAFEntities],
  logging: false,
  dropSchema: true, // Isolate each test case
  synchronize: true
})
