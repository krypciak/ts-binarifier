import { expect, test } from 'bun:test'
import { Encoder } from './encoder'
import { Decoder } from './decoder'

test('encode decode boolean', () => {
    const encoder = new Encoder()
    encoder.u1(1)
    encoder.u1(0)
    encoder.u1(0)
    encoder.u1(1)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.u1()).toBe(true)
    expect(decoder.u1()).toBe(false)
    expect(decoder.u1()).toBe(false)
    expect(decoder.u1()).toBe(true)

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

test('encode decode u8 boolean', () => {
    const encoder = new Encoder()
    encoder.u1(0)
    encoder.u8(23)
    encoder.u1(1)
    encoder.u8(2, 3)
    encoder.u8(218)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.u1()).toBe(false)
    expect(decoder.u8()).toBe(23)
    expect(decoder.u1()).toBe(true)
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

test('encode decode string', () => {
    const encoder = new Encoder()
    const str = "abcdefg"
    encoder.string(str)

    const buf = encoder.getBuffer()
    const decoder = new Decoder(buf)

    expect(decoder.string()).toBe(str)

})
