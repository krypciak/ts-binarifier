import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'
import { Node } from './node'

export class ArrayConstNode extends Node {
    constructor(
        optional: boolean | undefined,
        public indexTypes: Node[]
    ) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return (
            '[' +
            this.indexTypes.map(t => t.toString(shr, { indent: ind.indent })).join(', ') +
            ']' +
            this.optionalSuffix(ind.ignoreOptional, shr.noColor)
        )
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data =>
            this.indexTypes
                .map((t, i) => t.genEncode({ ...data, varName: `${data.varName}[${i}]` }))
                .join('\n' + Node.indent(data.indent))
        )
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(`[${this.indexTypes.map(t => t.genDecode(data)).join(', ')}]`)
    }
}
