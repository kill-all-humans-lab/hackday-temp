import SessionMap from '../utils/session-map'

export default () => {
  let queueLocks = new SessionMap()

  return function * (next) {
    let promiseResolve
    let mutex = queueLocks.has(this.source) ?
      queueLocks.get(this.source) : Promise.resolve()
    queueLocks.set(this.source, new Promise((resolve, reject) => {
      promiseResolve = resolve
    }))
    yield mutex
    yield next
    promiseResolve()
  }
}
