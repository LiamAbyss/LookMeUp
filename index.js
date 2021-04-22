require('dotenv').config()
const { SHA256 } = require('crypto-js')
const randomstring = require('randomstring')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const ApiKeySchema = require('./schemes/apiKeySchema')
const PairSchema = require('./schemes/pairSchema')

let port = process.env.PORT
const uri = `mongodb+srv://${process.env.DB_HOST}:${process.env.DB_PASS}@lookmeupcluster.nl7pm.mongodb.net/Table?retryWrites=true&w=majority`

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})

let db = mongoose.connection

db.on('error', console.error.bind(console, 'Couldn\'t connect to database.'))
db.once('open', function (){
    console.log("Database connected.")
})

let Api = mongoose.model('ApiKey', ApiKeySchema)
let Pair = mongoose.model('Pair', PairSchema )

async function doesUserExist(apiKey) {
    if(apiKey === null || apiKey === undefined) return false
    let res = await Api.findOne({key: apiKey})
    return (res !== null && res !== undefined)
}

async function getPairOrCreate(value, length) {
    let check = await Pair.findOne({value: value})

    if(check !== null && check !== undefined) return check.key

    length = length || 20
    let key = randomstring.generate(length)
    while(await Pair.findOne({key: key}) !== null) {
        key = randomstring.generate(length)
    }

    let instance = new Pair({key: key, value: value})
    instance.save(function (err) {
        if (err) return handleError(err)
        // saved!
    })
    return key
}


let app = express()

app.use(cors())

let bodyParser = require('body-parser')

app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

app.get('/', (req, res) => {
    doesUserExist(req.headers['api-key'])
        .then(check => {
            if(check)
                res.send('Your API key is valid !')
            else
                res.send('Your API key is not valid !')
        })
})


app.get('/getApiKey', (req, res) => {
    doesUserExist(req.headers['api-key'])
        .then(check => {
            if(check) {
                let key = SHA256(randomstring.generate(25))
                while(db.collection('apikeys').find({key: key}).readableLength !== 0) {
                    key = SHA256(randomstring.generate(25))
                }
                let instance = new Api({key: key})
                instance.save(function (err) {
                    if (err) return handleError(err)
                    console.log('Instance saved')
                    // saved!
                })
                res.send(`${key}`)
            }
            else
                res.send('Invalid api key')
        })
})

app.post('/create', (req, res) => {
    doesUserExist(req.headers['api-key'])
        .then(check => {
            if(check){
                getPairOrCreate(req.body.value)
                    .then(key => {
                        res.send(key)
                    })
            }
            else
                res.send('Invalid api key')
        })
})

app.get('/get/:key', (req, res) => {
    doesUserExist(req.headers['api-key'])
        .then((check) => {
            if(!check)
                res.send('Invalid api key')
            else {
                Pair.findOne({key: req.params.key})
                    .then(val => {
                        res.send(`${val.value}`)
                    })
                    .catch((e) => {
                        res.send(`${e}`)
                    })
            }
        })
        .catch((e) => {
            res.send(`${e}`)
        })
})

app.get('/delete/:key', (req, res) => {
    doesUserExist(req.headers['api-key'])
        .then((check) => {
            if(!check)
                res.send('Invalid api key')
            else {
                Pair.findOneAndDelete({key: req.params.key})
                    .then(val => {
                        if(val !== null)
                            res.send(`${req.params.key} deleted`)
                        else
                            res.send(`${req.params.key} is not a valid key`)
                    })
                    .catch((e) => {
                        res.send(`${e}`)
                    })
            }
        })
        .catch((e) => {
            res.send(`${e}`)
        })
})

app.listen(port, () => {
    console.log('______             ______ ______  ___    _____  __')
    console.log('___  / _______________  /____   |/  /______  / / /_______ ')
    console.log('__  /  _  __ \\  __ \\_  //_/_  /|_/ /_  _ \\  / / /___  __ \\')
    console.log('_  /___/ /_/ / /_/ /  ,<  _  /  / / /  __/ /_/ / __  /_/ /')
    console.log('/_____/\\____/\\____//_/|_| /_/  /_/  \\___/\\____/  _  .___/ ')
    console.log('                                                 /_/      ')
    console.log(`LookMeUp listening at http://localhost:${port}`)
})
