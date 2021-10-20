import { generateMnemonic, mnemonicToSeed, mnemonicToSeedSync, seedToRSKHDKey, fromSeed } from '../src'

describe('usage', () => {
  it('generate', () => {
    const mnemonic = generateMnemonic(12)
    expect(mnemonic.split(' ').length).toBe(12)
  })

  it('derive', async () => {
    const mnemonic = 'machine record check ranch resource tiny define awesome erase seat half duty'
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    const privateKey = hdKey.derive(0).privateKey?.toString('hex')

    expect(privateKey).toBe('8bd8deb1117c695e50d7511066c547576b774aef393aa0ee3a042ef55b2717e6')
  })

  it('derive sync', () => {
    const mnemonic = 'machine record check ranch resource tiny define awesome erase seat half duty'
    const seed = mnemonicToSeedSync(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    const privateKey = hdKey.derive(0).privateKey?.toString('hex')

    expect(privateKey).toBe('8bd8deb1117c695e50d7511066c547576b774aef393aa0ee3a042ef55b2717e6')
  })

  it('exports fromSeed', () => {
    expect(fromSeed).toBeDefined()
  })
})
