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
    constructor(
        optional: boolean | undefined,
        public bits: number = 64,
        public type: NumberType = NumberType.Float
    ) {
        super(optional)
        if (type == NumberType.Float) {
            assert(bits == 32 || bits == 64)
        }
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return yellow(getLetterFromNumberType(this.type) + this.bits) + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.f64(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.f64()`)}`
    }
}
