// Read JSON files generated by BrokeETL, filter for certain transactions (by description), and format them in a specific way before printing to screen

import fs from 'fs'

const filesToRead = process.argv.slice(2)

const filters = [
    { string: 'Interest Paid', category: 'Necessity' },
    { string: 'Interest', category: 'Other Money In' },
    { string: 'Service Charge', category: 'Necessity' },
    { string: 'Banking Fee', category: 'Necessity' },
    { string: 'Plan Fee', category: 'Necessity' },
    { string: 'Overdraft', category: 'Other Extra Expense' }
]

let items = []

for (let i = 0; i < filesToRead.length; i++) {
    items.push.apply(items, JSON.parse(fs.readFileSync(filesToRead[i]).toString()))
}

items = items.map(e => {
    e.date = new Date(e.date)
    for (let i = 0; i < filters.length; i++) {
        if (e.description.toLowerCase().indexOf(filters[i].string.toLowerCase()) >= 0) {
            e.category = filters[i].category
            break
        }
    }
    return e
}).filter(e => !!e.category)

const finalItems = []

for (let i = 0; i < items.length; i++) {
    if (i < items.length - 1 && items[i + 1].amount == (items[i].amount * -1)) {
        i++
    } else {
        finalItems.push(items[i])
    }
}

finalItems.sort((a, b) => a.date - b.date)

const twoDigitInt = (int) => {
    let str = int.toString()
    return str.length == 1 ? '0' + str : str
}

finalItems.forEach(item => {
    console.log(`${item.date.getFullYear()}-${twoDigitInt(item.date.getMonth()+1)}-${twoDigitInt(item.date.getDate())}\t${item.description}\t${item.amount < 0 ? `\t${item.amount * -1}` : `${item.amount}\t`}\t${item.category}`)
})