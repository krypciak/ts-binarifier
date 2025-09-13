import { Node } from './node'

export class BooleanNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'boolean'.red + this.optionalSuffix(ignoreOptional)
    }
}
