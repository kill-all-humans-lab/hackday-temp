// XXX: it DOES NOT support objects as data for session info!

export default class SessionMap {
  constructor () {
    this.sessions = []
  }

  has (obj) {
    for (let session of this.sessions) {
      if (obj.provider === session.provider && obj.data === session.data) {
        return true
      }
    }

    return false
  }

  get (obj) {
    for (let session of this.sessions) {
      if (obj.provider === session.provider && obj.data === session.data) {
        return session.content
      }
    }
  }

  set (obj, data) {
    this.sessions.push({
      provider: obj.provider,
      data: obj.data,
      content: data
    })
  }
}
