import chalk from 'chalk'
import program from 'commander'
import debugModule from 'debug'
import urlParse from 'url-parse'

import sc_downloader from './ez-downloader-soundcloud'
import yt_downloader from './ez-downloader-youtube'

const debug = debugModule('entry')

program
  .version('0.0.1')
  .option('-s, --service [service_name]',
    'Set the service, either youtube or soundcloud')
  .option('-u, --url [url]',
    'Set the track url')
  .parse(process.argv)

//TODO handle short youtube links

function downloadFromSoundcloud(url) {
  sc_downloader.download(url)
  .then(result => {
    console.log(chalk.green("Song downloaded !"))
  })
  //TODO catch errors
}

function downloadFromYoutube(url) {
  yt_downloader.download(url)
}

if (program.service && program.url) {
  debug(`Service found : ${program.service == 'soundcloud' ?
    chalk.yellow.bold(program.service) :
    chalk.red.bold(program.service)
  }`)
  debug(`Track url : ${program.url}`)
  if (program.service == 'soundcloud')
    downloadFromSoundcloud(program.url)
  else if (program.service == 'youtube')
    downloadFromYoutube(program.url)
  else
    console.error(chalk.red.bold('Unknown service.'))
}
else if (program.url) {
  debug(`Track url : ${program.url}`)
  const parsedUrl = urlParse(program.url, true)
  debug(parsedUrl)
  if (parsedUrl.host == 'soundcloud.com' &&
    parsedUrl.hostname == 'soundcloud.com') {
      downloadFromSoundcloud(program.url)
  }
  else if (parsedUrl.host == 'youtube.com' &&
    parsedUrl.hostname == 'youtube.com') {
      downloadFromYoutube(program.url)
  }
}
else {
  console.error(chalk.red.bold('You have to set a track and a service name.'))
  program.outputHelp()
}
