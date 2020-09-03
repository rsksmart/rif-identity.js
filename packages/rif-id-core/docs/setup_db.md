### Setup Database

[uPort DAF agent](https://github.com/uport-project/daf) uses [`typeorm`](https://github.com/typeorm/typeorm) to persist keys, identities, messages, credentials, presentations and others.

1. [Install `typeorm`](https://typeorm.io/#/undefined/installation) in your project - you will be able to pick a database engine, such us SQLite, MongoDB or `sql.js`.
2. Create a connection - create a file named `dbConnection.ts` in your project and include

  ```typescript
  import { createConnection } from 'typeorm'
  import Daf from 'daf-core'
  import { Entities } from '@rsksmart/rif-id-daf'

  export const dbConnection = createConnection({
    type: 'sqlite',
    database: 'rif-id.sqlite',
    entities: [...Daf.Entities, ...Entities],
    synchronize: true
  })
  ```
3. You can now [setup the uPort DAF agent](./setup_agent)

> Recommendation: first try with SQLite. You can start working in your projects using SQLite very quick, it is easy to setup.
