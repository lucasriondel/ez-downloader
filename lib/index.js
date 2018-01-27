import chalk from 'chalk';
import debugModule from 'debug';
import urlParse from 'url-parse';
import ProgressBar from 'progress';

import sc_downloader from './ez-downloader-soundcloud';
import yt_downloader from './ez-downloader-youtube';
import tagger from './tagger';

const debug = debugModule('entry');

async function downloadFromSoundcloud(url) {
    try {
        const result = await sc_downloader.download(url, displayProgress);
        console.log(chalk.green("Song downloaded !"));
        tagger.askTagEdition(result.filename, result.coverUrl)
    } catch (e) {
        console.error(chalk.red.bold(e))
    }
}

async function downloadFromYoutube(url) {
    try {
        const result = await yt_downloader.download(url, displayProgress);
        console.log(chalk.green("Song downloaded !"));
        tagger.askTagEdition(result.filename);
    } catch (e) {
        console.error(chalk.red.bold(e))
    }
    //TODO catch errors
}

function displayProgress(chunk, total) {
    if (bar === null)
        bar = new ProgressBar('downloading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: total
        });
    bar.tick(chunk);
}

const link = process.argv[2];
let bar = null;

debug(`Track url : ${link}`);
const parsedUrl = urlParse(link, true);
debug(parsedUrl);
if (parsedUrl.host == 'soundcloud.com' &&
    parsedUrl.hostname == 'soundcloud.com') {
    downloadFromSoundcloud(link);
}
//TODO handle short youtube links
else if (parsedUrl.host == 'www.youtube.com' &&
    parsedUrl.hostname == 'www.youtube.com') {
    downloadFromYoutube(link);
}
else {
    console.log(chalk.red("Wrong url, service not found."));
}
