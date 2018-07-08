import * as fs from 'fs';

export interface Config {
  outputDir: string;
  withTags?: boolean;
}

export const defaultConfig: Config = {
  outputDir: './',
  withTags: true,
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
