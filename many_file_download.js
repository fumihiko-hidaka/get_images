const fs = require('fs');
const download = require('download');

class ManyFileDownload {
  constructor() {
    this.multiDownloads = 10;

    this.queue = [];
    this.downloadList = [];
    this.running = null;

    this.push.bind(this);
    this.sleep.bind(this);
    this.run.bind(this);
    this.isEnableInsertQueue.bind(this);
    this.insertQueues.bind(this);
    this.join.bind(this);
  }

  push(downloadPath, downloadLink) {
    this.downloadList.push({ downloadPath, downloadLink });
  }

  sleep() {
    return new Promise(resolve => setTimeout(resolve, 1000))
  };

  run() {
    this.running = setInterval(() => {
      this.insertQueues();
    }, 1000)
  };

  isEnableInsertQueue() {
    return this.queue.length < this.multiDownloads && this.downloadList.length > 0;
  };

  insertQueues() {
    if (!this.isEnableInsertQueue()) {
      return;
    }

    do {
      const { downloadPath, downloadLink } = this.downloadList.shift();

      this.queue.push(downloadPath);

      download(downloadLink).then(response => {
        fs.writeFile(downloadPath, response, err => {
          if (err) {
            console.error(err);
          }

          console.log(`${downloadPath} -> ${downloadLink}`);

          const deleteIndex = this.queue.findIndex(v => v === downloadPath);

          this.queue.splice(deleteIndex, 1);
        });
      });
    } while (this.isEnableInsertQueue());
  };

  async join() {
    if (this.running) {
      do {
        await this.sleep();
      } while (this.downloadList.length + this.queue.length > 0);

      clearInterval(this.running);
    }

    return true;
  };
}

module.exports = ManyFileDownload;
