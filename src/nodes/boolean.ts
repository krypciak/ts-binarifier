import { Node } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'boolean'.red + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.u1(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.u1()`)}`
    }
}
