import { gray } from '../colors'
import type { SharedPrintConfig, IndividualPrintConfig } from '../types'
import { Node } from './node'

export class UndefinedNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, _ind: IndividualPrintConfig) {
        return gray('undefined', shr.noColor)
    }

    genEncode(): string {
        return ``
    }

    genDecode(): string {
        return `undefined`
    }
}
