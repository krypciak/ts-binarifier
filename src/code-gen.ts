import type { Node } from './nodes/node'

export function codeGen(type: Node) {
    const encodeCode = type.genEncode(`buf`)
    console.log(encodeCode)
    
    const decodeCode = type.genDecode()
    console.log(decodeCode)
    require('fs').promises.writeFile(`/home/krypek/a.js`, decodeCode)

}
