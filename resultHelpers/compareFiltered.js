// Given 2 files in the format output by filter.js, return all lines in the first file that are not similar to lines in the second (by date and amount)

import fs from 'fs'

const parseLine = (line) => {
    const parts = line.split('\t')
    return {
        date: parts[0].split(',').pop().trim(),
        description: parts[1],
        amount: parts[2].trim().length > 0 ?
            parseFloat(parts[2].split(',').join('').split('$').join('')) :
            parseFloat(parts[3].split(',').join('').split('$').join('')) * -1
    }
}

const mainLines = fs.readFileSync(process.argv[2]).toString().split('\n').filter(l => l.trim().length > 0)
const comparisonLinesParsed = fs.readFileSync(process.argv[3]).toString().split('\n').filter(l => l.trim().length > 0 && !l.startsWith('Date')).map(l => parseLine(l))

// console.log(comparisonLinesParsed)

const finalLines = mainLines.filter(ml => {
    const pml = parseLine(ml)
    for (let i = 0; i < comparisonLinesParsed.length; i++) {
        if (pml.date == comparisonLinesParsed[i].date && pml.amount == comparisonLinesParsed[i].amount) {
            return false
        }
    }
    return true
})

console.log(finalLines.join('\n'))