export const extractEntries = (textItems) => {
    textItems = textItems.slice(
        textItems.findIndex(t => t.str.indexOf('Opening balance') >= 0) + 4,
        textItems.findIndex(t => t.str.indexOf('Closing totals') >= 0) - 2
    )
    const finalItems = []
    for (let i = 0; i < textItems.length; i++) {
        if (/^[A-Z][a-z]{2} [0-9]{2}$/.test(textItems[i].str)) {
            const date = new Date(textItems[i].str + ' ' + new Date().getFullYear()) // TODO: BUG: GRAB ACTUAL YEAR FROM STATEMENT
            i += 2
            let description = ''
            while (textItems[i].str.trim().length > 0) {
                description += textItems[i].str
                i++
            }
            description = description.trim()
            i++
            const amount = parseFloat(textItems[i].str.split(',').join('')) * (textItems[i + 1].width > 100 ? -1 : 1)
            i++
            finalItems.push({ date, description, amount })
        }
    }
    return finalItems
}