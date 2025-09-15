import { expect, test } from 'bun:test'
import { setupParserAndParseNode } from './test-util'

const path = new URL('', import.meta.url).pathname

enum Type1Enum {
    a,
    b,
    c,
}
type Type1 = Type1Enum
test('type parser enum', async () => {
    const { node } = await setupParserAndParseNode(path, 'Type1')
    expect(node.print(true)).toEqualIgnoringWhitespace('u2')
})

type Type2 = Type1Enum
test('type parser enum type override', async () => {
    const { node } = await setupParserAndParseNode(path, 'Type1', { enumTypeOverride: { Type1Enum: 'u5' } })
    expect(node.print(true)).toEqualIgnoringWhitespace('u5')
})
