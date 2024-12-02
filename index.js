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

        let key = Math.floor(Math.random()*(2**25-1));
        
        user = {
            name:user.name,
            timestamp:user.timestamp,
            id:logins[user.name].id,
            key:key,
            passes:true,
            settings:settings[user.id],
            serverList:logins[user.name].servers,
            channel:logins[user.name].channel
        }

        logins[user.name].key = key;
        logins[user.name].timestamp = user.timestamp;
        saveLogin();

        socket.emit("login?",user);
        socket.emit("messages",storage.channels[user.channel.split("-")[0]].messages);
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
            settings:settings[user.id],
            channel:logins[user.name].channel
        }

        logins[user.name].timestamp = user.timestamp;
        saveLogin();

        user.servers=[];

        for(let i = 0; i < logins[user.name].servers.length; i++){
            let serverId = logins[user.name].servers[i];
            user.servers.push({
                "id":serverId,
                name:storage.servers[serverId].name,
                channels:[]
            })

            for(let j = 0; j < storage.servers[serverId].channels.length; j++){
                let channel = storage.channels[storage.servers[serverId].channels[j]];
                user.servers[serverId].channels.push(channel)
            }
        }

        console.log(user);

        socket.emit("login?",user);
    })

    socket.on("signup?", (user)=>{
        if(logins[user.name]){
            socket.emit("signup?",{passes:false,error:"Account already exists"});
            return;
        }

        let key = Math.floor(Math.random()*(2**25-1));

        logins[user.name]={
            name:user.name,
            password:user.password,
            timestamp:user.timestamp,
            creationDate:user.timestamp,
            id:logins.length,
            key:key,
            servers:["0"],
            channel:"0-0"
        }

        settings[logins[user.name].id] = settings.defaultSettings;

        

        saveLogin();
        saveSettings();
        
        socket.emit("signup?",logins[user.name]);
    })

    socket.on("settings", (user)=>{
        settings[user.id]=user.settings;
        saveSettings();
        socket.emit("settings",{"message":"data saved"});
    })

    socket.on("message",(msg)=>{
        let chan = msg.channel;
        let channel = chan[0];
        let server = chan[1];

        if(!storage.channels[channel]){
            socket.emit("error", {from:msg.user,timestamp:msg.timestamp,error:"channelNotFound"});
            return;
        }

        storage.channels[channel].messages.push({
            "user":msg.user,
            "content":msg.content,
            "timestamp":msg.timestamp
        })
        save();

        console.log(msg);

        io.emit("message", msg);
    })

    socket.on("channelCreate",(channel)=>{
        function err (msg) {
            socket.emit("error",msg);
        }
        if(!channel.name){
            err("404: no channel name found");
        }
        if(!channel.user){
            err("403: unauthorized");
        }
        if(!channel.server){
            err("404: no server found");
        }

        let channelId = storage.channels.length;

        storage.channels[channelId]={
            "server":channel.server,
            "id":storage.channels.length,
            "name":channel.name,
            "creator":channel.user,
            "creationData":Date.now(),
            "messages":[{"name":`${channel.name}`,"content":`Welcome!\nThis is the begining of channel ${channel.name}(${storage.channels.length})`}]
        }

        save();

        io.emit("newChannel",storage.channels[`${storage.channels.length-1}`]);

    })
})


//start server
server.listen(PORT, () => {console.log(`server running on http://localhost:${PORT}`);});
