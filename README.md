<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-identity.js</code></h3>
<p align="middle">
    RIF Self-sovereign identity library.
</p>
<p align="middle">
    <a href="https://circleci.com/gh/rsksmart/rif-identity.js">
        <img src="https://img.shields.io/circleci/build/github/rsksmart/rif-identity.js?label=CircleCI" alt="npm" />
    </a>
    <a href="https://lgtm.com/projects/g/rsksmart/rif-identity.js/alerts/">
      <img src="https://img.shields.io/lgtm/alerts/github/rsksmart/rif-identity.js" alt="alerts">
    </a>
    <a href="https://lgtm.com/projects/g/rsksmart/rif-identity.js/context:javascript">
      <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rif-identity.js">
    </a>
    <a href="https://codecov.io/gh/rsksmart/rif-identity.js">
      <img src="https://codecov.io/gh/rsksmart/rif-identity.js/branch/develop/graph/badge.svg?token=72T5TQ34HT"/>
    </a>
</p>

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

