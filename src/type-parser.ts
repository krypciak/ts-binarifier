import ts from 'typescript'
import { Node } from './nodes/node'
import { NumberNode, NumberType } from './nodes/number'
import { StringNode } from './nodes/string'
import { BooleanNode } from './nodes/boolean'
import { ArrayNode } from './nodes/array'
import { RecordNode } from './nodes/record'
import { InterfaceNode } from './nodes/interface'
import { ArrayConstNode } from './nodes/array-const'
import { JsonNode } from './nodes/json'
import { assert } from './assert'
import { StringEnumNode } from './nodes/string-enum'

export type NodeCreateFunction = (
    optional: boolean | undefined,
    types: ts.Type[],
    parser: TypeParser,
    indent: number
) => Node

export interface TypeParserConfig {
    noEnumOptimalization?: boolean
    use32BitFloatsByDefault?: boolean
    enumTypeOverride?: Record<string, string>
    customNodes?: Record<string, NodeCreateFunction>
}

function getSpecialLabel(types: ts.Type[]) {
    const specialTypes = types.filter(t => {
        if (!(t.flags & ts.TypeFlags.Object)) return false
        const props = t.getProperties()
        if (props.length != 1) return false
        const prop = props[0]
        const value = prop.valueDeclaration
        if (
            !value ||
            !ts.isPropertySignature(value) ||
            !value.questionToken ||
            !value.type ||
            value.type.kind != ts.SyntaxKind.NeverKeyword
        )
            return false

        return true
    })
    if (specialTypes.length == 0) return {}

    assert(specialTypes.length == 1)
    const prop = specialTypes[0].getProperties()[0]
    const specialLabel = prop.name
    return { specialLabel, specialType: specialTypes[0] }
}

export function getRecordKeyType(type: ts.Type): ts.Type | undefined {
    return (type as any).constraintType ?? type.aliasTypeArguments?.[0]
}

export function getRecordValueType(type: ts.Type): ts.Type | undefined {
    return type.getStringIndexType() ?? type.getNumberIndexType() ?? type.aliasTypeArguments?.[1]
}

function areAllTheSameClass<T>(arr: T[]): boolean {
    return arr.every(t => Object.getPrototypeOf(t) === Object.getPrototypeOf(arr[0]))
}

export class TypeParser {
    defaultFloatBits = 64

    constructor(
        public checker: ts.TypeChecker,
        public config: TypeParserConfig = {}
    ) {
        if (config.use32BitFloatsByDefault) {
            this.defaultFloatBits = 32
        }
    }

