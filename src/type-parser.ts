import ts from 'typescript'
import * as path from 'path'
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
import { EnumNode } from './nodes/enum'
import { UnionNode } from './nodes/union'
import { LiteralNode } from './nodes/literal'

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
    destPath?: string
}

function getSpecialLabels(types: ts.Type[]) {
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
            !value.type // ||
            // value.type.kind != ts.SyntaxKind.NeverKeyword
        )
            return false

        return true
    })
    if (specialTypes.length == 0) return []

    return specialTypes.map(t => {
        const prop = t.getProperties()[0]
        const specialLabel = prop.name

        return { specialLabel, specialType: t }
    })
}

export function getRecordKeyType(type: ts.Type): ts.Type | undefined {
    return (type as any).constraintType ?? type.aliasTypeArguments?.[0]
}

export function getRecordValueType(type: ts.Type): ts.Type | undefined {
    return (
        type.getStringIndexType() ??
        type.getNumberIndexType() ??
        type.aliasTypeArguments?.[1] ??
        ('constraintType' in type ? (type.constraintType as ts.Type) : undefined)
    )
}

function areAllTheSameClass<T>(arr: T[]): boolean {
    return arr.every(t => Object.getPrototypeOf(t) === Object.getPrototypeOf(arr[0]))
}

function getPropType(checker: ts.TypeChecker, prop: ts.Symbol): ts.Type {
    return checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration || prop.declarations?.[0]!)
}

function getLiteralValue(type: ts.Type): number | string | boolean | undefined {
    if (type.isLiteral()) {
        if (typeof type.value === 'object') {
            //bigint
            throw new Error('bigint literals not supported')
        }
        return type.value
    } else if (type.flags & ts.TypeFlags.BooleanLiteral) {
        // @ts-expect-error
        const intrinsicName: string = type.intrinsicName
        if (intrinsicName === 'true') return true
        if (intrinsicName === 'false') return false
    }
}

