export const extractEntries = (textItems) => {
    const year = textItems.filter(t => /For [A-Z][a-z]{2} [0-9]{1,2} to [A-Z][a-z]{2} [0-9]{1,2}, [0-9]{4}/.test(t.str))[0].str.slice(-4)
    textItems = textItems.slice(
        textItems.findIndex(t => t.str == 'Opening balance') + 4,
        textItems.findIndex(t => t.str == 'Closing balance')
    )
    const getAmtIfAmt = (str) => {
        let strA = str.split(',').join('')
        if (/^-?[0-9]+\.[0-9]{2}$/.test(strA)) {
            return parseFloat(strA)
        }
        return null
    }
    const dateFromText = (str) => {
        return new Date(`${str} ${year}`)
    }
    const items = [{ date: dateFromText(textItems[0].str), description: '' }]
    const dateOffset4 = textItems[0].transform[4]
    for (let i = 1; i < textItems.length; i++) {
        if (textItems[i].str == '(continued on next page)') {
            while (textItems[i].str != 'Balance forward') {
                i++
            }
            i += 3
        }
        let possibleAmt = getAmtIfAmt(textItems[i].str)
        if (
            possibleAmt !== null &&
            i + 2 < textItems.length &&
            textItems[i + 1].str.trim().length == 0 &&
            getAmtIfAmt(textItems[i + 2].str) !== null
        ) {
            items[items.length - 1].amount = possibleAmt * (textItems[i + 1].width > 100 ? -1 : 1)
            items[items.length - 1].description = items[items.length - 1].description.trim()
            items.push({ date: items[items.length - 1].date, description: '' })
            i += 2
        } else if (textItems[i].str.trim().length > 0) {
            if (/^[A-Z][a-z]{2} [0-9]{1,2}$/.test(textItems[i].str) && dateOffset4 <= textItems[i].transform[4] + 20) {
                items[items.length - 1].date = dateFromText(textItems[i].str)
            } else {
                items[items.length - 1].description = `${items[items.length - 1].description} ${textItems[i].str}`
            }
        }
    }
    items.pop()
    return items
}