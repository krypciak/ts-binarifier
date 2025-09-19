import { Node } from './node'
import { NumberNode, NumberType } from './number'
import { green } from '../colors'

export class StringNode extends Node {
    constructor(
        optional: boolean | undefined,
        private maxSize = new NumberNode(false, 16, NumberType.Unsigned)
    ) {
        super(optional)
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
                this.maxSize.genEncode({ ...data, varName: `${bufVar}.length` }) +
                '\n' +
                Node.indent(data.indent) +
                `encoder.pushData(${bufVar})`
            )
        })
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(`new TextDecoder().decode(decoder.bin(8*${this.maxSize.genDecode(data)}))`)
    }
}
