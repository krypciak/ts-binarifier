import { magenta } from '../colors'
import { Node } from './node'
import { StringNode } from './string'

export class JsonNode extends Node {
    private stringNode: StringNode

    constructor(_optional: boolean | undefined, maxLength: number = (1 << 24) - 1) {
        super(true)
        this.stringNode = new StringNode(false, maxLength)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return magenta('any', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data =>
            this.stringNode.genEncode({ ...data, varName: `JSON.stringify(${data.varName})` })
        )
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(`JSON.parse(${this.stringNode.genDecode(data)})`)
    }
}
