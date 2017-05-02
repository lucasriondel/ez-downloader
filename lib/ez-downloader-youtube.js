// import chalk from 'chalk'
import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import debugModule from 'debug'

const debug = debugModule('youtube')

class EzYoutubeDownloader {
  constructor() {
  }

  download(track_url) {
    //TODO error handling
    let stream = ytdl(track_url, {filter: 'audioonly'})
    let trackTitle = null
    stream.on('info', info => {
      debug(info.title)
      trackTitle = info.title
      //TODO on windows (probably linux too), if ffmpeg binaries folder is not
      //in the PATH env variable, an error will be thrown here. Catch it and
      //display an appropriate error message, with the link for the ffmpeg lib.
      new ffmpeg({source:stream})
      .withAudioCodec('libmp3lame')
      .toFormat('mp3')
      .saveToFile(trackTitle+'.mp3', function(stdout, stderr) {
        //console.log('file has been converted succesfully')
        //^^^ TODO DOES NOT WORK ^^^
        //TODO tag setting
      });
    })
    stream.on('progress', (chunk, downloaded, total) => {
      debug('progress')
      debug(`${downloaded}/${total}/`)
      //TODO progress bar
    })
    stream.on('response', response => {
      debug('response')
    })
  }

  // handleErrors(err) {
  //
  // }
}

export default new EzYoutubeDownloader()
