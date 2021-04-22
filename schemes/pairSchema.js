//Require Mongoose
var mongoose = require('mongoose')

//Define a schema
var Schema = mongoose.Schema

var PairSchema = new Schema({
  key: String,
  value: String
})

module.exports = PairSchema