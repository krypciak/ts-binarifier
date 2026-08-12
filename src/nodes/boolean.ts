import { yellow } from '../colors'
import type { GenDataBase, GenEncodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'
import { Node } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return yellow('boolean', shr.noColor) + this.optionalSuffix(ind.ignoreOptional, shr.noColor)
    }

    getTypescriptType(_data: GenDataBase): string {
        return 'boolean'
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, ({ varName }) => `encoder.boolean(${varName})`)
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(`decoder.boolean()`)}`
    }
}
