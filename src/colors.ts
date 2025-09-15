const close = '\u001b[39m'
// const styles = {
//     black: { open: '\u001b[30m', close },
//     blue: { open: '\u001b[34m', close },
//     cyan: { open: '\u001b[36m', close },
//     gray: { open: '\u001b[90m', close },
//     green: { open: '\u001b[32m', close },
//     grey: { open: '\u001b[90m', close },
//     magenta: { open: '\u001b[35m', close },
//     red: { open: '\u001b[31m', close },
//     white: { open: '\u001b[37m', close },
//     yellow: { open: '\u001b[33m', close },
//     bold: { open: '\u001b[1m', close: '\u001b[22m' },
//     dim: { open: '\u001b[2m', close: '\u001b[22m' },
//     italic: { open: '\u001b[3m', close: '\u001b[23m' },
//     underline: { open: '\u001b[4m', close: '\u001b[24m' },
//     strikethrough: { open: '\u001b[9m', close: '\u001b[29m' },
//     reset: { open: '\u001b[0m', close: '\u001b[0m' },
// }

function color(str: string, id: number, noColor?: boolean): string {
    if (noColor) return str
    return `\u001b[${id}m` + str + close
}

export function gray(str: string, noColor?: boolean): string {
    return color(str, 90, noColor)
}
export function yellow(str: string, noColor?: boolean): string {
    return color(str, 33, noColor)
}
export function red(str: string, noColor?: boolean): string {
    return color(str, 31, noColor)
}
export function green(str: string, noColor?: boolean): string {
    return color(str, 32, noColor)
}
export function magenta(str: string, noColor?: boolean): string {
    return color(str, 35, noColor)
}
