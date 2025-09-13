function stringify(colorStyle: keyof typeof styles, func: (this: string) => string) {
    return Object.defineProperty(String.prototype, colorStyle, {
        get: func,
        configurable: true,
    })
}

declare global {
    interface String {
        black: string
        blue: string
        cyan: string
        gray: string
        green: string
        grey: string
        magenta: string
        red: string
        white: string
        yellow: string
        // bold: string
        dim: string
        italic: string
        underline: string
        strikethrough: string
        reset: string
    }
}

const close = '\u001b[39m'
const styles = {
    black: { open: '\u001b[30m', close },
    blue: { open: '\u001b[34m', close },
    cyan: { open: '\u001b[36m', close },
    gray: { open: '\u001b[90m', close },
    green: { open: '\u001b[32m', close },
    grey: { open: '\u001b[90m', close },
    magenta: { open: '\u001b[35m', close },
    red: { open: '\u001b[31m', close },
    white: { open: '\u001b[37m', close },
    yellow: { open: '\u001b[33m', close },
    bold: { open: '\u001b[1m', close: '\u001b[22m' },
    dim: { open: '\u001b[2m', close: '\u001b[22m' },
    italic: { open: '\u001b[3m', close: '\u001b[23m' },
    underline: { open: '\u001b[4m', close: '\u001b[24m' },
    strikethrough: { open: '\u001b[9m', close: '\u001b[29m' },
    reset: { open: '\u001b[0m', close: '\u001b[0m' },
}
for (const styleName of Object.keys(styles) as (keyof typeof styles)[]) {
    stringify(styleName, function (this: string) {
        return color(this, styleName).toString()
    })
}
function color(str: string, styleName: keyof typeof styles) {
    const code = styles[styleName]
    return code.open + str /*.replace(code.closeRe, code.open)*/ + code.close
}
