import { Node } from './node'

export class UndefinedNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print() {
        return 'undefined'.gray
    }
}
