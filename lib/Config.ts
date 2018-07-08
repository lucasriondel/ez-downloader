import { initDir } from './misc';
import * as fs from 'fs';
import chalk from 'chalk';

export interface Config {
  outputDir: string;
}

export const defaultConfig: Config = {
  outputDir: './',
};

export const initConfig = () => {
  if (!fs.existsSync('./config')) {
    fs.writeFileSync('./config', JSON.stringify(defaultConfig, null, 2));
  }
};

export const getConfig: () => Config = () => {
  initConfig();
  return JSON.parse(fs.readFileSync('./config', 'utf-8'));
};

export const setConfig = (config: Config) => {
  initConfig();
  return fs.writeFileSync('./config', JSON.stringify(config, null, 2));
};

export const changeOutputDir = async (outputDir: string): Promise<void> => {
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
};
