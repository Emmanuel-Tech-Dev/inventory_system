

const express = require("express");
const https = require('https');
var multer = require('multer');


const crypto = require("crypto");
const fs = require('fs');

const path = require("path");
const logger = require('morgan');
const workerpool = require('workerpool');
const moment = require('moment');

const { Server } = require('socket.io');

const Model = require('./model/model');
const Utilities = require('./helper/functions');
const Settings = require('./helper/settings');

// var app = express();//creating express instance
// const server = http.createServer(app);//creating http instance that takes express as a plugin
const io = new Server(3002);//creating socket.io intance that takes http instance as a plugin
console.log("Server running on port 3002");
//use pm2 to start this server
// server.listen(3002, async () => {//http listening on port 
//     console.log("Server running on port 3001");
// });

/** SOCKET IO HERE*/
io.use(async (socket, next) => {
    const email = socket.handshake.auth.email;
    const res = await new Model().select('user', ['email']).where(null, [{ email }], '=', null).query();
    if (!email || res.length == 0) {
        return next(new Error('invalid_email'));
    }
    socket.email = email;
    next();
});

function getOthersInChat(prevMsg, email) {
    let others = [];
    prevMsg.forEach((msg) => {
        const sender = msg.sender;
        const receiver = msg.receiver;
        if (sender == email) {
            others.push(receiver);
        } else {
            others.push(sender);
        }
    });
    return others;
}

let users = {};
let usersForClients = {};
io.on('connection', async (socket) => {
    console.log('a user connected', socket.email);
    
    //build an object containing user email as keys and socket.id as values
    const email = socket.email;
    users[email] = socket.id;
    usersForClients[email] = email;
    // console.log(users);

    function prevMsg(){
        return [];
    }

    setTimeout(() => {
        io.to(socket.id).emit('prev_msg', prevMsg());
    }, 500);

    // upon cnnection, send existing users to all users 
    io.emit('existing_users', usersForClients);


    socket.on('get_existing_users', function () {
        io.to(socket.id).emit('existing_users', usersForClients);
    });

    socket.on('disconnect', () => {
        delete usersForClients[socket.email];
        delete users[socket.email];
        socket.broadcast.emit('existing_users', usersForClients);
        console.log('user disconnected');
    });



});
