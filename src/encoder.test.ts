import { expect, test } from 'bun:test'
import { Encoder } from './encoder'

test('encoder boolean', () => {
    const encoder = new Encoder()
    encoder.boolean(1)
    encoder.boolean(0)
    encoder.boolean(0)
    encoder.boolean(1)
    expect(encoder.bufOffset).toBe(4)
    const buf = encoder.getBuffer()
    expect(buf[0]).toBe(9)
})

test('encoder u8', () => {
    const encoder = new Encoder()
    encoder.u8(213)
    expect(encoder.bufOffset).toBe(0)
    const buf = encoder.getBuffer()
    expect(buf[0]).toBe(213)
})

test('encoder i8', () => {
    const encoder = new Encoder()
    const v = -48
    encoder.i8(v)
    expect(encoder.bufOffset).toBe(0)
    const buf = encoder.getBuffer()
    expect(buf[0]).toBe(256 + v)
})

test('encoder u8 boolean', () => {
    const encoder = new Encoder()
    encoder.boolean(0)
    encoder.u8(5)
    expect(encoder.bufOffset).toBe(1)
    const buf = encoder.getBuffer()
    expect(buf[0]).toBe(10)
    expect(buf[1]).toBe(0)
})

test('encoder string', () => {
    const encoder = new Encoder()
    encoder.string('ab')
    expect(encoder.bufOffset).toBe(0)
    const buf = encoder.getBuffer()
    expect(buf[0]).toBe(2)
    expect(buf[1]).toBe(0)
    expect(buf[2]).toBe(97)
    expect(buf[3]).toBe(98)
})
