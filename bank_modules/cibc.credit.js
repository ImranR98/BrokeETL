export const extractEntries = (textItems) => {
    textItems = textItems.filter(t => t.str.trim().length > 0)
    let year = textItems[textItems.findIndex(t => t.str.indexOf('statement period') > 0) + 4].str.slice(-4)
    if (!/^[0-9]{4}$/.test(year)) {
        year = textItems[textItems.findIndex(t => t.str.indexOf('statement period') > 0) + 2].str.slice(-4)
    }
    textItems = textItems.slice(
        textItems.findIndex(t => t.str.startsWith('Card number ')) + 1,
        textItems.findIndex(t => t.str.startsWith('Total for'))
    )
    const finalItems = []
    const isDate = (str) => /^[A-Z][a-z]{2} [0-9]{1,2}$/.test(str)
    for (let i = 0; i < textItems.length; i++) {
        if (isDate(textItems[i].str) && (i + 1) < textItems.length && isDate(textItems[i + 1].str)) {
            i++
            const date = new Date(`${textItems[i].str} ${year}`)
            const lineCoords = textItems[i].transform
            i++
            const lastLineIndex = textItems.findIndex((t, k) => {
                if (k <= i) {
                    return false
                }
                for (let j = 0; j < 4; j++) {
                    if (t.transform[j] != lineCoords[j]) {
                        return false
                    }
                }
                return /[0-9]+\.[0-9]{2}/.test(t.str.split(',').join('')) && (
                    k == textItems.length - 1 ||
                    isDate(textItems[k + 1].str) ||
                    (k + 3 < textItems.length && /^\*[0-9]+\*$/.test(textItems[k + 1].str) && /^\*[0-9]+\*$/.test(textItems[k + 2].str) && textItems[k + 3].str == 'Page') ||
                    (k + 1 < textItems.length && textItems[k + 1].str.startsWith('If you find an error'))
                )
            })
            const remainingItems = []
            while (i <= lastLineIndex) {
                remainingItems.push(textItems[i].str)
                i++
            }
            i--
            const amount = parseFloat(remainingItems.pop())
            const description = remainingItems.join(' ')
            finalItems.push({ date, description, amount })
        }
    }
    return finalItems
}