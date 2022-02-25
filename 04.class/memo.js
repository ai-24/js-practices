const readlinePromise = require('readline/promises')
const fsPromises = require('fs/promises')
const fs = require('fs')
const crypto = require('crypto')
const argv = require('minimist')(process.argv.slice(2))
const Select = require('enquirer')

class FileInfo {
  static files () {
    return fs.readdirSync('memos')
  }
}

class MemoApp {
  create () {
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
        Memo.save(details)
      } catch (err) {
        console.log(err)
      }
    })
  }

  list () {
    const memos = Memo.findAll()
    for (const memo of memos) { console.log(memo.title) }
  }

  options (msg) {
    const memos = Memo.findAll()
    const options = []
    for (const memo of memos) { options.push(memo.title) }
    const enquirer = new Select({
      type: 'select',
      name: 'memo',
      message: msg,
      choices: options
    })
    return enquirer
  }

  refer (msg) {
    const memos = Memo.find()
    const memoApp = new MemoApp()
    const options = memoApp.options(msg)
    options.prompt(options)
      .then(
        answer =>
          readlinePromise.createInterface({
            input: fs.createReadStream(memos[memos.indexOf(answer.memo) + 1])
          }).on('line', (input) => {
            console.log(input)
          })).catch(console.error)
  }

  destroy (msg) {
    const memos = Memo.find()
    const memoApp = new MemoApp()
    const options = memoApp.options(msg)
    options.prompt(options)
      .then(
        answer =>
          fs.unlinkSync(memos[memos.indexOf(answer.memo) + 1])
      ).catch(console.error)
  }
}

class Memo {
  constructor (contents) {
    const contentsArry = []
    if (Array.isArray(contents)) {
      contentsArry.push(contents)
    } else {
      const detail = contents.split('\n')
      contentsArry.push(detail)
    }
    this.title = contentsArry[0][0]
    contentsArry[0].shift()
    this.content = contentsArry[0]
  }

  static save (memo) {
    const content = new Memo(memo)
    const fileName = crypto.randomBytes(256).toString('base64').substring(0, 13)
    const detail = []
    detail.push(content.title)
    detail.push(content.content)
    fsPromises.writeFile('memos/' + fileName + '.txt', detail.flat())
  }

  static findAll () {
    const memos = []
    for (const file of FileInfo.files()) {
      const content = fs.readFileSync('memos/' + file, 'utf8')
      const memo = new Memo(content)
      memos.push(memo)
    }
    return memos
  }

  static find () {
    const filesInfo = []
    for (const file of FileInfo.files()) {
      const path = 'memos/' + file
      const content = fs.readFileSync(path, 'utf8')
      const memo = new Memo(content)
      filesInfo.push(memo.title)
      filesInfo.push(path)
    }
    return filesInfo
  }
}

const memoApp = new MemoApp()
if (argv.l) {
  memoApp.list()
} else if (argv.r) {
  memoApp.refer('Choose a note you want to see:')
} else if (argv.d) {
  memoApp.destroy('Choose a note you want to delete:')
} else {
  memoApp.create()
}
