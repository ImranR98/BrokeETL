export const extractEntries = (textItems) => {
    if (textItems.findIndex(t => t.str == 'Summary of your account') >= 0) {
        return extractEntries2023(textItems)
    } else {
        return extractEntries2019(textItems)
    }
}

const extractEntries2019 = (textItems) => {
    const year = textItems[textItems.findIndex(t => t.str == 'Statement Date') + 2].str.slice(-4)
    textItems = textItems.slice(
        textItems.findIndex(t => t.str.indexOf('PERIOD COVERED BY THIS STATEMENT') >= 0) + 18,
        textItems.findIndex(t => t.str.startsWith('Your account currently has a credit balance.') || t.str == 'Estimated Time to Repay:') - 1
    )
    textItems = textItems.filter(t => t.str.trim().length > 0)
    const finalItems = []
    const isDate = (str) => /^[A-Z][a-z]+\. [0-9]{1,2}$/.test(str)
    for (let i = 0; i < textItems.length; i++) {
        if (isDate(textItems[i].str) && (i + 1) < textItems.length && isDate(textItems[i + 1].str)) {
            i++
            const date = new Date(`${textItems[i].str} ${year}`)
            i++
            const lineHeight = textItems[i].transform[5]
            const lastLineIndex = textItems.findLastIndex(t => t.transform[5] == lineHeight)
            const remainingItems = []
            while (i <= lastLineIndex) {
                remainingItems.push(textItems[i].str)
                i++
            }
            i--
            const amountStr = remainingItems.pop()
            const description = remainingItems.join(' ')
            const amount = parseFloat(amountStr) * (amountStr.endsWith('CR') ? 1 : -1)
            finalItems.push({ date, description, amount })
        }
    }
    return finalItems
}

const extractEntries2023 = (textItems) => {
    const year = textItems[textItems.findIndex(t => t.str == 'Statement date') + 2].str.slice(-4)
    textItems = textItems.slice(
        textItems.findIndex(t => t.str.indexOf('Transactions since your last statement') >= 0) + 20,
        textItems.findIndex(t => t.str.startsWith('Subtotal for '))
    )
    textItems = textItems.filter(t => t.str.trim().length > 0)
    const finalItems = []
    const isDate = (str) => /^[A-Z][a-z]+\. [0-9]{1,2}$/.test(str)
    for (let i = 0; i < textItems.length; i++) {
        if (isDate(textItems[i].str) && (i + 1) < textItems.length && isDate(textItems[i + 1].str)) {
            i++
            const date = new Date(`${textItems[i].str} ${year}`)
            i++
            const lineHeight = textItems[i].transform[5]
            const lastLineIndex = textItems.findLastIndex(t => t.transform[5] == lineHeight)
            const remainingItems = []
            while (i <= lastLineIndex) {
                remainingItems.push(textItems[i].str)
                i++
            }
            i--
            let amountStr = remainingItems.pop()
            if (amountStr == 'CR') {
                amountStr = `${remainingItems.pop()} CR`
            }
            const description = remainingItems.join(' ')
            const amount = parseFloat(amountStr) * (amountStr.endsWith('CR') ? 1 : -1)
            finalItems.push({ date, description, amount })
        }
    }
    return finalItems
}