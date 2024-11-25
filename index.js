const PORT = 3000;

const fs = require('fs');
const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json({limit:"1mb"}));

const { createServer } = require("node:http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server);

let logins = require('./userData.json');
let storage = require('./data.json');
let settings = require('./settings.json');

function saveLogin(){
    fs.writeFileSync("./userData.json",JSON.stringify(logins));
}

function save(){
    fs.writeFileSync("./data.json",JSON.stringify(storage));
}

function saveSettings() {
    fs.writeFileSync("./settings.json", JSON.stringify(settings));
}

function getServerList(username){
    let serverlist = [];


}


io.on("connection", (socket)=>{

    socket.on("login?",(user) => {

        if(!user){
            socket.emit("login?",{passes:false,error:"empty data set"});
            return;
        }
        if(!logins[user.name]){
            socket.emit("login?",{passes:false,error:"account does not exsist"});
            return;
        }
        if(logins[user.name].password != user.password){
            socket.emit("login?",{passes:false,error:"incorrect password"});
            return;
        }

        let key = Math.floor(Math.random()*1023);



        user = {
            name:user.name,
            timestamp:user.timestamp,
            id:logins[user.name].id,
            key:key,
            passes:true,
            settings:settings[user.id],
            serverList:logins[user.name].servers
        }

        logins[user.name].key = key;
        logins[user.name].timestamp = user.timestamp;
        saveLogin();

        socket.emit("login?",user);
        return;
    })

    socket.on("autologin?",(user)=>{

        if(!user){
            socket.emit("login?",{passes:false,error:"empty data set"});
            return;
        }
        if(!logins[user.name]){
            socket.emit("login?",{passes:false,error:"account does not exsist"});
            return;
        }
        if(logins[user.name].key != user.key){
            socket.emit("login?",{passes:false,error:"incorrect key"});
            return;
        }

        user = {
            name:user.name,
            timestamp:user.timestamp,
            id:logins[user.name].id,
            key:logins[user.name].key,
            passes:true,
            settings:settings[user.id]
        }

        logins[user.name].timestamp = user.timestamp;
        saveLogin();

        socket.emit("login?",user);
    })

    socket.on("signup?", (user)=>{
        if(logins[user.name]){
            socket.emit("signup?",{passes:false,error:"Account already exists"});
            return;
        }

        let key = Math.floor(Math.random()*1023);

        logins[user.name]={
            name:user.name,
            password:user.password,
            timestamp:user.timestamp,
            creationDate:user.timestamp,
            id:logins.length,
            passes:true,
            settings:settings.defaultSettings,
            key:key
        }

        settings[logins[user.name].id] = logins[user.name].settings;

        socket.emit("signup?",logins[user.name]);

        saveLogin();
        saveSettings();
    })

    socket.on("settings", (user)=>{
        settings[user.id]=user.settings;
        saveSettings();
        socket.emit("settings",{"message":"data saved"});
    })

    socket.on("message",(msg)=>{
        let chan = msg.channel.split("-");
        let channel = chan[0];
        let server = chan[1];

        storage.channels[channel].messages.push({
            "user":msg.user,
            "content":msg.content,
            "timestamp":msg.timestamp
        })
        save();

        console.log(msg);

        socket.emit("message", msg);
    })
})


//start server
server.listen(PORT, () => {console.log(`server running on http://localhost:${PORT}`);});