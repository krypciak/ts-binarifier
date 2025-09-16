import { test } from 'bun:test'
import { encodeDecodeDataTestMultiple } from './test-util'
import type { f32, i2, i8, nodeAny, u2, u8 } from '../type-aliases'

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
    await encodeDecodeDataTestMultiple<Type6 & any>(path, 'Type6', [{ type: 'hi' }, { type: 'hi', abc: 3214 }])
})

type Type7 = {
    type: string
    [key: string]: any
}
test('encode decode data interface record any', async () => {
    await encodeDecodeDataTestMultiple<Type7>(path, 'Type7', [{ type: 'hi' }, { type: 'hi', abc: 3214 }])
})

type Type8 = {
    type: string
    [key: string]: string
}
test('encode decode data interface to record', async () => {
    await encodeDecodeDataTestMultiple<Type8>(path, 'Type8', [{ type: 'hi' }, { type: 'hi', abc: 'das' }])
})

type Type9 = any
test('encode decode data any number', async () => {
    await encodeDecodeDataTestMultiple<Type9>(path, 'Type9', [1, 'hi'])
})

type Type10 = [string, string | undefined]
test('encode decode data array const optional', async () => {
    await encodeDecodeDataTestMultiple<Type10>(path, 'Type10', [
        ['das', 'hi'],
        ['lo', undefined],
    ])
})

type Type11 = {
    a: i2
    b: u2
    c: f32
}
test('encode decode data different number types', async () => {
    await encodeDecodeDataTestMultiple<Type11>(path, 'Type11', [
        { a: -1, b: 0, c: -3 },
        { a: 1, b: 2, c: -8594.25 },
    ])
})
