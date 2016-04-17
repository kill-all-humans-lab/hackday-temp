import TelegramAPI from 'node-telegram-bot-api'

// TODO: automate action creation
let actions = {
  sendText: {
    API: {
      text: true,
      keyboard: true
    },
    type: 'text',
    fn: function (obj) {
      // TODO: DEFINE AN INTERFACE FOR THE RESPONSE!!!
      return this.sendMessage(obj.target, obj.text, obj.keyboard)
    }
  },
  sendImage: {
    API: {
      photo: true,
      keyboard: true
    },
    type: 'photo',
    fn: function (obj) {
      // TODO: support not loaded images!
      let photo = obj.photo.path
      return this.sendPhoto(obj.target, photo, obj.keyboard)
    }
  },
  sendVoice: {
    API: {
      voice: true,
      keyboard: true
    },
    type: 'voice',
    fn: function (obj) {
      // TODO: support not loaded voice!
      let photo = obj.data.voice.original.data.file_id
      return this.sendVoice(obj.target, obj.data.voice, obj.data.keyboard)
    }
  },
  sendFile: {
    API: {
      file: true,
      keyboard: true
    },
    type: 'file',
    fn: function (obj) {
      // TODO: support not loaded files!
      let file = obj.file.path
      return this.sendDocument(obj.target, file, obj.keyboard)
    }
  },
}

export default class TelegramProvider {
  constructor (options) {
    this._token = options.credentials.token
    this._connection = options.connection
  }

  get actions() {
    return actions
  }

  set onMessage (fn) {
    this._callback = fn
  }

  listen () {
    let options = {}
    if (this._connection.type === 'long-polling') options.polling = true
    // TODO: get rid of API wrapper so that no need to have this prop
    let api = this._api = new TelegramAPI(this._token, options)

    api.on('message', (msg) => {
      let ctx = {}

      // TODO: automate context creation based on type
      if (msg.text) {
        ctx.type = 'text'
        ctx.data = { text: msg.text, date: msg.date }
      } else if (msg.photo) {
        ctx.type = 'photo'
        ctx.data = []
        for (let photo of msg.photo) {
          ctx.data.push({
            url: api.getFileLink(photo.file_id),
            original: { provider: 'telegram', data: photo }
          })
        }
      } else if (msg.document) {
        ctx.type = 'file'
        ctx.data = api.getFileLink(msg.document.file_id)
      } else if (msg.voice) {
        ctx.type = 'voice'
        ctx.data = api.getFileLink(msg.voice.file_id)
      }

      ctx.source = { provider: 'telegram', data: msg.chat.id }

      this._callback(ctx)
    })
  }
}
