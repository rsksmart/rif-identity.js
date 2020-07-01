<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-core</code></h3>
<p align="middle">
    RIF Identity - Core
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-core">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-core.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-core
```

## Features

This is the RIF Identity core module. It allows to handle different identities in a secure and private manner.

- Hanlde core reducer's mnemonic provider

## Usage

Create a mnemonic identity:

```javascript
import RIFIdentityCore from '@rsksmart/rif-id-core'

const identity = RIFIdentity.createWithMnemonic()

const provider = identity.getDefaultProvider()

provider.mnemonic.args
// wise grit jazz liar promote zebra galaxy method upset ill art session
```

Or with more words:

```javascript
const identity = RIFIdentity.createWithMnemonic(15)
```

Use with an existent mnemonic:

```javascript
const identity = RIFIdentity.fromMnemonic('wise grit jazz liar promote zebra galaxy method upset ill art session')
```

Use RIF Identity Core with different providers:

```javascript
const identity = new RIFIdentity()

identity.addMnemonicProvider('primary', 'wise grit jazz liar promote zebra galaxy method upset ill art session')
identity.addMnemonicProvider('secondary', 'offer lyrics aerobic stone excuse nephew village real monster kick knee truly')
```

In most of the cases using to mnemonics is not necessary. The same results can be achieved using a single one, so a simple way:


```javascript
const identity = new RIFIdentity()

identity.addMnemonicProviderDefault('wise grit jazz liar promote zebra galaxy method upset ill art session')
```

## Extend

- Accessors to handle more than one mnemonic provider
- Derive identities from a single mnemonic

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).
