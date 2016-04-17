export default (str) => {
  return function (ctx) {
    return ctx.type === 'text' && ctx.data.text.includes(str)
  }
}
