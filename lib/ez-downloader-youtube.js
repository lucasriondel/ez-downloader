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
    })
    stream.on('progress', progress => {
      debug('progress')
      //TODO progress bar
    })
    new ffmpeg({source:stream})
    .withAudioCodec('libmp3lame')
    .toFormat('mp3')
    .saveToFile(trackTitle+'.mp3', function(stdout, stderr) {
        console.log('file has been converted succesfully');
        //TODO tag setting
    });
    stream.on('response', response => {
      debug('response')
    })
  }

  // handleErrors(err) {
  //
  // }
}

export default new EzYoutubeDownloader()
