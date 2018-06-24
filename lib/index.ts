import chalk from 'chalk';
import * as debugModule from 'debug';
import * as urlParse from 'url-parse';
import * as ProgressBar from 'progress';

import EzSoundcloudDownloader from '../lib/ez-downloader-soundcloud';
import yt_downloader from '../lib/ez-downloader-youtube';
import tagger from '../mdr/tagger';

const debug = debugModule('entry');

const ezSoundcloudDownloader = new EzSoundcloudDownloader();

async function downloadFromSoundcloud(url: string) {
  try {
    const result = await ezSoundcloudDownloader.download(url, displayProgress);
    debug(chalk.green('Song downloaded !'));
    tagger.askTagEdition(result.filename, result.coverUrl);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
}

async function downloadFromYoutube(url: string) {
  try {
    const result = await yt_downloader.download(url, displayProgress);
    debug(chalk.green('Song downloaded !'));
    tagger.askTagEdition(result.filename);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
  // TODO catch errors
}

function displayProgress(chunk: any, total: any) {
  if (bar === null)
    bar = new ProgressBar('downloading [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    });
  bar.tick(chunk);
}

const link = process.argv[2];
let bar: ProgressBar | null = null;

debug(`Track url : ${link}`);
const parsedUrl = urlParse(link, true);
if (parsedUrl.host === 'soundcloud.com' && parsedUrl.hostname === 'soundcloud.com') {
  downloadFromSoundcloud(link);
}
// TODO handle short youtube links
else if (parsedUrl.host === 'www.youtube.com' && parsedUrl.hostname === 'www.youtube.com') {
  downloadFromYoutube(link);
} else {
  debug(chalk.red('Wrong url, service not found.'));
}
