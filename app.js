import fs from 'fs'
import * as pdfjs from 'pdfjs-dist'

const extractTextFromPDF = async (pdfPath) => {
    const pdf = await pdfjs.getDocument({ url: pdfPath, verbosity: 0 }).promise
    let textItems = []
    async function getTextFromPage(pageNum) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        textItems = [...textItems, ...textContent.items]
        if (pageNum < pdf.numPages) {
            await getTextFromPage(pageNum + 1)
        }
    }
    await getTextFromPage(1)

    return textItems
}

const availableBankModules = fs.readdirSync('./bank_modules').filter(f => f.endsWith('.js')).map(f => f.slice(0, -3))

const usage = (exitCode = 0) => {
    console.log(
        `Usage: ${process.argv[0].split('/').pop()} ${process.argv[1].split('/').pop()} [-h] BANK_MODULE FILE/DIR [FILE/DIR ...]

Description:
    Parse transactions from bank statement PDFs into a JSON array.

Options:
    -h                         Show this help message and exit.
  
Arguments:
    BANK_MODULE              The bank module to use.
                             Allowed values: ${availableBankModules.join(', ')}
    
    FILE/DIR                 The path to a PDF file or directory in which to search (recursively) for PDF files.
                             You can specify more than one.
                             Results from all files are merged into one array, sorted by date.`
    )
    if (exitCode !== null && exitCode !== undefined) {
        process.exit(exitCode)
    }
}

if (process.argv[2] == '-h') {
    usage()
}

const bankModuleToUse = process.argv[2]
if (!bankModuleToUse || availableBankModules.indexOf(`${bankModuleToUse}`) < 0) {
    console.error('No/Invalid bank module specified!\n')
    usage(1)
}
const bank = await import(`./bank_modules/${bankModuleToUse}.js`)

const pathArgs = process.argv.slice(3)
if (pathArgs.length == 0) {
    console.error('No files/dirs specified!\n')
    usage(1)
}

const getTargetFilesFromArg = (pathArg) => {
    const files = []
    if (!fs.existsSync(pathArg)) {
        console.error(`Invalid file/dir: ${pathArg}\n`)
        usage(1)
    }
    if (fs.statSync(pathArg).isFile()) {
        files.push(pathArg)
    } else {
        const procDir = (dirPath) => {
            const fileList = fs.readdirSync(dirPath);
            fileList.forEach(f => {
                const filePath = `${dirPath}/${f}`
                if (fs.statSync(filePath).isDirectory()) {
                    procDir(filePath)
                } else if (filePath.toLowerCase().endsWith('.pdf')) {
                    files.push(`${pathArg}/${f}`)
                }
            });
        }
        procDir(pathArg)
    }
    return files
}

const files = []
pathArgs.forEach(a => files.push.apply(files, getTargetFilesFromArg(a)))

const entries = []
for (let i = 0; i < files.length; i++) {
    entries.push.apply(entries, bank.extractEntries(await extractTextFromPDF(files[i])))
}
entries.sort((a, b) => a.date - b.date)

console.log(JSON.stringify(entries, null, '    '))
