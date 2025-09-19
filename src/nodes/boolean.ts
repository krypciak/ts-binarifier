import { red } from '../colors'
import { Node, type GenEncodeConfig, type GenEncodeData } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return red('boolean', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(data, config, ({ varName }) => `encoder.boolean(${varName})`)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.boolean()`)}`
    }
}
