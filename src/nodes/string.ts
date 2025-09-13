import { Node } from './node'

export class StringNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'string'.green + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.string(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`encoder.string()`)}`
    }
}
