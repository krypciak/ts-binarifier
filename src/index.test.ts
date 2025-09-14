import { test } from 'bun:test'
import { encodeDecodeDataTestMultiple } from './test-util'
import type { i8, nodeAny, u8 } from './type-aliases'

const path = new URL('', import.meta.url).pathname

type Type1 = number
test('encode decode data 1', async () => {
    await encodeDecodeDataTestMultiple<Type1>(path, 'Type1', [1])
})

type Type2 = {
    abc: string
    num: number
}
test('encode decode data 2', async () => {
    await encodeDecodeDataTestMultiple<Type2>(path, 'Type2', [{ abc: 'hi', num: 4832.438 }])
})

type Type3 = {
    abc?: string
    num?: number
}
test('encode decode data 3', async () => {
    await encodeDecodeDataTestMultiple<Type3>(path, 'Type3', [
        { abc: 'hi' },
        { num: 3 },
        {},
        { num: 4832.849, abc: 'text' },
    ])
})

type Type4 = u8
test('encode decode data u8', async () => {
    await encodeDecodeDataTestMultiple<Type4>(path, 'Type4', [0, 1, 43, 255])
})

type Type5 = i8
test('encode decode data i8', async () => {
    await encodeDecodeDataTestMultiple<Type5>(path, 'Type5', [0, 1, 43, -3, -127])
})

type Type6 = {
    type: string
} & nodeAny
test('encode decode data nodeAny', async () => {
    await encodeDecodeDataTestMultiple<Type6 & any>(path, 'Type6', [
        { type: 'hi' },
        { type: 'hi', abc: 3214 }
    ])
})