    parseToNode(type: ts.Type, indent = 0, isOptional?: boolean): Node {
        const debug = false
        const spacing = '  '.repeat(indent)

        if (type.isUnion()) {
            const isOptional =
                type.types.findIndex(t => t.flags & ts.TypeFlags.Undefined || t.flags & ts.TypeFlags.Null) != -1
            const truthyType = type.getNonNullableType()

            if (debug) console.log(spacing, 'union found, isOptional:', isOptional, this.checker.typeToString(type))

            if (truthyType.isUnion()) {
                let truthyTypes = truthyType.types
                {
                    const enumValueTypes = truthyTypes.filter(t => t.flags & ts.TypeFlags.EnumLiteral)
                    if (enumValueTypes.length > 0) {
                        if (this.config.enumTypeOverride) {
                            const enumNames = enumValueTypes.map(t => {
                                const enumDec = t.symbol.declarations?.[0].parent
                                if (!enumDec) return
                                assert(ts.isEnumDeclaration(enumDec))
                                return enumDec.name.getText()
                            })
                            for (const enumName of enumNames) {
                                if (!enumName) continue
                                const valueOverride = this.config.enumTypeOverride[enumName]
                                if (!valueOverride) continue
                                const numberNode = NumberNode.fromName(isOptional, valueOverride)
                                if (numberNode) return numberNode
                            }
                        }

                        if (!this.config.noEnumOptimalization && enumValueTypes.every(t => t.isNumberLiteral())) {
                            const values = enumValueTypes.map(t => t.value)
                            const min = Math.min(...values)
                            const max = Math.max(...values)
                            return NumberNode.optimalForRange(isOptional, min, max)
                        }
                    }
                }
                {
                    /* merge boolean literals */
                    let boolType = truthyTypes.find(t => t.flags & ts.TypeFlags.BooleanLiteral)
                    if (boolType) {
                        truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.BooleanLiteral))
                        truthyTypes.push(boolType)
                    }
                }
                {
                    /* merge number literals */
                    let numberType = truthyTypes.find(t => t.flags & ts.TypeFlags.NumberLiteral)
                    if (numberType) {
                        truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.NumberLiteral))
                        truthyTypes.push(numberType)
                    }
                }
                {
                    /* merge string literals */
                    if (truthyTypes.every(t => t.isStringLiteral())) {
                        const values = truthyTypes.map(t => (t as ts.StringLiteralType).value)
                        return new StringEnumNode(isOptional, values)
                    }
                }

                if (truthyTypes.length == 1) {
                    const type1 = truthyTypes[0]
                    return this.parseToNode(type1, indent, isOptional)
                } else {
                    if (debug) console.log(truthyTypes.map(t => [t.flags, t.symbol?.name]))
                    throw new Error(`truthy types other than 1: ${truthyTypes.length}`)
                }
            } else {
                return this.parseToNode(truthyType, indent, isOptional)
            }
        } else if (type.isIntersection()) {
            const { specialLabel, specialType } = getSpecialLabel(type.types)
            if (specialLabel) {
                const numberNode = NumberNode.fromName(isOptional, specialLabel)
                if (numberNode) return numberNode

                if (specialLabel == 'any') {
                    return new JsonNode(isOptional)
                }

                if (this.config.customNodes) {
                    const entry = this.config.customNodes[specialLabel]
                    if (entry) {
                        return entry(
                            isOptional,
                            type.types.filter(t => t != specialType),
                            this,
                            indent
                        )
                    }
                }
            }
            console.log(spacing, 'intersection')

            throw new Error('unimplemented intersection')
        } else if (type.isLiteral()) {
            if (debug) console.log(spacing, 'literal', type.value)

            if (typeof type.value == 'number') {
                return new NumberNode(isOptional, this.defaultFloatBits, NumberType.Float)
            } else if (typeof type.value == 'string') {
                return new StringNode(isOptional)
            } else throw new Error(`unimplemented literal, typeof type.value == ${typeof type.value}`)
        } else if (type.flags & ts.TypeFlags.Number) {
            if (debug) console.log(spacing, 'number')
            return new NumberNode(isOptional, this.defaultFloatBits, NumberType.Float)
        } else if (type.flags & ts.TypeFlags.BooleanLiteral || type.flags & ts.TypeFlags.Boolean) {
            if (debug) console.log(spacing, 'boolean')
            return new BooleanNode(isOptional)
        } else if (type.flags & ts.TypeFlags.String) {
            return new StringNode(isOptional)
        } else if (type.flags & ts.TypeFlags.Enum) {
            if (debug) console.log(spacing, 'enum')
            return new NumberNode(isOptional, this.defaultFloatBits, NumberType.Float)
        } else if (this.checker.isArrayType(type)) {
            const indexType = type.getNumberIndexType()
            assert(indexType)
            return new ArrayNode(isOptional, this.parseToNode(indexType, indent + 1))
        } else if (type.symbol?.flags == 2048 && getRecordKeyType(type)) {
            if (debug) console.log(spacing, 'record')
            const keyType = getRecordKeyType(type)
            assert(keyType)
            const keyNode = this.parseToNode(keyType, indent + 1)

            deepFind(type, 'gaming')
            const valueType = getRecordValueType(type)
            assert(valueType)
            const valueNode = this.parseToNode(valueType, indent + 1)

            return new RecordNode(isOptional, keyNode, valueNode)
        } else if (type.symbol && type.symbol.members?.keys().find(m => m.toString() == '__index')) {
            const valueTypes: Node[] = type.symbol.members
                .entries()
                .flatMap(([k, s]) => {
                    if (k != '__index') return [this.parseToNode(this.checker.getTypeOfSymbol(s), indent + 1)]
                    if (!s.declarations) return []
                    return s.declarations.map(d => {
                        assert(ts.isIndexSignatureDeclaration(d))

                        return this.parseToNode(this.checker.getTypeFromTypeNode(d.type))
                    })
                })
                .toArray()

            if (areAllTheSameClass(valueTypes)) {
                return new RecordNode(isOptional, new StringNode(false), valueTypes[0])
            } else {
                return new JsonNode(isOptional)
            }
        } else if (type.symbol) {
            if (debug)
                console.log(
                    spacing,
                    `type: ${this.checker.typeToString(type)} (${type.symbol.name}) (flags: ${type.flags}, symbol flags: ${type.symbol.flags})`
                )

            const props = type.getProperties()
            if (debug) console.log(spacing, 'properties:')
            const nodes = Object.fromEntries(
                props.map(p => {
                    const propType = this.checker.getTypeOfSymbolAtLocation(
                        p,
                        p.valueDeclaration || p.declarations?.[0]!
                    )
                    return [p.name, this.parseToNode(propType, indent + 1)]
                })
            )
            return new InterfaceNode(isOptional, nodes)
        } else if (this.checker.isArrayLikeType(type) && (type as any).resolvedTypeArguments) {
            const types: ts.Type[] = (type as any).resolvedTypeArguments
            assert(types)
            return new ArrayConstNode(
                isOptional,
                types.map(t => this.parseToNode(t, indent + 1))
            )
        } else if (type.flags & ts.TypeFlags.NonPrimitive || type.flags & ts.TypeFlags.Unknown) {
            return new JsonNode(isOptional)
        } else if (this.checker.typeToString(type) == 'any') {
            return new JsonNode(isOptional)
        } else {
            throw new Error(`unimplemented: ${this.checker.typeToString(type)}, flags: ${type.flags}`)
        }
    }
}

