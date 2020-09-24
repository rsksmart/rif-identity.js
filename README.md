<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-identity.js</code></h3>
<p align="middle">
    RIF Self-sovereign identity library.
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id
```

## Usage

TBD

## Development

Setup:

```
npm install
npm run setup
npm run build
```

First installs global dependencies, then links inner packages, finally installs inner packages dependencies.

### Test

Run all packages tests using [Jest](https://jestjs.io/)

```
npm test
```

Variants:

- Watch all tests (useful for development)

  ```
  npm run test:watch
  ```

- View coverage (output in `/coverage`)

  ```
  npm run test:coverage
  ```

### Build

Builds `src/` folder into `lib/` folder of each package in `packages/` folder using [Babel](https://babeljs.io/)

```
npm run build
```

### Lint

Enforced code syntax using [ESLint](eslint.org) using [standard config](https://github.com/standard/eslint-config-standard)

```
npm run lint
```

Fast fixer:

```
npm run lint:fix
```

## Architecture

TBD

## Release flow

TBD

