export default () => {
  return function * (next) {
    this.session.flood = this.session.flood || 0
    if (this.data.date > this.session.flood) {
      this.floodAction = ((name, action) => {
        return this.action(name, action)
          .then((msg) => {
            this.session.flood = msg.date
            return msg
          })
      })

      yield next
    }
  }
}
