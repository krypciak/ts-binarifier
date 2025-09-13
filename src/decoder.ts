export class Decoder {
    private bufI: number = 0
    private bufOffset = 0

    constructor(private buf: Uint8Array) {}

    u1(): boolean {
        const v = this.buf[this.bufI] & (1 << this.bufOffset)
        this.bufOffset++
        if (this.bufOffset >= 8) {
            this.bufOffset = 0
            this.bufI++
        }
        return v != 0
    }

    private bin(bitLength: number): Uint8Array {
        const data = new Uint8Array(bitLength / 8)
        let dataI = 0
        let dataOffset = 0

        let bitsLeft = bitLength
        while (bitsLeft) {
            const read = Math.min(bitsLeft, 8 - this.bufOffset)
            const mask = (1 << read) - 1
            const rawValue = (this.buf[this.bufI] >> this.bufOffset) & mask
            const orValue = rawValue << dataOffset
            data[dataI] |= orValue

            this.bufOffset += read
            if (this.bufOffset >= 8) {
                this.bufOffset -= 8
                this.bufI++
            }
            bitsLeft -= read

            dataOffset += read
            if (dataOffset >= 8) {
                dataOffset -= 8
                dataI++
            }
        }
        return data
    }

    u(bitLength: number): number {
        let num = 0
        let bitsLeft = bitLength
        while (bitsLeft) {
            const read = Math.min(bitsLeft, 8 - this.bufOffset)
            const mask = (1 << read) - 1
            const rawValue = (this.buf[this.bufI] >> this.bufOffset) & mask
            const orValue = rawValue << (bitLength - bitsLeft)
            num |= orValue

            this.bufOffset += read
            if (this.bufOffset >= 8) {
                this.bufOffset -= 8
                this.bufI++
            }
            bitsLeft -= read
        }
        return num
    }

    u8() {
        return this.u(8)
    }
    
    private IEEE32ToDouble(arr: Uint8Array) {
        return new Float32Array(arr.buffer)[0]
    }

    private IEEE64ToDouble(arr: Uint8Array) {
        return new Float64Array(arr.buffer)[0]
    }

    f32() {
        const arr = this.bin(32)
        return this.IEEE32ToDouble(arr)
    }

    f64() {
        return this.IEEE64ToDouble(this.bin(64))
    }

    string() {
        const len = this.u8()
        let strArr: string[] = new Array(len)
        for (let i = 0; i < len; i++) {
            strArr[i] = String.fromCharCode(this.u8())
        }
        return strArr.join('')
    }
}
