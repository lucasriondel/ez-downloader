import chalk from 'chalk'
import debugModule from 'debug'
import urlParse from 'url-parse'

import sc_downloader from './ez-downloader-soundcloud'
import yt_downloader from './ez-downloader-youtube'
import tagger from './tagger'

const debug = debugModule('entry')

function downloadFromSoundcloud(url) {
  sc_downloader.download(url)
  .then(result => {
    console.log(chalk.green("Song downloaded !"))
    tagger.askTagEdition(result.filename, result.coverUrl)
  })
  //TODO catch errors more nicely
  .catch(err => {
    console.error(err)
  })
}

function downloadFromYoutube(url) {
  yt_downloader.download(url)
  .then(result => {
    console.log(chalk.green("Song downloaded !"))
    tagger.askTagEdition(result.filename)
  })
  //TODO catch errors
}

const link = process.argv[2]

debug(`Track url : ${link}`)
const parsedUrl = urlParse(link, true)
debug(parsedUrl)
if (parsedUrl.host == 'soundcloud.com' &&
  parsedUrl.hostname == 'soundcloud.com') {
    downloadFromSoundcloud(link)
}
//TODO handle short youtube links
else if (parsedUrl.host == 'www.youtube.com' &&
  parsedUrl.hostname == 'www.youtube.com') {
    downloadFromYoutube(link)
}
else {
  console.log(chalk.red("Wrong url, service not found."))
}
