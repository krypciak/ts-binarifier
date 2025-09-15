import { magenta } from '../colors'
import { Node } from './node'

export class JsonNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return magenta('any', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.string(JSON.stringify(${varName}))`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`JSON.parse(decoder.string())`)}`
    }
}
