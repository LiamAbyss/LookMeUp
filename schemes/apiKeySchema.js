//Require Mongoose
var mongoose = require('mongoose')

//Define a schema
var Schema = mongoose.Schema

var ApiKeySchema = new Schema({
  key: String
})

module.exports = ApiKeySchema