const request = require('request');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_RECORDINGS);

const Sentry = require('@sentry/node');

const algoliaRecordingsExport = () => {
  let options = {
    url: 'http://' + process.env.HOST + '/recordings',
    method: 'GET',
    accept: 'application/json',
    json: true,
  };

  async function emptyAlgolia() {
    index.clearIndex();
  }

  async function getDataSendAlgolia() {
    request(options, (err, res, body) => {
      if (err) {
        Sentry.captureException(err);
      }
      index.addObjects(body);
    });
  }

  async function run() {
    try {
      await emptyAlgolia();
      await getDataSendAlgolia();
    } catch (e) {
      Sentry.captureException(e);
    }
  }
  run();
};

module.exports = {
  algoliaRecordingsExport: algoliaRecordingsExport,
};
