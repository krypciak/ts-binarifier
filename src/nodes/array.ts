import { getOrDefineFunction, resetVarCounterForFunction } from '../code-gen-functions'
import { Node } from './node'
import { NumberNode, NumberType } from './number'
import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public type: Node,
        public sizeNode = new NumberNode(false, 16, NumberType.Unsigned)
    ) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return this.toStringWrapInOptionalUnion(shr, ind, this.type.toString(shr, { indent: ind.indent }) + '[]')
    }

    genEncode(data: GenEncodeData): string {
        const varCounter = resetVarCounterForFunction(data.varCounter)
        const funcConfig = getOrDefineFunction(data, {
            name: 'encodeArray' + data.varCounter.func.v++,
            arguments: [`encoder: Encoder`, `array: ` + this.type.toStringInGen(data, { indent: 0 }) + `[]`],
            body:
                this.sizeNode.genEncode({
                    ...data,
                    varCounter,
                    varName: `array.length`,
                    indent: 0,
                }) +
                '\n' +
                `for (const v of array) {\n` +
                Node.indent(1) +
                `${this.type.genEncode({ ...data, varCounter, varName: 'v', indent: 1 })}` +
                `\n` +
                `}`,
        })

        return this.genEncodeWrapOptional(data, data => `this.` + funcConfig.name + `(encoder, ${data.varName})`)
    }

    genDecode(data: GenDecodeData): string {
        const varCounter = resetVarCounterForFunction(data.varCounter)
        const funcConfig = getOrDefineFunction(data, {
            name: 'decodeArray' + data.varCounter.func.v++,
            arguments: ['decoder: Decoder'],
            body:
                `const len = ${this.sizeNode.genDecode({ ...data, varCounter })}\n` +
                `const array = new Array(len)\n` +
                `for (let i = 0; i < len; i++) {\n` +
                Node.indent(1) +
                `array[i] = ` +
                `${this.type.genDecode({ ...data, varCounter, indent: 1 })}\n` +
                `}\n` +
                `return array`,
        })

        return this.genDecodeWrapOptional(`this.` + funcConfig.name + `(decoder)`)
    }
}
