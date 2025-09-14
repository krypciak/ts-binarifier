import { expect, test } from 'bun:test'
import { NumberNode, NumberType } from './number'

test('NumberNode.optimalForRange', () => {
    expect(NumberNode.optimalForRange(false, 1.1, 8)).toEqual(new NumberNode(false, 64, NumberType.Float))

    expect(NumberNode.optimalForRange(false, 0, 0)).toEqual(new NumberNode(false, 1, NumberType.Unsigned))
    expect(NumberNode.optimalForRange(false, 0, 1)).toEqual(new NumberNode(false, 1, NumberType.Unsigned))
    expect(NumberNode.optimalForRange(false, 0, 2)).toEqual(new NumberNode(false, 2, NumberType.Unsigned))
    expect(NumberNode.optimalForRange(false, 0, 7)).toEqual(new NumberNode(false, 3, NumberType.Unsigned))
    expect(NumberNode.optimalForRange(false, 0, 8)).toEqual(new NumberNode(false, 4, NumberType.Unsigned))
    
    expect(NumberNode.optimalForRange(false, -1, 0)).toEqual(new NumberNode(false, 1, NumberType.Signed))
    expect(NumberNode.optimalForRange(false, -1, 1)).toEqual(new NumberNode(false, 2, NumberType.Signed))
    expect(NumberNode.optimalForRange(false, -1, 7)).toEqual(new NumberNode(false, 4, NumberType.Signed))
    expect(NumberNode.optimalForRange(false, -8, 7)).toEqual(new NumberNode(false, 4, NumberType.Signed))
    expect(NumberNode.optimalForRange(false, -9, 7)).toEqual(new NumberNode(false, 5, NumberType.Signed))
})
