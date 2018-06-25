import chalk from 'chalk';
import * as debugModule from 'debug';
import * as urlParse from 'url-parse';
import * as ProgressBar from 'progress';
import * as inquirer from 'inquirer';
import * as program from 'commander';
import * as readline from 'readline';

import EzDownloaderSoundcloud from './EzDownloaderSoundcloud';
import EzDownloaderYoutube from './EzDownloaderYoutube';
import Tagger, { UserFriendlyTags } from './Tagger';

const debug = debugModule('entry');
const version = process.env.npm_package_version as string;

const ezDownloaderSoundcloud = new EzDownloaderSoundcloud();
const ezDownloaderYoutube = new EzDownloaderYoutube();
const tagger = new Tagger();

let bar: ProgressBar | null = null;

interface AskEditTag {
  editTags: 'No' | 'Yes';
}

const askTagEdition = async (filename: string, coverUrl?: string) => {
  const question: inquirer.Question<AskEditTag> = {
    type: 'list',
    name: 'editTags',
    message: 'Do you want to edit tags ?',
    choices: ['No', 'Yes'],
  };
  const answer = await inquirer.prompt<AskEditTag>(question);

  if (answer.editTags === 'No') return;

  console.log(`Tag edition for ${filename}`);
  const questions: inquirer.Questions<UserFriendlyTags> = [
    {
      type: 'input',
      name: 'title',
      message: 'Song title',
    },
    {
      type: 'input',
      name: 'artist',
      message: 'Song artist',
    },
    {
      type: 'input',
      name: 'album',
      message: 'Album title',
    },
    {
      type: 'input',
      name: 'coverURL',
      message: 'Cover image url',
      default: coverUrl || undefined,
    },
  ];

  const answers = await inquirer.prompt<UserFriendlyTags>(questions);
  await tagger.editTags(filename, answers);
};

const downloadFromSoundcloud = async (url: string, withTags: boolean) => {
  try {
    const result = await ezDownloaderSoundcloud.download(url, displayProgress);
    console.log(chalk.green('Song downloaded !'));
    if (withTags) askTagEdition(result.filename, result.coverUrl);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
};

const downloadFromYoutube = async (url: string, withTags: boolean) => {
  try {
    const result = await ezDownloaderYoutube.download(url, displayProgress);
    debug(chalk.green('Song downloaded !'));
    if (withTags) askTagEdition(result.filename);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
  // TODO catch errors
};

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

const processUrl = async (url: string) => {
  debug(`TRACK_URL ${url}`);
  const parsedUrl = urlParse(url, true);
  if (parsedUrl.host === 'soundcloud.com' && parsedUrl.hostname === 'soundcloud.com') {
    await downloadFromSoundcloud(url, !program.notags);
  }
  // TODO handle short youtube urls
  else if (parsedUrl.host === 'www.youtube.com' && parsedUrl.hostname === 'www.youtube.com') {
    await downloadFromYoutube(url, !program.notags);
  } else {
    console.error(chalk.red.bold('Wrong url, service not found.'));
  }
};

async function main() {
  program
    .name('ez')
    .arguments('<url ...>')
    .version(version)
    .option('-n, --notags', 'Do not ask for tags')
    .parse(process.argv);

  const { notags, args } = program;
  debug('URL', args);
  debug('TAG EDITION', !notags);

  if (args.length > 0) {
    for (const url of args) await processUrl(url);
  } else {
    console.log(chalk.green(`ez cli v${version}\nplease type url`));
    const rlInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rlInterface.on('line', async (line: string) => await processUrl(line.trim()));
  }
}

main();
