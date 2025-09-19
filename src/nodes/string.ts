import { Node } from './node'
import { NumberNode } from './number'
import { green } from '../colors'

export class StringNode extends Node {
    private maxSizeNode: NumberNode

    constructor(optional: boolean | undefined, maxSize: number = (1 << 16) - 1) {
        super(optional)
        this.maxSizeNode = NumberNode.optimalForRange(false, 0, maxSize)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return green('string', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData) {
        return this.genEncodeWrapOptional(data, data => {
            const bufVar = `buf${data.varCounter.v++}`

            return (
                `const ${bufVar} = new TextEncoder().encode(${data.varName})` +
                '\n' +
                Node.indent(data.indent) +
                this.maxSizeNode.genEncode({ ...data, varName: `${bufVar}.length` }) +
                '\n' +
                Node.indent(data.indent) +
                `encoder.pushData(${bufVar})`
            )
        })
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(
            `new TextDecoder().decode(decoder.bin(8 * ${this.maxSizeNode.genDecode(data)}))`
        )
    }
}
