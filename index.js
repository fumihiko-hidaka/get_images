const { google } = require('googleapis');
const customSearch = google.customsearch('v1');
const mkdirp = require('mkdirp');
const path = require('path');
const ManyFileDownload = require('./many_file_download');

require('dotenv').config();

const SEARCH_KEYWORD = process.argv[2] || '';
const GET_ITEM_COUNT = parseInt(process.argv[3], 10) || 10;
const CSE_ID = process.env.CSE_ID;
const API_KEY = process.env.API_KEY;
const SAVE_BASE_DIR = process.env.SAVE_DIR;

const FILE_NAME_LENGTH = GET_ITEM_COUNT.toString().length;

const saveDir = path.join(SAVE_BASE_DIR, (new Date()).toISOString());
console.log(saveDir);
mkdirp.sync(saveDir);

const searchNum = 10;
let startIndex = 0;

const downloader = new ManyFileDownload();
downloader.run();

const saveImages = async () => {

  let itemUrls = [];

  do {
    const result = await customSearch.cse.list({
      cx: CSE_ID,
      q: SEARCH_KEYWORD,
      auth: API_KEY,
      searchType: 'image',
      safe: 'high',
      num: searchNum, // max:10
      start: startIndex + 1,
    });

    itemUrls = result.data.items.map(item => item.link);

    result.data.items.forEach(item => {
      startIndex += 1;

      const mimeExt = item.mime.split('/').pop() || '';
      const linkExt = path.extname(item.link).replace('.', '').split('?').shift() || '';

      const fileExt = mimeExt || linkExt || 'jpg';
      const fileBaseName = `${'0'.repeat(FILE_NAME_LENGTH)}${startIndex}`.slice(-FILE_NAME_LENGTH);

      downloader.push(
        path.join(saveDir, `${fileBaseName}.${fileExt}`),
        item.link
      );
    });

    console.log(`画像URL取得中 : ${startIndex} / ${GET_ITEM_COUNT}`);

  } while (startIndex < GET_ITEM_COUNT || itemUrls.length < searchNum);

  return downloader.join();
};

saveImages()
  .then(() => {
    console.log('end')
  })
  .catch(e => {
    console.error(e);
    console.error('error');
  });
