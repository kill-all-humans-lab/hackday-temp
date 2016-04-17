# hackday-temp
temporary repo for a hackathon project

## info
* torbookbot is a bot to download books from the hidden net
* [@torbookbot](https://telegram.me/torbookbot) on Telegram

## notes
* `./src/middlewares` and `./src/kernel` are local (for the sake of simplicity and for testing purposes). Once ready they should be moved to a standalone packages and all imports should be changed accordingly.
* It requires `standard` and `snazzy` installed globally
* `npm run build` to watch source files for changes and transpile them
* `npm run lint` to check code conventions
* `npm start` to run the bot
