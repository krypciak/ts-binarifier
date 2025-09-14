import { expect, test } from 'bun:test'
import { Encoder } from './encoder'
import { Decoder } from './decoder'

test('encode decode boolean', () => {
    const encoder = new Encoder()
    encoder.boolean(1)
    encoder.boolean(0)
    encoder.boolean(0)
    encoder.boolean(1)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.boolean()).toBe(true)
    expect(decoder.boolean()).toBe(false)
    expect(decoder.boolean()).toBe(false)
    expect(decoder.boolean()).toBe(true)
})

test('encode decode u8', () => {
    const encoder = new Encoder()
    encoder.u8(23)
    encoder.u8(218)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.u8()).toBe(23)
    expect(decoder.u8()).toBe(218)
})

test('encode decode u16', () => {
    const encoder = new Encoder()
    const v1 = 42385
    const v2 = 89
    encoder.u16(v1)
    encoder.u16(v2)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.u16()).toBe(v1)
    expect(decoder.u16()).toBe(v2)
})

test('encode decode u32', () => {
    const encoder = new Encoder()
    const v1 = 42385
    const v2 = 8932899
    encoder.u32(v1)
    encoder.u32(v2)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.u32()).toBe(v1)
    expect(decoder.u32()).toBe(v2)
})

test('encode decode u8 boolean', () => {
    const encoder = new Encoder()
    encoder.boolean(0)
    encoder.u8(23)
    encoder.boolean(1)
    encoder.u8(2, 3)
    encoder.u8(218)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.boolean()).toBe(false)
    expect(decoder.u8()).toBe(23)
    expect(decoder.boolean()).toBe(true)
    expect(decoder.u(3)).toBe(2)
    expect(decoder.u8()).toBe(218)
})

test('encode decode f32', () => {
    const encoder = new Encoder()
    const v1 = 218.134432
    encoder.f32(v1)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.f32().toFixed(5)).toBe(v1.toFixed(5))
})

test('encode decode f64', () => {
    const encoder = new Encoder()
    const v1 = 218.134432
    encoder.f64(v1)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.f64()).toBe(v1)
})

test('encode decode f64 offset', () => {
    const encoder = new Encoder()
    const v1 = 218.134432
    encoder.boolean(true)
    encoder.f64(v1)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.boolean()).toBe(true)
    expect(decoder.f64()).toBe(v1)
})

test('encode decode string', () => {
    const encoder = new Encoder()
    const str = 'abcdefg'
    encoder.string(str)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.string()).toBe(str)
})

test('encode decode mix', () => {
    const encoder = new Encoder()
    const str1 = 'abcdefg'
    const str2 = 'client1'
    const str3 = 'i dont know'
    const v1 = 1.483294
    encoder.boolean(true)
    encoder.string(str1)
    encoder.string(str2)
    encoder.f64(v1)
    encoder.string(str3)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.boolean()).toBe(true)
    expect(decoder.string()).toBe(str1)
    expect(decoder.string()).toBe(str2)
    expect(decoder.f64()).toBe(v1)
    expect(decoder.string()).toBe(str3)
})
