process.on('uncaugthException', (err) => {
  console.log('UNCAUGHT EXCEPTION SHUTTING DOWN...');
  console.log(err.name, err.message);
  process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_CONNECTION.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true, // Add this option to use the new Server Discover and Monitoring engine
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB:', err));

const app = require('./app');

const port = process.env.PORT;
const server = app.listen(port);
console.log('App running on port ' + port + '...');

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLED REJECTION SHUTTING DOWN...');
  server.close(() => process.exit(1));
});
