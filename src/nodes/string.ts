import { green } from '../colors'
import { Node, type GenEncodeConfig, type GenEncodeData } from './node'

export class StringNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return green('string', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(data, config, ({ varName }) => `encoder.string(${varName})`)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.string()`)}`
    }
}
