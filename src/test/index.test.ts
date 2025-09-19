import { describe, test } from 'bun:test'
import { encodeDecodeDataTestMultiple, encodeMultipleThrows } from './test-util'
import type { f32, i16, i2, i32, i8, nodeAny, u2, u32, u8 } from '../type-aliases'

const path = new URL('', import.meta.url).pathname

describe('encode decode data', () => {
    describe('number', () => {
        type Type1 = number
        test('1', async () => {
            await encodeDecodeDataTestMultiple<Type1>(path, 'Type1', [1])
        })

        type Type4 = u8
        test('u8', async () => {
            await encodeDecodeDataTestMultiple<Type4>(path, 'Type4', [0, 1, 43, 255])
        })

        type Type5 = i8
        test('i8', async () => {
            await encodeDecodeDataTestMultiple<Type5>(path, 'Type5', [0, 1, 43, -3, -127])
        })

        type Type19 = u32
        test('u32', async () => {
            await encodeDecodeDataTestMultiple<Type19>(path, 'Type19', [1, 2, 3, 4832946])
        })

        type Type11 = {
            a: i2
            b: u2
            c: f32
            d: u32
            e: i32
        }
        test('different types mix', async () => {
            await encodeDecodeDataTestMultiple<Type11>(path, 'Type11', [
                { a: -1, b: 0, c: -3, d: 47328942, e: -4832976 },
                { a: 1, b: 2, c: -8594.25, d: 89939, e: -84999 },
            ])
        })

        type Type13 = u8
        test('outside of u8', async () => {
            await encodeMultipleThrows<Type13>(path, 'Type13', [256, -1, 4294967296])
        })

        type Type14 = i8
        test('outside of i8', async () => {
            await encodeMultipleThrows<Type14>(path, 'Type14', [128, -129, 4294967296, -4294967296])
        })

        type Type17 = i32
        test('i32', async () => {
            await encodeDecodeDataTestMultiple<Type17>(path, 'Type17', [-1, -4832976])
        })

        type Type18 = i16
        test('i16', async () => {
            await encodeDecodeDataTestMultiple<Type18>(path, 'Type18', [-1, -4])
        })
    })

    describe('string', () => {
        type Type12 = 'a' | 'b' | 'c'
        test('union', async () => {
            await encodeDecodeDataTestMultiple<Type12>(path, 'Type12', ['a', 'b', 'c'])
        })

        type Type15 = string
        test('string', async () => {
            await encodeDecodeDataTestMultiple<Type15>(path, 'Type15', ['hi', 'welcome', ''])
        })

        type Type16 = string
        test('unicode', async () => {
            await encodeDecodeDataTestMultiple<Type16>(path, 'Type16', ['好hi'])
        })
    })

    type Type2 = {
        abc: string
        num: number
    }
    test('2', async () => {
        await encodeDecodeDataTestMultiple<Type2>(path, 'Type2', [{ abc: 'hi', num: 4832.438 }])
    })

    type Type3 = {
        abc?: string
        num?: number
    }
    test('3', async () => {
        await encodeDecodeDataTestMultiple<Type3>(path, 'Type3', [
            { abc: 'hi' },
            { num: 3 },
            {},
            { num: 4832.849, abc: 'text' },
        ])
    })

    type Type6 = {
        type: string
    } & nodeAny
    test('nodeAny', async () => {
        await encodeDecodeDataTestMultiple<Type6 & any>(path, 'Type6', [{ type: 'hi' }, { type: 'hi', abc: 3214 }])
    })

    type Type7 = {
        type: string
        [key: string]: any
    }
    test('interface record any', async () => {
        await encodeDecodeDataTestMultiple<Type7>(path, 'Type7', [{ type: 'hi' }, { type: 'hi', abc: 3214 }])
    })

    type Type8 = {
        type: string
        [key: string]: string
    }
    test('interface to record', async () => {
        await encodeDecodeDataTestMultiple<Type8>(path, 'Type8', [{ type: 'hi' }, { type: 'hi', abc: 'das' }])
    })

    type Type9 = any
    test('any number', async () => {
        await encodeDecodeDataTestMultiple<Type9>(path, 'Type9', [1, 'hi'])
    })

    type Type10 = [string, string | undefined]
    test('array const optional', async () => {
        await encodeDecodeDataTestMultiple<Type10>(path, 'Type10', [
            ['das', 'hi'],
            ['lo', undefined],
        ])
    })
})
