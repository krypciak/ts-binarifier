import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'
import { Node } from './node'
import { NumberNode, NumberType } from './number'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node,
        public sizeNode = new NumberNode(false, 8, NumberType.Unsigned)
    ) {
        super(optional)
        sizeNode.optional = false
        sizeNode.type = NumberType.Unsigned
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return this.toStringWrapInOptionalUnion(
            shr,
            ind,
            'Record<' +
                this.key.toString(shr, { indent: ind.indent + 1 }) +
                ', ' +
                this.value.toString(shr, { indent: ind.indent + 1 }) +
                '>'
        )
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data => {
            const keyVar = `k${data.varCounter.v++}`
            const valueVar = `v${data.varCounter.v++}`
            const recordType = `Record${data.varCounter.v++}`
            const recordKeyType = `RecordKey${data.varCounter.v++}`
            return (
                this.sizeNode.genEncode({ ...data, varName: `Object.keys(${data.varName}).length` }) +
                '\n' +
                Node.indent(data.indent) +
                `type ${recordType} = Omit<NonNullable<typeof ${data.varName}>, 'recordSize'>` +
                '\n' +
                Node.indent(data.indent) +
                `type ${recordKeyType} = keyof ${recordType}` +
                '\n' +
                Node.indent(data.indent) +
                `for (const [${keyVar}, ${valueVar}] of Object.entries(${data.varName})` +
                ` as unknown as [${recordKeyType}, NonNullable<${recordType}[${recordKeyType}]>][]) {\n` +
                Node.indent(data.indent + 1) +
                `${this.key.genEncode({ ...data, varName: keyVar, indent: data.indent + 1 })}` +
                '\n' +
                Node.indent(data.indent + 1) +
                `${this.value.genEncode({ ...data, varName: valueVar, indent: data.indent + 1 })}` +
                `\n` +
                Node.indent(data.indent) +
                `}`
            )
        })
    }

    genDecode(data: GenDecodeData): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `Object.fromEntries(new Array(` +
                this.sizeNode.genDecode(data) +
                `).fill(null).map(_ => [\n` +
                Node.indent(indent + 1) +
                `${this.key.genDecode({ ...data, indent: indent + 1 })}, ${this.value.genDecode({ ...data, indent: indent + 1 })}` +
                `\n` +
                Node.indent(indent) +
                `]))`
        )
    }
}
