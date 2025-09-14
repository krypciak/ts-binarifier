import { gray } from '../colors'
import { Node } from './node'

export class NullNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return gray('null') + this.optionalSuffix(ignoreOptional)
    }

    genEncode(_varName: string): string {
        return ``
    }

    genDecode(): string {
        return `null`
    }
}
