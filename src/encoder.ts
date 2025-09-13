import { assert } from './assert'

export class Encoder {
    buf: number[] = [0]
    bufOffset: number = 0

    private pushData(data: number[] | Uint8Array, bitLength: number = data.length * 8) {
        let dataI = 0
        let dataOffset = 0

        while (bitLength) {
            const v = data[dataI] >> dataOffset
            this.buf[this.buf.length - 1] |= v << this.bufOffset
            const put = Math.min(bitLength, 8 - this.bufOffset)
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

    u1(v: number | boolean) {
        this.pushData([v ? 1 : 0], 1)
    }
    u8(v: number, length: number = 8) {
        this.pushData([v], length)
    }
    u16(v: number, length: number = 16) {
        this.pushData([v & 255, (v & 65280) >> 8], length)
    }
    u32(v: number, length: number = 32) {
        this.pushData([v & 255, (v & 65280) >> 8], length)
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
        return this.pushData(this.doubleToIEEE32(v), 32)
    }

    f64(v: number) {
        return this.pushData(this.doubleToIEEE64(v), 64)
    }

    string(v: string) {
        assert(v.length < 256)
        this.u8(v.length)
        for (let i = 0; i < v.length; i++) {
            this.u8(v.charCodeAt(i))
        }
    }

    getBuffer() {
        return new Uint8Array(this.buf)
    }
}
