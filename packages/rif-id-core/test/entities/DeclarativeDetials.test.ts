import { createConnection, Connection, Repository } from 'typeorm'
import fs from 'fs'
import { DeclarativeDetail } from '../../src/entities/DeclarativeDetail'
import { did } from '../util'

const database = './rif-id.declarative-details.sqlite'
describe('CRUD declarative details', () => {
  test('create read update delete', async () => {
    // create db connection
    const connection = await createConnection({
      type: 'sqlite',
      database,
      entities: [DeclarativeDetail],
      logging: false,
      dropSchema: true,
      synchronize: true
    })

    const repository = await connection.getRepository(DeclarativeDetail)

    // create
    const declarativeDetails = [
      new DeclarativeDetail(did, 'fullName', 'string', 'Alan Turing'),
      new DeclarativeDetail(did, 'city', 'string', 'London')
    ]

    await repository.save(declarativeDetails)

    // read
    const founDelcarativeDetails = await repository.find()

    for (let founDelcarativeDetail of founDelcarativeDetails) {
      const declarativeDetail = declarativeDetails.find(declarativeDetail => declarativeDetail.name === founDelcarativeDetail.name)

      expect(!!DeclarativeDetail).toBeTruthy()
      expect(founDelcarativeDetail.did).toBe(did)
      expect(founDelcarativeDetail.type).toBe(declarativeDetail.type)
      expect(founDelcarativeDetail.value).toBe(declarativeDetail.value)
    }

    // update
    const cambridge = 'Cambridge'

    await repository.update({ name: 'city' }, { value: cambridge })

    const foundCityDeclarativeDetail = await repository.findOne({ did, name: 'city' })

    expect(foundCityDeclarativeDetail.value).toBe(cambridge)

    // delete
    await repository.createQueryBuilder()
      .delete()
      .from(DeclarativeDetail)
      .where("did = :did and name = :name", { did, name: 'fullName' })
      .execute()

    const foundAfterDelete = await repository.find()

    expect(foundAfterDelete).toHaveLength(1)

    await connection.close()
    fs.unlinkSync(database)
  })
})
