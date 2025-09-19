import { magenta } from '../colors'
import { Node, type GenEncodeConfig, type GenEncodeData } from './node'

export class JsonNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return magenta('any', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(data, config, ({ varName }) => `encoder.string(JSON.stringify(${varName}))`)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`JSON.parse(decoder.string())`)}`
    }
}
