import { createConnection, Connection } from 'typeorm'
import { Entities as DAFEntities } from 'daf-core'
import fs from 'fs'
import { Entities } from '../src/entities'

export const createSqliteConnection = (database: string) => createConnection({
  type: 'sqlite',
  database,
  entities: [...Entities, ...DAFEntities],
  logging: false,
  dropSchema: true, // Isolate each test case
  synchronize: true
})

export const deleteDatabase = (connection: Connection, database: string) => connection.close().then(() => {
  if (fs.existsSync(database)) fs.unlinkSync(database)
})
