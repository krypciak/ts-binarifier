import { test } from 'bun:test'
import { encodeDecodeDataTestMultiple } from './test-util'

type Type1 = number
test('encode decode data 1', async () => {
    await encodeDecodeDataTestMultiple<Type1>(new URL('', import.meta.url).pathname, 'Type1', [1])
})

type Type2 = {
    abc: string
    num: number
}
test('encode decode data 2', async () => {
    await encodeDecodeDataTestMultiple<Type2>(new URL('', import.meta.url).pathname, 'Type2', [
        //
        { abc: 'hi', num: 4832.438 },
    ])
})

type Type3 = {
    abc?: string
    num?: number
}
test('encode decode data 3', async () => {
    await encodeDecodeDataTestMultiple<Type3>(new URL('', import.meta.url).pathname, 'Type3', [
        //
        { abc: 'hi' },
        { num: 3 },
        {},
        { num: 4832.849, abc: 'text' },
    ])
})
