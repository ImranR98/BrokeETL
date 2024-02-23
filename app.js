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
        `Usage: ${process.argv[0].split('/').pop()} ${process.argv[1].split('/').pop()} [-h] [-o OUTPUT_DIR] FILE/DIR [FILE/DIR ...]

Description:
    Parse transactions from supported bank statement PDFs into a JSON array.

Options:
    -h                         Show this help message and exit.
    -o                         Reorganize input files by moving them into a specified output directory
  
Arguments:    
    FILE/DIR                 The path to a PDF file or directory in which to search (recursively) for PDF files.
                             You can specify more than one.
                             Results from all files are merged into one array, sorted by date.`
    )
    if (exitCode !== null && exitCode !== undefined) {
        process.exit(exitCode)
    }
}

let argi = 2

if (process.argv[argi] == '-h') {
    usage()
}

const ORGANIZE_TARGET = process.argv[argi] == '-o' ? process.argv[argi + 1] : null

if (ORGANIZE_TARGET) {
    argi += 2
    if (fs.existsSync(ORGANIZE_TARGET) && !fs.statSync(ORGANIZE_TARGET).isDirectory()) {
        console.error('Invalid -o directory!')
        usage(1)
    }
}

const bankModules = {}

for (let i = 0; i < availableBankModules.length; i++) {
    bankModules[availableBankModules[i]] = await import(`./bank_modules/${availableBankModules[i]}.js`)
}


const pathArgs = process.argv.slice(argi)
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
                    files.push(filePath)
                }
            });
        }
        procDir(pathArg)
    }
    return files
}

const files = []
pathArgs.forEach(a => files.push.apply(files, getTargetFilesFromArg(a)))

const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const entries = []
for (let i = 0; i < files.length; i++) {
    try {
        const fileText = await extractTextFromPDF(files[i]);
        let fileValidatedInfo = null
        let j
        for (j = 0; j < availableBankModules.length; j++) {
            fileValidatedInfo = bankModules[availableBankModules[j]].validateFile(fileText)
            if (fileValidatedInfo) {
                break
            }
        }
        if (fileValidatedInfo) {
            entries.push.apply(entries, bankModules[availableBankModules[j]].extractEntries(fileText).map(e => {
                e.bank = fileValidatedInfo.bank
                e.account = fileValidatedInfo.account
                return e
            }))
            if (ORGANIZE_TARGET) {
                const targetDir = `${ORGANIZE_TARGET}/${fileValidatedInfo.bank.split(' ').join('-')}/${fileValidatedInfo.account.split(' ').join('-')}`
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true })
                }
                const fn = `${`${fileValidatedInfo.bank}_${fileValidatedInfo.account}`.split(' ').join('-')}_${formatDate(fileValidatedInfo.date)}.pdf`
                fs.cpSync(files[i], `${targetDir}/${fn}`)
                fs.unlinkSync(files[i])
            }
        } else {
            console.error(`Did not recognize PDF (skipped): ${files[i]}`)
        }
    } catch (e) {
        console.error(files[i])
        throw e
    }
}
entries.sort((a, b) => a.date - b.date)

console.log(JSON.stringify(entries, null, '    '))
