// Source maps for the sane backtrace
import 'source-map-support/register'

// Imports
import Kernel from './kernel'
import buffer from './middleware/buffer'
import flood from './middleware/flood'
import session from './middleware/session'
import FST from './middleware/fst'
import TelegramProvider from './providers/telegram'
import fs from 'fs'

// Credentials
import config from './config'

// Utils
import tor from './utils/tor'

// FST states
import { INIT, STARTED, CHOOSE } from './states'

// Filters
import cmd from './filters/cmd'
import text from './filters/text'

// External resources
import emoji from './vendor/emoji'

// Main declarations
let bot = new Kernel({
  providers: [
    new TelegramProvider({
      credentials: { token: config.telegram },
      connection: { type: 'long-polling' }
    })
  ]
})

// Stores data between requests
bot.use(session())

// Holding the flow for each user
bot.use(flood())

// Holding the flow for each user
bot.use(buffer())

// Common stuff
let noMarkup = { reply_markup: { hide_keyboard: true } }

// Main logic for Finite State Transducer

let STATE = Symbol('fst-state')

bot.use(function * (next) {
  this[STATE] = this.session.state || INIT
  yield next
  this.session.state = this[STATE]
})

let fst = new FST()

fst.transition(cmd('help'), helpMessage)
fst.transition(INIT, cmd('start'), STARTED, welcomeMessage)
fst.transition(STARTED, text(''), search)
fst.transition(CHOOSE, text('Search again'), STARTED, welcomeMessage)
fst.transition(CHOOSE, STARTED, downloadBook)

bot.use(fst.transitions(STATE))

bot.listen()

function * downloadBook (next) {
  let book = this.session.books[this.data.text - 1]
  if (!book) {
    yield this.floodAction('sendText', { type: 'text',
      data: { text: `Please, choose different number. ${emoji['pray']}` } })
    yield next
  }
  yield this.floodAction('sendText', { type: 'text',
    data: { text: `${book.title}, ${book.author}`, keyboard: noMarkup } })
  let hash = Math.random().toString(36).substring(7)
  let download = (url, name) => {
    return new Promise((resolve, reject) =>
      tor.downloadStream(url)
        .pipe(fs.createWriteStream(name))
        .on('close', (err) => {
          if (err) reject(err)
          resolve(`${__dirname}/../${name}`)
        })
    )
  }
  if (!book.imageUrl.endsWith('nocover.png')) {
    let name = yield download(book.imageUrl, `${hash}.jpg`)
    yield this.floodAction('sendImage', { type: 'photo',
      data: { photo: { path: name }, keyboard: noMarkup } })
    fs.unlink(name)
  }
  let name = yield download(book.bookUrl, `${hash}.fb2`)
  yield this.floodAction('sendFile', { type: 'file',
    data: { file: { path: name }, keyboard: noMarkup } })
  fs.unlink(name)
  yield this.floodAction('sendText', { type: 'text',
    data: { text: `Want something else? ${emoji['wink']}`,
      keyboard: noMarkup } })
  yield next
}

function * search (next) {
  let text, keyboard
  let books = this.session.books = yield tor.getBooks(this.data.text)
  if (books.length > 0) {
    text = ''
    keyboard = { reply_markup: { keyboard: [['1', '2', '3'],
      ['4', '5', '6'], ['7', '8', '9'], ['Search again']] } }
    for (let i = 0; i < books.length && i < 9; i++) {
      text += `${i + 1}. ${books[i].title}, ${books[i].author}\n`
    }
    this[STATE] = CHOOSE
  } else {
    text = `Sorry, no books for this request. ${emoji['sob']}`
    keyboard = noMarkup
  }
  yield this.floodAction('sendText', { type: 'text',
    data: { text, keyboard } })
  yield next
}

function * welcomeMessage (next) {
  let text = `Hi! Which book do you want? ${emoji['wink']}`
  yield this.floodAction('sendText', { type: 'text',
    data: { text, keyboard: noMarkup } })
  yield next
}

function * helpMessage (next) {
  let text = 'You can control me by sending these commands:\n\n' +
    '/help - to show this message\n' +
    '/end - to stop talking with me :('
  yield this.floodAction('sendText', { type: 'text',
    data: { text, keyboard: noMarkup } })
  yield next
}
