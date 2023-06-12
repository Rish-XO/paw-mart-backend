const express = require('express')
const app = express()
const cors= require('cors')
const pool = require('./db')

// psql connection
pool.connect()

app.use(cors());
app.use(express.json());


app.get('/', (req, res) =>{
    res.send('yoyy')
})



app.listen(5000, ()=> {
    console.log('listening on 5000');
})