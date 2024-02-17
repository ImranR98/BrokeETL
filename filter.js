import fs from 'fs'

const filesToRead = process.argv.slice(2)

const filters = [
    'Interest',
    'Service Charge',
    'Banking Fee',
    'SMART STUDENT OFFER',
    'Overdraft'
]

let items = []

for (let i = 0; i < filesToRead.length; i++) {
    items.push.apply(items, JSON.parse(fs.readFileSync(filesToRead[i]).toString()))
}

items = items.filter(e => {
    for (let i = 0; i < filters.length; i++) {
        if (e.description.toLowerCase().indexOf(filters[i].toLowerCase()) >= 0) {
            return true
        }
    }
    return false
})

const finalItems = []

for (let i = 0; i < items.length; i++) {
    if (i < items.length - 1 && items[i + 1].amount == (items[i].amount * -1)) {
        i++
    } else {
        finalItems.push(items[i])
    }
}

console.log(JSON.stringify(finalItems, null, '    '))