export function printType(type: ts.Type | undefined, checker: ts.TypeChecker = (type as any).checker, indent = 0) {
    const spacing = '  '.repeat(indent)

    if (!type) return console.log(spacing + 'undefined type')

    if (type.isUnion()) {
        console.log(spacing + 'Union:', '(flags:', type.flags, ')')
        type.types.forEach(t => printType(t, checker, indent + 1))
        return
    }

    if (type.isIntersection()) {
        console.log(spacing + 'Intersection:', '(flags:', type.flags, ')')
        type.types.forEach(t => printType(t, checker, indent + 1))
        return
    }

    if (type.isLiteral()) {
        console.log(spacing + `Literal: ${checker.typeToString(type)}`, '(flags:', type.flags, ')')
        return
    }

    if (type.symbol) {
        const name = type.symbol.name
        console.log(spacing + `Type: ${checker.typeToString(type)} (${name})`, '(flags:', type.flags, ')')
        if (name == 'Array') return

        // Print properties recursively
        const props = type.getProperties()
        if (props.length) {
            console.log(spacing + 'Properties:')
            props.forEach(p => {
                const propType = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || p.declarations?.[0]!)
                console.log(spacing + `  ${p.name}:`)
                printType(propType, checker, indent + 2)
            })
        }
        return
    }

    // Fallback for anonymous or intrinsic types
    console.log(spacing + `Type: ${checker.typeToString(type)}`, '(flags:', type.flags, ')')
}

function stripFunctions(obj: any, seen = new WeakMap()) {
    if (Array.isArray(obj)) {
        if (seen.has(obj)) return seen.get(obj)
        const result: any[] = []
        seen.set(obj, result)
        obj.forEach((item, i) => {
            result[i] = stripFunctions(item, seen)
        })
        return result
    }

    if (obj && typeof obj === 'object') {
        if (seen.has(obj)) return seen.get(obj)
        const result: any = {}
        seen.set(obj, result)
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v !== 'function' && k != 'checker' && k != 'parent' && v) {
                result[k] = stripFunctions(v, seen)
            }
        }
        return result
    }

    return obj
}

function deepFind<T>(
    obj: T,
    lookingFor: any | ((obj: any) => boolean),
    path: string = '',
    ignoreSet: Set<string> = new Set(),
    seen = new WeakMap()
): T {
    if (Array.isArray(obj)) {
        const arr = obj.map((e, i) => deepFind(e, lookingFor, `${path}[${i}]`, ignoreSet, seen)) as T
        seen.set(obj, arr)
        return arr
    }
    if (obj === null || typeof obj !== 'object' || typeof obj === 'function') {
        return obj
    }

    /* Handle circular references */
    if (seen.has(obj)) {
        return seen.get(obj)
    }

    /* Create a new object with the same prototype as the original */
    const newObj: T = Object.create(Object.getPrototypeOf(obj))

    /* Add the new object to the seen map to handle circular references */
    seen.set(obj, newObj)

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            let badKey: boolean = false
            for (const ignoreKey of ignoreSet) {
                if (key === ignoreKey) {
                    badKey = true
                    break
                }
            }
            newObj[key] = badKey ? obj[key] : deepFind(obj[key], lookingFor, `${path}.${key}`, ignoreSet, seen)
            const v: any = obj[key]
            if (v === lookingFor || (typeof lookingFor === 'function' && lookingFor(v))) {
                console.log(`%c${path}.${key}`, 'color: lime;', v)
            }
        }
    }
    return newObj
}

const a = false
if (a) {
    stripFunctions(1)
    deepFind({}, '')
}
