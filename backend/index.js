const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const {nanoid}=require("nanoid")
const app=express()
const appWebSocket = express();
app.use(express.static("./public"))
const server = createServer(appWebSocket);
const io = new Server(server, {
    transports:['websocket'],
    cors:{
        origin:"*",
        methods:['GET','POST']
    }
});
// app.get("/",(req,res)=>{
//     res.send("response from express server")
// })
const roomIdToMessageMapping={};
io.on("connection", (socket) => {
  socket.on("sendMessage",(data)=>{
    roomIdToMessageMapping[data.roomId]=roomIdToMessageMapping[data.roomId]||[];
    roomIdToMessageMapping[data.roomId].push({...data,id:nanoid()});
    io.to(data.roomId).emit('roomMessage',{...data,id:nanoid()});
  })
  // ...
  socket.on("join-room",(roomId)=>{
    if(roomId<1 || roomId>50){
      return socket.emit('error-from-servre',`invalid room ${roomId}`);
    }
    socket.rooms.forEach(room=>{
      socket.leave(room)
    });
    socket.join(roomId)
    const messages=roomIdToMessageMapping[roomId]||[]
    for(const message of messages){
      socket.emit('roomMessage',message);
    }
  })
  socket.on("sendTypingIndicator",(data)=>{
    const {roomId}=data;
    io.to(roomId).emit('userTyping',data);
  })
  
});

server.listen(3001,()=>{
    console.log("socket.io running succesfully");
});