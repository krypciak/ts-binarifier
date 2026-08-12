import { describe, expect, test } from 'bun:test'
import { setupParserAndParseNode } from './test-util'
import { EnumNode } from '../nodes/enum'
import { fileURLToPath } from 'url'

const path = fileURLToPath(new URL('', import.meta.url))

describe('type parser', () => {
    enum Type1Enum {
        a,
        b,
        c,
    }
    type Type1 = Type1Enum
    test('enum', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type1')
        expect(node.printNoColor()).toEqualIgnoringWhitespace('u2')
    })

    test('enum type override', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type1', { enumTypeOverride: { Type1Enum: 'u5' } })
        expect(node.printNoColor()).toEqualIgnoringWhitespace('u5')
    })

    type Type2 = 'a' | 'b' | 'c'
    test('string union', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type2')
        expect(node).toEqual(new EnumNode(false, ['a', 'b', 'c']))
    })

    type Type3 = Record<string, number>
    test('record', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type3')
        expect(node.printNoColor()).toEqualIgnoringWhitespace('Record<string, f64>')
    })

    type Type4 = Record<'a' | 'b' | 'c', number>
    test('record string union key', async () => {
        const { node } = await setupParserAndParseNode(path, 'Type4')
        expect(node.printNoColor()).toEqualIgnoringWhitespace(`(Record<('a' | 'b' | 'c'), f64>)`)
    })
})
