const mongoose = require('mongoose')
const connect = mongoose.connect('mongodb://localhost:27017/project-tut');

connect.then(()=>{
    console.log('connect')
})
.catch(()=>{
    console.log('not connect')
})

const loginschema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true
    } 
})

//collection part
const collection =  mongoose.model('data',loginschema);

module.exports = collection;
