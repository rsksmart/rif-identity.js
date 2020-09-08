<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-declarative-details</code></h3>
<p align="middle">
    RIF Identity - Declarative Details
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-declarative-details">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-declarative-details.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-declarative-details
```

## Features

- CRUD declarative details
- Convert declarative details into RID Id Core declarative details

## Usage

This package is to be used integrated with RIF Id Core module, but it can be used as standalone module.

Create a `typeorm` connection and include declarative details entity

```javascript
import { DeclarativeDetail } from '@rsksmart/rid-id-declarative-details'

const connection = await createConnection({
    type: 'sqlite',
    database,
    entities: [DeclarativeDetail], // other entities
    logging: false,
    dropSchema: true,
    synchronize: true
})
```

CRUD oeprations

```javascript
// create
await repository.save([
    new DeclarativeDetail('fullName', 'string', 'Alan Turing'),
    new DeclarativeDetail('city', 'string', 'London')
])

// read
const founDelcarativeDetails = await repository.find()

// update
await repository.update({ name: 'city' }, { value: 'Cambridge' })

// delete
await repository.createQueryBuilder()
    .delete()
    .from(DeclarativeDetail)
    .where("name = :name", { name: 'fullName' })
    .execute()
```

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).
