import { assert } from '../assert'
import { yellow } from '../colors'
import { Node } from './node'

export enum NumberType {
    Unsigned = 1,
    Signed = 2,
    Float = 3,
}

export function getLetterFromNumberType(type: NumberType) {
    return type == NumberType.Float ? 'f' : type == NumberType.Unsigned ? 'u' : 'i'
}

export function getNumberTypeFromLetter(c: string): NumberType | undefined {
    return c == 'f' ? NumberType.Float : c == 'u' ? NumberType.Unsigned : c == 'i' ? NumberType.Signed : undefined
}

export class NumberNode extends Node {
    static optimalForRange(optional: boolean | undefined, min: number, max: number): NumberNode {
        if (Math.floor(min) != min || Math.floor(max) != max) {
            return new NumberNode(optional, 64, NumberType.Float)
        }

        const signed = min < 0
        let bits: number = 0
        while (max > 0) {
            bits++
            max >>= 1
        }
        if (signed) {
            let bits1 = 0
            while (min < -1) {
                bits1++
                min >>= 1
            }
            bits = Math.max(bits, bits1)
            bits++
        }
        return new NumberNode(optional, Math.max(1, bits), signed ? NumberType.Signed : NumberType.Unsigned)
    }

    static fromName(optional: boolean | undefined, name: string): Node | undefined {
        const numberType = getNumberTypeFromLetter(name[0])
        if (name.length >= 2 && name.length <= 4 && numberType) {
            const bits = parseInt(name.substring(1))
            if (!Number.isNaN(bits)) {
                return new NumberNode(optional, bits, numberType)
            }
        }
    }

    constructor(
        optional: boolean | undefined,
        public bits: number,
        public type: NumberType
    ) {
        super(optional)
        if (type == NumberType.Float) {
            assert(bits == 32 || bits == 64)
        }
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return (
            yellow(getLetterFromNumberType(this.type) + this.bits, noColor) +
            this.optionalSuffix(noColor, ignoreOptional)
        )
    }

    genEncode(varName: string, indent: number = 0): string {
        let suffix: string = getLetterFromNumberType(this.type)
        if (this.type == NumberType.Float) {
            suffix += `${this.bits}(${varName})`
        } else {
            suffix += this.bits <= 8 ? '8' : this.bits <= 16 ? '16' : this.bits <= 24 ? '24' : '32'
            suffix += `(${varName}, ${this.bits})`
        }
        return this.genEncodeWrapOptional(varName, () => `encoder.${suffix}`, indent)
    }

    genDecode(): string {
        let suffix: string = getLetterFromNumberType(this.type)
        if (this.type == NumberType.Float) {
            suffix += `${this.bits}()`
        } else {
            if (this.bits == 8 || this.bits == 16 || this.bits == 32) {
                suffix += `${this.bits}()`
            } else {
                suffix += `(${this.bits})`
            }
        }
        return this.genDecodeWrapOptional(`decoder.${suffix}`)
    }
}
