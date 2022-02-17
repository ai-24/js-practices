const readlinePromise = require('readline/promises')
const fsPromises = require('fs/promises')
const fs = require('fs')
const crypto = require('crypto')
const argv = require('minimist')(process.argv.slice(2))
const Select = require('enquirer')

class Memo {
  constructor (content) {
    this.content = content
  }

  static create () {
    const details = []
    const rl = readlinePromise.createInterface({
      input: process.stdin
    })
    rl.on('line', (input) => {
      const sentence = `${input}\n`
      details.push(sentence)
    })
    rl.on('close', () => {
      try {
        const memo = new Memo(details)
        const fileName = crypto.randomBytes(256).toString('base64').substring(0, 13)
        fsPromises.writeFile('memos/' + fileName + '.txt', memo.content)
      } catch (err) {
        console.log(err)
      }
    })
  }

  static list () {
    for (const file of FileInfo.files()) {
      readlinePromise.createInterface({
        input: fs.createReadStream('memos/' + file)
      }).once('line', (input) => {
        console.log(input)
      })
    }
  }

  static referOrDelete (msg) {
    const firstLine = []
    for (const [index, content] of FileInfo.info().entries()) {
      content.once('line', (input) => {
        firstLine.push(input)
        firstLine.push(content.input.path)
      })
      content.once('close', () => {
        const options = firstLine.filter(function (e, i) {
          return i % 2 === 0
        })
        if (index === 0) {
          const enquirer = new Select({
            type: 'select',
            name: 'memo',
            message: msg,
            choices: options
          })
          if (argv.r) {
            enquirer.prompt(enquirer)
              .then(
                answer =>
                  readlinePromise.createInterface({
                    input: fs.createReadStream(firstLine[firstLine.findIndex(e => e === answer.memo) + 1])
                  }).on('line', (input) => {
                    console.log(input)
                  })).catch(console.error)
          } else if (argv.d) {
            enquirer.prompt(enquirer)
              .then(
                answer =>
                  fs.unlinkSync(firstLine[firstLine.findIndex(e => e === answer.memo) + 1])
              ).catch(console.error)
          }
        }
      }
      )
    }
  }
}

class FileInfo {
  static files () {
    return fs.readdirSync('memos')
  }

  static info () {
    const contents = []
    for (const file of FileInfo.files()) {
      const path = fs.createReadStream('memos/' + file)
      const rl = readlinePromise.createInterface({
        input: path
      })
      contents.push(rl)
    }
    return contents
  }
}

if (argv.l) {
  Memo.list()
} else if (argv.r) {
  Memo.referOrDelete('Choose a note you want to see:')
} else if (argv.d) {
  Memo.referOrDelete('Choose a note you want to delete:')
} else {
  Memo.create()
}
