import { Node } from './node'

export class JsonNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'any'.magenta + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(varName, () => `encoder.string(JSON.stringify(${varName}))`, indent)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`JSON.parse(decoder.string())`)}`
    }
}
