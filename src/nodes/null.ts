import { Node } from './node'

export class NullNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'null'.gray + this.optionalSuffix(ignoreOptional)
    }
}
