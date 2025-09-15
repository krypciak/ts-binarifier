import { kill } from 'process'
import { assert } from './assert'

export class Encoder {
    private buf: number[] = [0]
    bufOffset: number = 0

    private pushData(data: number[] | Uint8Array, bitLength: number = data.length * 8) {
        let dataI = 0
        let dataOffset = 0

        while (bitLength) {
            const put = Math.min(bitLength, 8 - this.bufOffset, 8 - dataOffset)
            const v = (data[dataI] >> dataOffset) & ((1 << put) - 1)
            this.buf[this.buf.length - 1] |= v << this.bufOffset
            this.bufOffset += put
            if (this.bufOffset >= 8) {
                this.bufOffset -= 8
                this.buf.push(0)
            }
            dataOffset += put
            bitLength -= put
            if (dataOffset >= 8) {
                dataOffset -= 8
                dataI++
            }
        }
    }

    boolean(v: number | boolean) {
        // console.log('encode boolean:', v)
        this.pushData([v ? 1 : 0], 1)
    }

    u8(v: number, length: number = 8) {
        // console.log('encode u8:', v, 'len:', length)
        this.pushData([v & 0xff], length)
    }
    u16(v: number, length: number = 16) {
        // console.log('encode u16:', v, 'len:', length)
        this.pushData([v & 0xff, (v >>> 8) & 0xff], length)
    }
    u24(v: number, length: number = 24) {
        // console.log('encode u32:', v, 'len:', length)
        this.pushData([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff], length)
    }
    u32(v: number, length: number = 32) {
        this.pushData([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff], length)
    }

    i8(v: number, length: number = 8) {
        this.u8(v, length)
    }
    i16(v: number, length: number = 32) {
        this.i16(v, length)
    }
    i32(v: number, length: number = 32) {
        this.i32(v, length)
    }

    private doubleToIEEE32(f: number) {
        const buf = new ArrayBuffer(4)
        const float = new Float32Array(buf)
        const uint = new Uint8Array(buf)
        float[0] = f
        return uint
    }

    private doubleToIEEE64(f: number) {
        const buf = new ArrayBuffer(8)
        const float = new Float64Array(buf)
        const uint = new Uint8Array(buf)
        float[0] = f
        return uint
    }

    f32(v: number) {
        // console.log('encode f32:', v)
        return this.pushData(this.doubleToIEEE32(v), 32)
    }

    f64(v: number) {
        // console.log('encode f64:', v)
        return this.pushData(this.doubleToIEEE64(v), 64)
    }

    string(v: string) {
        // console.log('encode string:', v, 'len:', v.length)
        const buf = new TextEncoder().encode(v)
        assert(buf.length < 65536)
        this.u16(buf.length)
        this.pushData(buf)
    }

    getBuffer() {
        return new Uint8Array(this.buf)
    }
}
