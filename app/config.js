//var Bookshelf = require('bookshelf');
var path = require('path');
var mongoose = require('mongoose');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

// var db = Bookshelf.initialize({
//   client: 'sqlite3',
//   connection: {
//     host: '127.0.0.1',
//     user: 'your_database_user',
//     password: 'password',
//     database: 'shortlydb',
//     charset: 'utf8',
//     filename: path.join(__dirname, '../db/shortly.sqlite')
//   }
// });

// db.knex.schema.hasTable('urls').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('urls', function (link) {
//       link.increments('id').primary();
//       link.string('url', 255);
//       link.string('base_url', 255);
//       link.string('code', 100);
//       link.string('title', 255);
//       link.integer('visits');
//       link.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });
// db.knex.schema.hasTable('users').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('users', function (user) {
//       user.increments('id').primary();
//       user.string('username', 100).unique();
//       user.string('password', 100);
//       user.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });

var connection = process.env.NODE_ENV === 'production'
  ? 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASSWORD + '@ds045097.mongolab.com:45097/shortly'
  : 'mongodb://localhost/shortly';

mongoose.connect(connection);

var urlSchema = new Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: {
    type: Number,
    default: 0
  }
});

urlSchema.pre('save', function(next){
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});

var userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.pre('save', function(next){
  var salt = bcrypt.genSaltSync(1);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

userSchema.methods.checkPass = function(password, cb){
  console.log('checking password: ', password);
  console.log('hashed pass: ', this.password);
  cb(bcrypt.compareSync(password, this.password));
};

mongoose.model('User', userSchema);
mongoose.model('Url', urlSchema);

module.exports = mongoose;
