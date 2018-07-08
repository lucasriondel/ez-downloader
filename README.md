# Ez Downloader

Ez Downloader is small typescript-written CLI used to download Soundcloud and Youtube tracks to your computer.

## Installation
Clone this repo

    git clone https://github.com/lucasriondel/ez-downloader
    cd ez-downloader
    yarn install
Run it using npm or yarn

    npm run start
    yarn start
Or add it globally and use it everywhere !

    npm install -g .
    yarn add global .
    // then
    ez https://www.youtube.com/watch?v=8ulEMXUNyRo

## 

The file explorer is accessible using the button in left corner of the navigation bar. You can create a new file by clicking the **New file** button in the file explorer. You can also create folders by clicking the **New folder** button.

## CLI Options


|Options|Description
|-|-
|`-n, --notags`|If this parameter is specified, for the whole duration of the program, it will not ask you if you would like to edit the IDv3 tags.
|`-o, --outputDir <dir>`| Will use this directory to store the outputted file, and then saves this directory for future downloads.