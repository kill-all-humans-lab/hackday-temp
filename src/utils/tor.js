import cheerio from 'cheerio'
import tr from 'tor-request'

let siteUrl = 'http://sblib3fk2gryb46d.onion';

function parsePage (body) {
  let $ = cheerio.load(body)
  let resultHtml = $('div[class=masthead]').find('p').first().html()
  let amountBooksFound = parseInt(resultHtml.split(':')[1].split(' ')[1])
  let exportBooks = []

  if (amountBooksFound > 0) {
      let books = $('.row').first().find('ul').find('.span2')

      for (let i = 0; i < books.length; i++) {
        let book = books.eq(i)
        let a = book.find('a')
        let imageUrl = siteUrl + a.first().find('img').first().attr('src')

        let author = a.eq(1).attr('href').replace('/?q=', '')
        let secondName = author.split(', ')[0]
        let firstName = author.split(', ')[1]
        author = firstName + ' ' + secondName
        let title = a.first().find('img').attr('alt')
        let bookUrl = siteUrl + book.find('.btn-group').find('a').first().attr('href')
        let a1 = bookUrl.split("/book/")[0]
        let a2 = bookUrl.split("/book/")[1]
        let b1 = a2.split("/download/")[0]
        let b2 = a2.split("/download/")[1]
        bookUrl = a1 + '/book/' + encodeURIComponent(b1) + '/download/' + b2
        exportBooks.push({ title, author, imageUrl, bookUrl })
      }
  }

  return exportBooks
}

function download (url) {
  return new Promise((resolve, reject) => {
    tr.request(url, (err, res, body) => {
      //console.log(res)
      if (!err && res.statusCode === 200)
        resolve(body)
      else
        reject(err)
    })
  })
}


function downloadStream (url) {
  return tr.request(url, () => {})
}

function getBooks (query) {
  return download(siteUrl + '/?q=' + encodeURIComponent(query))
    .then((body) => parsePage(body))
}

export default { download, getBooks, downloadStream }
