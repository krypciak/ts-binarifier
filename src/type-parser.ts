import ts from 'typescript'
import { Node } from './nodes/node'
import { getNumberTypeFromLetter, NumberNode } from './nodes/number'
import { StringNode } from './nodes/string'
import { BooleanNode } from './nodes/boolean'
import { ArrayNode } from './nodes/array'
import { RecordNode } from './nodes/record'
import { InterfaceNode } from './nodes/interface'
import { ArrayConstNode } from './nodes/array-const'
import { JsonNode } from './nodes/json'
import { assert } from './assert'

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

export function parseToNode(type: ts.Type, checker: ts.TypeChecker, indent = 0, isOptional?: boolean): Node {
    const debug = false
    const spacing = '  '.repeat(indent)

    if (type.isUnion()) {
        const isOptional =
            type.types.findIndex(t => t.flags & ts.TypeFlags.Undefined || t.flags & ts.TypeFlags.Null) != -1
        const truthyType = type.getNonNullableType()

        if (debug) console.log(spacing, 'union found, isOptional:', isOptional, checker.typeToString(type))

        if (truthyType.isUnion()) {
            let truthyTypes = truthyType.types
            {
                /* merge enums */
                const enumValueTypes = truthyTypes.filter(t => t.flags & ts.TypeFlags.EnumLiteral)
                if (enumValueTypes.length > 0 && enumValueTypes.every(t => t.isNumberLiteral())) {
                    const values = enumValueTypes.map(t => t.value)
                    const min = Math.min(...values)
                    const max = Math.max(...values)
                    return NumberNode.optimalForRange(isOptional, min, max)
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
                let stringType = truthyTypes.find(t => t.flags & ts.TypeFlags.StringLiteral)
                if (stringType) {
                    truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.StringLiteral))
                    truthyTypes.push(stringType)
                }
            }

            if (truthyTypes.length == 1) {
                const type1 = truthyTypes[0]
                return parseToNode(type1, checker, indent, isOptional)
            } else {
                if (debug) console.log(truthyTypes.map(t => [t.flags, t.symbol?.name]))
                throw new Error(`truthy types other than 1: ${truthyTypes.length}`)
            }
        } else {
            return parseToNode(truthyType, checker, indent, isOptional)
        }
    } else if (type.isIntersection()) {
        let potentialNumberTypeRecord = type.types.find(
            t => t.flags & ts.TypeFlags.Object && t.getProperties().length == 1
        )
        if (potentialNumberTypeRecord) {
            const prop = potentialNumberTypeRecord.getProperties()[0]
            const name = prop.name
            const numberType = getNumberTypeFromLetter(name[0])
            if (name.length >= 2 && name.length <= 4 && numberType) {
                const bits = parseInt(name.substring(1))
                if (!Number.isNaN(bits)) {
                    return new NumberNode(isOptional, bits, numberType)
                }
            }
        }
        console.log(spacing, 'intersection')
        throw new Error('unimplemented intersection')
    } else if (type.isLiteral()) {
        if (debug) console.log(spacing, 'literal', type.value)

        if (typeof type.value == 'number') {
            return new NumberNode(isOptional)
        } else if (typeof type.value == 'string') {
            return new StringNode(isOptional)
        } else throw new Error(`unimplemented literal, typeof type.value == ${typeof type.value}`)
    } else if (type.flags & ts.TypeFlags.Number) {
        if (debug) console.log(spacing, 'number')
        return new NumberNode(isOptional)
    } else if (type.flags & ts.TypeFlags.BooleanLiteral || type.flags & ts.TypeFlags.Boolean) {
        if (debug) console.log(spacing, 'boolean')
        return new BooleanNode(isOptional)
    } else if (type.flags & ts.TypeFlags.String) {
        return new StringNode(isOptional)
    } else if (type.flags & ts.TypeFlags.Enum) {
        if (debug) console.log(spacing, 'enum')
        return new NumberNode(isOptional)
    } else if (checker.isArrayType(type)) {
        const indexType = type.getNumberIndexType()
        assert(indexType)
        return new ArrayNode(isOptional, parseToNode(indexType, checker, indent + 1))
    } else if (type.symbol?.flags == 2048 && ((type as any).constraintType || type.aliasTypeArguments)) {
        if (debug) console.log(spacing, 'record')
        const keyType: ts.Type = (type as any).constraintType ?? type.aliasTypeArguments?.[0]
        assert(keyType)
        const keyNode = parseToNode(keyType, checker, indent + 1)

        const valueType = type.getStringIndexType() ?? type.getNumberIndexType() ?? type.aliasTypeArguments?.[1]
        assert(valueType)
        const valueNode = parseToNode(valueType, checker, indent + 1)

        return new RecordNode(isOptional, keyNode, valueNode)
    } else if (type.symbol) {
        const name = type.symbol.name
        if (debug)
            console.log(
                spacing,
                `type: ${checker.typeToString(type)} (${name}) (flags: ${type.flags}, symbol flags: ${type.symbol.flags})`
            )
        assert(name != 'Array')

        const props = type.getProperties()
        if (debug) console.log(spacing, 'properties:')
        const nodes = Object.fromEntries(
            props.map(p => {
                const propType = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || p.declarations?.[0]!)
                return [p.name, parseToNode(propType, checker, indent + 1)]
            })
        )
        return new InterfaceNode(isOptional, nodes)
    } else if (checker.isArrayLikeType(type)) {
        const types: ts.Type[] = (type as any).resolvedTypeArguments
        assert(types)
        return new ArrayConstNode(
            isOptional,
            types.map(t => parseToNode(t, checker, indent + 1))
        )
    } else if (type.flags & ts.TypeFlags.NonPrimitive || type.flags & ts.TypeFlags.Unknown) {
        return new JsonNode(isOptional)
    } else {
        throw new Error(`unimplemented: ${checker.typeToString(type)}, flags: ${type.flags}`)
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
            if (typeof v !== 'function' && k != 'checker' && v) {
                result[k] = stripFunctions(v, seen)
            }
        }
        return result
    }

    return obj // primitive or function (functions excluded earlier)
}
