/* ===================
   Import Environment
=================== */
require('custom-env').env(true);

/* ===================
   Import Node Modules
=================== */
const express = require('express'); // Fast, unopinionated, minimalist web framework for node.
const app = express(); // Initiate Express Application
const router = express.Router(); // Creates a new router object.
const cors = require('cors');
const path = require('path'); // NodeJS Package for file paths
const port = process.env.PORT || 8080; // Allows heroku to set port
const morgan = require('morgan');
const favicon = require('express-favicon');
const { version } = require('./package.json');
require('dotenv').config();

/* ===================
   MongoDB config
=================== */
const mongoose = require('mongoose'); // Node Tool for MongoDB
mongoose.Promise = global.Promise;
const config = require('./config/database'); // Mongoose Config

/* ===================
   Import routes
=================== */
const artists = require('./routes/artists'); // Import Artist Routes
const blog = require('./routes/blog'); // Import Blog Routes
const changelog = require('./routes/changelog'); // Import Changelog Routes
const genres = require('./routes/genres'); // Import Genres Routes
const languages = require('./routes/languages'); // Import Language Routes
const meta = require('./routes/meta'); // Import Meta Routes
const recordings = require('./routes/recordings'); // Import Recordings Routes
const projects = require('./routes/projects'); // Import Projects Routes
const shows = require('./routes/shows'); // Import Shows Routes
const status = require('./routes/status'); // Import Shows Routes
const auth = require('./routes/authentication'); // Import Authentication Routes

/* ===================
   Error Tracking
=================== */
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: 'https://7d3e725a3d8b41be9299e8270f154c9b@sentry.io/1863652',
  environment: process.env.NODE_ENV,
  release: version,
});

/* ===================
   Cronjobs
=================== */
const cron = require('node-cron');
const algoliaRecordingsExport = require('./controllers/cronjobs/algolia_recordings_export');

cron.schedule('0 */12 * * *', () => {
  algoliaRecordingsExport.algoliaRecordingsExport();
});

/* ===================
   Database Connection
=================== */
mongoose.connect(
  config.uri,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      Sentry.captureException(err);
    } else {
      console.log('Connected to ' + config.db);
    }
  }
);
mongoose.set('useCreateIndex', true);

/* ===================
   Middlewares
=================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
}
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

/* ===================
   Stats API
=================== */
const initStats = require('@phil-r/stats');
const { statsMiddleware, getStats } = initStats({
  endpointStats: true,
  complexEndpoints: ['/artists/artist/:id', '/genres/genre/:id', '/recordings/recording/:id', '/shows/show/:id'],
  customStats: false,
  addHeader: true,
});
app.use(statsMiddleware);

/* ===================
   Swagger API Docs
=================== */
const expressSwagger = require('express-swagger-generator')(app);
let options = {
  swaggerDefinition: {
    info: {
      description:
        'The Radio Rasclat backend manages all CRUD requests for shows, recordings, their corresponding artists and also the user authentication.',
      title: 'Radio Rasclat API',
      version: version,
    },
    host: process.env.HOST,
    basePath: '',
    produces: ['application/json', 'application/xml'],
    schemes: ['https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: '',
      },
    },
  },
  basedir: __dirname, //app absolute path
  files: ['./routes/**/*.js'], //Path to the API handle folder
};
expressSwagger(options);

/* ===================
   Routes
=================== */
app.use('/artists', artists);
app.use('/blog', blog);
app.use('/changelog', changelog);
app.use('/genres', genres);
app.use('/languages', languages);
app.use('/meta', meta);
app.use('/recordings', recordings);
app.use('/projects', projects);
app.use('/shows', shows);
app.use('/status', status);
app.use('/auth', auth);

/* ===================
   Render base pages
=================== */
app.get('/stats', (req, res) => res.send(getStats()));

app.get('*', (req, res) => {
  res.sendStatus(200);
});

/* ===================
   Start Server on Port 8080
=================== */
app.listen(port, () => {
  console.log('Listening on port ' + port + ' in ' + process.env.NODE_ENV + ' mode');
});

module.exports = app;
