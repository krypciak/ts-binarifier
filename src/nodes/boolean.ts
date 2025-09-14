import { red } from '../colors'
import { Node } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return red('boolean') + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.boolean(${varName})`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.boolean()`)}`
    }
}
