// import chalk from 'chalk'
import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import debugModule from 'debug'
import sanitizeFilename from 'sanitize-filename'

const debug = debugModule('youtube');

class EzYoutubeDownloader {
    constructor() {
    }

    download(track_url, onProgress) {
        return new Promise((resolve, reject) => {
            //TODO error handling
            let stream = ytdl(track_url, {filter: 'audioonly'}), trackTitle = null;
            stream.on('info', info => {
                debug(info.title);
                trackTitle = info.title;
                //TODO on windows (probably linux too), if ffmpeg binaries folder is not
                //in the PATH env variable, an error will be thrown here. Catch it and
                //display an appropriate error message, with the link for the ffmpeg lib.
                try {
                    new ffmpeg({source: stream})
                        .withAudioCodec('libmp3lame')
                        .toFormat('mp3')
                        .on('end', () => {
                            return resolve({
                                filename: `${sanitizeFilename(trackTitle)}.mp3`,
                            })
                        })
                        .save(`${sanitizeFilename(trackTitle)}.mp3`);
                }
                catch (e) {
                    reject(e)
                }
            });
            stream.on('progress', (chunk, downloaded, total) => {
                debug('progress');
                onProgress(chunk, total);
            });
            stream.on('response', response => {
                debug('response');
            })
        })
    }

    handleErrors(err) {
        // debug(err);
        // debug(err.name);
        // debug(err.message);
        // debug(JSON.stringify(err));
    }
}

export default new EzYoutubeDownloader()
