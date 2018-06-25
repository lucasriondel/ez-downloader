import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'fluent-ffmpeg';
import * as debugModule from 'debug';
import * as sanitizeFilename from 'sanitize-filename';
import { Track, OnProgressFunction } from './misc';
import { IncomingMessage } from 'http';

const debug = debugModule('youtube');

export default class EzYoutubeDownloader {
  public download(trackUrl: string, onProgress: OnProgressFunction): Promise<Track> {
    return new Promise((resolve, reject) => {
      // TODO error handling
      const stream = ytdl(trackUrl, { filter: 'audioonly' });

      stream.on('info', (info: ytdl.videoInfo) => {
        debug('info');
        debug(info.title);
        const { title } = info;
        // TODO on windows (probably linux too), if ffmpeg binaries folder is not
        // in the PATH env variable, an error will be thrown here. Catch it and
        // display an appropriate error message, with the link for the ffmpeg lib.
        try {
          ffmpeg({ source: stream })
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .on('end', () =>
              resolve({
                filename: `${sanitizeFilename(title)}.mp3`,
              }),
            )
            .save(`${sanitizeFilename(title)}.mp3`);
        } catch (e) {
          this.handleErrors(e);
          reject(e);
        }
      });

      stream.on('progress', (chunk: number, downloaded: number, total: number) => {
        onProgress(chunk, total);
      });

      stream.on('response', (response: IncomingMessage) => {
        debug('response');
      });
    });
  }

  private handleErrors(err: any) {
    debug(err);
    debug(err.name);
    debug(err.message);
    debug(JSON.stringify(err));
  }
}
