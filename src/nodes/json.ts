import { magenta } from '../colors'
import { Node } from './node'
import { NumberNode, NumberType } from './number'
import { StringNode } from './string'

export class JsonNode extends Node {
    private stringNode = new StringNode(false, new NumberNode(false, 24, NumberType.Unsigned))

    constructor(optional: boolean | undefined) {
        super(optional)
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
