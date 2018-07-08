import { Config, setConfig, getConfig } from './Config';
import chalk from 'chalk';
import * as debugModule from 'debug';
import * as urlParse from 'url-parse';
import * as ProgressBar from 'progress';
import * as program from 'commander';
import * as fs from 'fs';

import EzDownloaderSoundcloud from './EzDownloaderSoundcloud';
import EzDownloaderYoutube from './EzDownloaderYoutube';
import Tagger, { UserFriendlyTags } from './Tagger';
import { initDir, Track } from './misc';

import readline from 'readline-promise';
import Asker from './Asker';

const debug = debugModule('entry');
const version = process.env.npm_package_version as string;

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

const processUrl = async (url: string, config: Config): Promise<Track> => {
  debug(`TRACK_URL ${url}`);
  const parsedUrl = urlParse(url, true);
  if (parsedUrl.host === 'soundcloud.com' && parsedUrl.hostname === 'soundcloud.com') {
    ezDownloaderSoundcloud.setOutputDir(config.outputDir);
    return await ezDownloaderSoundcloud.download(url, displayProgress);
  }
  // TODO handle short youtube urls
  else if (parsedUrl.host === 'www.youtube.com' && parsedUrl.hostname === 'www.youtube.com') {
    ezDownloaderYoutube.setOutputDir(config.outputDir);
    return await ezDownloaderYoutube.download(url, displayProgress);
  } else {
    throw new Error('Wrong url, service not found.');
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
  if (outputDir) {
    if (!fs.existsSync(outputDir)) {
      console.log(chalk.red.bold(`specified outputDir ${outputDir} doesn't exist. creating it...`));
      try {
        await initDir(outputDir);
      } catch (e) {
        console.error(e);
        process.exit();
      }
    }
    setConfig({
      ...getConfig(),
      outputDir,
    });
  }
  const config = getConfig();

  if (args.length > 0) {
    for (const url of args) await processUrl(url, config);
  } else {
    console.log(chalk.green(`ez cli v${version}`));

    const rlp = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const asker = new Asker(rlp);

    let isProcessing = false;
    while (true) {
      if (isProcessing) continue;
      isProcessing = true;
      try {
        // TODO use clipboardy (https://github.com/sindresorhus/clipboardy) to read URL from clipboard and add it as choice for Asker
        const answer = await asker.askForURL();
        const track = await processUrl(answer, config);
        if (await asker.askForTagEdition()) {
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
      } catch (e) {
        console.log(chalk.red(e));
      }
      isProcessing = false;
    }
  }
}

main();