const debug = false
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

    private getImportableName(type: ts.Type): { name: string; importPath: string } | undefined {
        const symbol = type.symbol
        if (!symbol) return undefined
        const name = symbol.name
        if (!name || name == '__type' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) return undefined
        const decl = symbol.declarations?.[0]
        if (!decl) return undefined
        const sourceFile = decl.getSourceFile()
        if (sourceFile.isDeclarationFile || !ts.isSourceFile(decl.parent)) return undefined
        const isExported =
            (ts.canHaveModifiers(decl) && ts.getModifiers(decl)?.some(m => m.kind == ts.SyntaxKind.ExportKeyword)) ||
            this.checker.getSymbolAtLocation(sourceFile)?.exports?.has(name as ts.__String) === true
        if (!isExported) return undefined
        const destPath = this.config.destPath
        if (!destPath) return undefined
        let rel = path.relative(path.dirname(destPath), sourceFile.fileName).replace(/\\/g, '/')
        rel = rel.replace(/\.ts$/, '')
        if (!rel.startsWith('.')) rel = './' + rel
        return { name, importPath: rel }
    }

    private handleUnion(type: ts.UnionType, indent: number) {
        const spacing = '  '.repeat(indent)

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
                /* merge number literals */
                if (truthyTypes.every(t => t.isNumberLiteral())) {
                    const values = truthyTypes.map(t => t.value)
                    return new EnumNode(isOptional, values)
                }
            }
            {
                /* merge string literals */
                if (truthyTypes.every(t => t.isStringLiteral())) {
                    const values = truthyTypes.map(t => t.value)
                    return new EnumNode(isOptional, values)
                }
            }

            if (truthyTypes.length == 1) {
                const type1 = truthyTypes[0]
                return this.parseToNode(type1, indent, isOptional)
            }
            if (truthyTypes.length == 2 && truthyTypes.every(t => t.flags & ts.TypeFlags.BooleanLiteral)) {
                return new BooleanNode(isOptional)
            }

            if (truthyTypes.every(t => t.symbol && t.getProperties().length > 0)) {
                const propertyNamesSetArr = truthyTypes.map(t => new Set(t.getProperties().map(s => s.name)))
                const commonUnionKeys = propertyNamesSetArr.reduce(
                    (acc, v) => acc.intersection(v),
                    propertyNamesSetArr[0]
                )
                if (commonUnionKeys.size > 1)
                    throw new Error(`union has more than 1 common keys: [${[...commonUnionKeys].join(', ')}]`)

                if (commonUnionKeys.size == 1) {
                    const commonUnionKey = commonUnionKeys.values().next().value!
                    if (debug) console.log(spacing, 'commonUnionKey:', commonUnionKey)

                    const propTypes = truthyTypes.map(t =>
                        t.getProperties().map(s => ({ symbol: s, type: getPropType(this.checker, s) }))
                    )
                    const commonUnionKeyTypes = propTypes.map(
                        arr => arr.find(({ symbol }) => symbol.name == commonUnionKey)!.type
                    )

                    const isBoolUnion = commonUnionKeyTypes.every(t => t.flags & ts.TypeFlags.BooleanLiteral)
                    if (!commonUnionKeyTypes.every(t => t.isLiteral()) && !isBoolUnion) {
                        if (debug) {
                            for (const type of commonUnionKeyTypes) printType(type)
                        }
                        throw new Error(`not all values of union with common key: ${commonUnionKey} are literals`)
                    }
                    const commonUnionKeyValues = commonUnionKeyTypes.map(t => getLiteralValue(t)!)

                    if (!commonUnionKeyValues.every(v => typeof v !== commonUnionKeyValues[0])) {
                        if (debug) {
                            for (const type of commonUnionKeyTypes) printType(type)
                        }
                        throw new Error(`not all values of union with common key: ${commonUnionKey} are the same type`)
                    }
                    if (!commonUnionKeyValues.every(v => typeof v !== 'object')) {
                        throw new Error(`union with common key: ${commonUnionKey} values of bigint not supported`)
                    }
                    const commonUnionKeyNode = new EnumNode(false, commonUnionKeyValues, true)

                    const dataNodes = Object.fromEntries(
                        propTypes.map(
                            (arr, i) =>
                                [
                                    commonUnionKeyValues[i],
                                    new InterfaceNode(
                                        false,
                                        Object.fromEntries(
                                            arr
                                                .filter(({ symbol }) => symbol.name != commonUnionKey)
                                                .map(
                                                    ({ symbol, type }) =>
                                                        [symbol.name, this.parseToNode(type, indent + 1)] as const
                                                )
                                        )
                                    ),
                                ] as const
                        )
                    )

                    return new UnionNode(isOptional, commonUnionKey, commonUnionKeyNode, dataNodes)
                }
            }
            printType(truthyType)
            if (debug) console.log(truthyTypes.map(t => [t.flags, t.symbol?.name]))
            throw new Error(`truthy types other than 1: ${truthyTypes.length}`)
        } else {
            return this.parseToNode(truthyType, indent, isOptional)
        }
    }

    private handleIntersection(type: ts.IntersectionType, indent: number, isOptional: boolean | undefined) {
        const spacing = '  '.repeat(indent)

        const specialLabels = getSpecialLabels(type.types)
        if (specialLabels.length > 0) {
            assert(specialLabels.length == 1)
            const { specialLabel, specialType } = specialLabels[0]
            const regularTypes = type.types.filter(t => t != specialType)

            const numberNode = NumberNode.fromName(isOptional, specialLabel)
            if (numberNode) return numberNode

            if (specialLabel == 'any') {
                return new JsonNode(isOptional)
            }

            if (specialLabel == 'recordSize') {
                assert(regularTypes.length == 1)
                const prop = specialType.getProperties()[0]
                const sizeType = getPropType(this.checker, prop)
                const node = this.parseToNode(sizeType, indent + 1)
                assert(node instanceof NumberNode)
                node.optional = false

                return this.parseToNode(regularTypes[0], indent + 1, isOptional, { nextRecordSize: node })
            }

            if (this.config.customNodes) {
                const entry = this.config.customNodes[specialLabel]
                if (entry) {
                    return entry(isOptional, regularTypes, this, indent)
                }
            }
        }
        console.log(spacing, 'intersection')

        throw new Error('unimplemented intersection')
    }

    parseToNode(type: ts.Type, indent = 0, isOptional?: boolean, data: { nextRecordSize?: NumberNode } = {}): Node {
        const spacing = '  '.repeat(indent)

        if (type.isUnion()) {
            return this.handleUnion(type, indent)
        } else if (type.isIntersection()) {
            return this.handleIntersection(type, indent, isOptional)
        } else if (getLiteralValue(type) !== undefined) {
            const value = getLiteralValue(type)!
            if (debug) console.log(spacing, 'literal', value)

            return new LiteralNode(isOptional, value)
        } else if (type.flags & ts.TypeFlags.Number) {
            if (debug) console.log(spacing, 'number')
            return new NumberNode(isOptional, this.defaultFloatBits, NumberType.Float)
        } else if (type.flags & ts.TypeFlags.Boolean) {
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
            return new ArrayNode(isOptional, this.parseToNode(indexType, indent + 1), data.nextRecordSize)
        } else if (type.symbol?.flags == 2048 && getRecordKeyType(type)) {
            if (debug) console.log(spacing, 'record')
            const keyType = getRecordKeyType(type)
            assert(keyType)
            const keyNode = this.parseToNode(keyType, indent + 1)

            const valueType = getRecordValueType(type)
            assert(valueType)
            const valueNode = this.parseToNode(valueType, indent + 1)

            return new RecordNode(isOptional, keyNode, valueNode, data.nextRecordSize)
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
                return new RecordNode(isOptional, new StringNode(false), valueTypes[0], data.nextRecordSize)
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
                    const propType = getPropType(this.checker, p)
                    return [p.name, this.parseToNode(propType, indent + 1)]
                })
            )
            const importable = this.getImportableName(type)
            return new InterfaceNode(isOptional, nodes, importable?.name, importable?.importPath)
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
                const propType = getPropType(checker, p)
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
