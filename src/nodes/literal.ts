import { Node } from './node'
import { green, yellow } from '../colors'
import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'

export class LiteralNode<T extends string | number | boolean> extends Node {
    constructor(
        optional: boolean | undefined,
        public value: T
    ) {
        super(optional)
    }

    toString(shr: SharedPrintConfig, _ind: IndividualPrintConfig) {
        const v = this.value
        return typeof v === 'string' ? green(`'${v}'`, shr.noColor) : yellow(`${v}`, shr.noColor)
    }

    genEncode(data: GenEncodeData) {
        return this.genEncodeWrapOptional(data, _data => '// literal: ' + this.printNoColor())
    }

    genDecode(_data: GenDecodeData): string {
        return this.genDecodeWrapOptional(this.printNoColor())
    }
}
