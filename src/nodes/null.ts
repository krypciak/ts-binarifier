import { gray } from '../colors'
import type { SharedPrintConfig, IndividualPrintConfig } from '../types'
import { Node } from './node'

export class NullNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return this.toStringWrapInOptionalUnion(shr, ind, gray('null', shr.noColor))
    }

    genEncode(): string {
        return ``
    }

    genDecode(): string {
        return `null`
    }
}
