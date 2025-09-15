import { red } from '../colors'
import { Node } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return red('boolean', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.boolean(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.boolean()`)}`
    }
}
