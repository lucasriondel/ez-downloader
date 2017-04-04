import chalk from 'chalk'
import program from 'commander'
import debugModule from 'debug'
import urlParse from 'url-parse'

import sc_downloader from './ez-downloader-soundcloud'

const debug = debugModule('entry')

program
  .version('0.0.1')
  .option('-s, --service [service_name]',
    'Set the service, either youtube or soundcloud')
  .option('-u, --url [url]',
    'Set the track url')
  .parse(process.argv)

if (program.service && program.url) {
  debug(`Service found : ${program.service == 'soundcloud' ?
    chalk.yellow.bold(program.service) :
    chalk.red.bold(program.service)
  }`)
  debug(`Track url : ${program.url}`)
  if (program.service == 'soundcloud')
    sc_downloader.download(program.url)
}
else if (program.url) {
  //TODO auto detect service based on url
  debug(`Track url : ${program.url}`)
  const parsedUrl = urlParse(program.url, true)
  debug(parsedUrl)
  if (parsedUrl.host == 'soundcloud.com' &&
    parsedUrl.hostname == 'soundcloud.com') {
    sc_downloader.download(program.url)
  }
}
else {
  console.error(chalk.red.bold("You have to set a track and a service name."));
  program.outputHelp()
}
