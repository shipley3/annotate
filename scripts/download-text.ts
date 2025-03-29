const fs = require('fs');
const path = require('path');
const https = require('https');
const { IncomingMessage } = require('http');

const url = 'https://www.gutenberg.org/files/84/84-0.txt';

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response: typeof IncomingMessage) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err: Error) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'frankenstein.txt');

  try {
    await downloadFile(url, filePath);
    console.log('Successfully downloaded Frankenstein text');
  } catch (error) {
    console.error('Error downloading text:', error);
    process.exit(1);
  }
}

main(); 