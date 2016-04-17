// TODO: swap in-memory DB to persistent

import SessionMap from '../utils/session-map'

export default () => {
  let sessions = new SessionMap()

  return function * (next) {
    this.session = sessions.has(this.source) ?
      sessions.get(this.source) : {}
    yield next
    sessions.set(this.source, this.session)
  }
}
