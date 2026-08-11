import { Node } from './node'
import { NumberNode, NumberType } from './number'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public type: Node,
        public sizeNode = new NumberNode(false, 16, NumberType.Unsigned)
    ) {
        super(optional)
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return this.type.print(noColor, indent) + '[]' + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData): string {
        const valueVar = `v${data.varCounter.v++}`
        const funcConfig = getOrDefineFunction(data, {
            name: 'encodeArray' + data.varCounter.v++,
            arguments: ['encoder: Encoder, array: any'],
            body:
                this.sizeNode.genEncode({ ...data, varName: `array.length`, indent: 0 }) +
                '\n' +
                `for (const ${valueVar} of array) {\n` +
                Node.indent(1) +
                `${this.type.genEncode({ ...data, varName: valueVar, indent: 1 })}` +
                `\n` +
                `}`,
        })

        return this.genEncodeWrapOptional(data, data => `this.` + funcConfig.name + `(encoder, ${data.varName})`)
    }

    genDecode(data: GenDecodeData): string {
        const funcConfig: FunctionConfig = {
            name: 'decodeArray' + data.varCounter.v++,
            arguments: ['decoder: Decoder'],
            body:
                `const len = ${this.sizeNode.genDecode(data)}\n` +
                `const array = new Array(len)\n` +
                `for (let i = 0; i < len; i++) {\n` +
                Node.indent(1) +
                `array[i] = ` +
                `${this.type.genDecode({ ...data, indent: 1 })}\n` +
                `}\n` +
                `return array`,
        }
        data.functions[funcConfig.name] = funcConfig

        return this.genDecodeWrapOptional(`this.` + funcConfig.name + `(decoder)`)
    }
}
