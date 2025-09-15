import { green } from '../colors'
import { Node } from './node'

export class StringNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return green('string', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.string(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.string()`)}`
    }
}
