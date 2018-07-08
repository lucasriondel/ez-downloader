import { Config, getConfig, changeOutputDir } from './Config';
import chalk from 'chalk';
import * as debugModule from 'debug';
import * as urlParse from 'url-parse';
import * as ProgressBar from 'progress';
import * as program from 'commander';

import EzDownloaderSoundcloud from './EzDownloaderSoundcloud';
import EzDownloaderYoutube from './EzDownloaderYoutube';
import Tagger, { UserFriendlyTags } from './Tagger';
import Asker from './Asker';

const version = '0.1.2';
const debug = debugModule('entry');

const ezDownloaderSoundcloud = new EzDownloaderSoundcloud();
const ezDownloaderYoutube = new EzDownloaderYoutube();
const tagger = new Tagger();

let bar: ProgressBar | null = null;

const displayProgress = (chunk: number, total: number) => {
  if (bar === null)
    bar = new ProgressBar('downloading [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    });
  bar.tick(chunk);
};

const urlToDownloader = (url: string): EzDownloaderSoundcloud | EzDownloaderYoutube | null => {
  debug(`TRACK_URL ${url}`);
  const parsedUrl = urlParse(url, true);

  if (parsedUrl.host === 'soundcloud.com' && parsedUrl.hostname === 'soundcloud.com')
    return ezDownloaderSoundcloud;
  else if (parsedUrl.host === 'www.youtube.com' && parsedUrl.hostname === 'www.youtube.com')
    // TODO handle short youtube urls
    return ezDownloaderYoutube;
  else return null;
};

const processUrl = async (url: string, config: Config, asker?: Asker) => {
  const downloader = await urlToDownloader(url);
  if (!downloader) throw new Error('Invalid url');

  downloader.setOutputDir(config.outputDir);
  const track = await downloader.download(url, displayProgress);
  bar = null;

  if (asker && (await asker.askForTagEdition())) {
    const tags: UserFriendlyTags = {
      title: '',
      artist: '',
      album: '',
    };

    tags.title = await asker.askForTag('Song title');
    tags.artist = await asker.askForTag('Song artist');
    tags.album = await asker.askForTag('Song album');
    if (track.coverUrl) tags.coverURL = await asker.askForTag('Cover URL', track.coverUrl);

    await tagger.editTags(`${config.outputDir}/${track.filename}`, tags);
  }
};

async function main() {
  program
    .name('ez')
    .arguments('<url ...>')
    .version(version)
    .option('-n, --notags', 'Do not ask for tags')
    .option(
      '-o, --outputDir <dir>',
      'Use this directory for output file (save it for future downloads)',
    )
    .parse(process.argv);

  const { notags, args } = program;
  debug('URL', args);
  debug('TAG EDITION', !notags);

  const { outputDir } = program;
  if (outputDir) await changeOutputDir(outputDir);
  const config = getConfig();

  console.log(chalk.green(`ez cli v${version}`));
  const asker = new Asker();
  if (args.length > 0) {
    for (const url of args) await processUrl(url, config, notags ? undefined : asker);
  } else {
    while (true) {
      try {
        // TODO use clipboardy (https://github.com/sindresorhus/clipboardy) to read URL from clipboard and add it as choice for Asker
        const url = await asker.askForURL();
        await processUrl(url, config, notags ? undefined : asker);
      } catch (e) {
        console.log(chalk.red(e));
      }
    }
  }
}

main();
