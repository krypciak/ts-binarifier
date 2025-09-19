import { describe, expect, test } from 'bun:test'
import { setupParserAndParseNode } from './test-util'
import { StringEnumNode } from '../nodes/string-enum'

const path = new URL('', import.meta.url).pathname

describe('type parser', () => {
    enum Type1Enum {
        a,
        b,
        c,
    }
    type Type1 = Type1Enum
    test('enum', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type1')
        expect(node.print(true)).toEqualIgnoringWhitespace('u2')
    })

    test('enum type override', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type1', { enumTypeOverride: { Type1Enum: 'u5' } })
        expect(node.print(true)).toEqualIgnoringWhitespace('u5')
    })

    type Type2 = 'a' | 'b' | 'c'
    test('string union', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type2')
        expect(node).toEqual(new StringEnumNode(false, ['a', 'b', 'c']))
    })
})
