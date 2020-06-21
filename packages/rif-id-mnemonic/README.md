<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-mnemonic</code></h3>
<p align="middle">
    RIF Identity - Mnemonic
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-mnemonic">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-mnemonic.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-mnemonic
```

## Features

- BIP-39 complaint random mnemonic key generation given sentence size
- BIP-39 mnemonic to BIP-32 seed
- BIP-32 seed to BIP-44 compliant RSK multi-account base HD Key

## Usage

Generate a mnemonic:

```javascript
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'

const mnemonic = generateMnemonic(12)
```

Get a private key:

```javascript
import { mnemonicToSeed, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'

const seed = await mnemonicToSeed(mnemonic)
const hdKey = seedToRSKHDKey(seed)
const privateKey = hdKey.derive(0).privateKey?.toString('hex')
```

Or sync:

```javascript
import { mnemonicToSeedSync, seedToRSKHDKey } from '@rsksmart/rif-id-mnemonic'

const seed = mnemonicToSeedSync(mnemonic)
const hdKey = seedToRSKHDKey(seed)
const privateKey = hdKey.derive(0).privateKey?.toString('hex')
```

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- BIP39: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- BIP32: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- BIP44: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
