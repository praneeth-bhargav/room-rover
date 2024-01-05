import { useEffect, useState,useRef } from "react"
import io,{Socket} from 'socket.io-client'
import {produce,enableMapSet} from 'immer'
enableMapSet();
function App() {
  /**
     * @type [Socket<DefaultEventsMap, DefaultEventsMap>,React.Dispatch<React.SetStateAction<Socket<DefaultEventsMap, DefaultEventsMap>>>]
     */
  
  const [mySocket,setMySocket]=useState(null);
  const [roomIdToMessageMapping,setRoomIdToMessageMapping]=useState({});
  const [activeRoomNo,setActiveRoomNo]=useState(null);
  const [message,setMessage]=useState("");
  const [username,setUsername]=useState('');
  const entered=useRef(false);
  
  const [roomIdToTypinUsernameMapping,setRoomIdToTypinUsernameMapping]=useState({});
  const[roomIdUsernameToTypingIndicatorTimeoutMapping,setRoomIdUsernameToTypingIndicatorTimeoutMapping]=useState({});
  console.log("hi");
  useEffect(()=>{
    if(!(entered.current)){
      entered.current=true;
    
    if(username===''){
      while(true){
        const entered_name=window.prompt("Please enter your name");
        if(entered_name.trim()!=='' ){
          // setEntered(true);
          setUsername(entered_name);
          break;
        }
      }
    }
  }
    const socket=io('ws://localhost:3001',{
      transports:['websocket']
    })
    
    setMySocket(socket);
    socket.on("roomMessage",(data)=>{
      // const {roomId,message}=data;
      setRoomIdToMessageMapping(produce((state)=>{
        state[data.roomId]=state[data.roomId]||[];
        if(!(state[data.roomId].some(obj=>obj.id===data.id))){
          state[data.roomId].push(data);
        }
      }))
    })
    socket.on("userTyping",(data)=>{
      const {roomId,username}=data;
      //  clearTimeout(roomIdUsernameToTypingIndicatorTimeoutMapping[roomId+'-'+username]);
      setRoomIdToTypinUsernameMapping(produce((state)=>{
          state[roomId]=state[roomId]||new Set();
          state[roomId].add(username);
      }));
      const timeoutId=setTimeout(()=>{setRoomIdToTypinUsernameMapping(produce((state)=>{
        state[roomId]=state[roomId]||new Set();
        state[roomId].delete(username);
    }))},5000);
    setRoomIdUsernameToTypingIndicatorTimeoutMapping(produce(state=>{
      clearTimeout(state[roomId+'-'+username]);
      state[roomId+'-'+username]=timeoutId;
    }))
    })
    // joinRoomExclusively(1);
    return (()=>{
      socket.close();
    });
  },[])
  function joinRoomExclusively(roomId){
    // console.log(typeof roomId);
    if(mySocket==null)return null;
    mySocket.emit('join-room',roomId);
    setActiveRoomNo(roomId);
  }
  function sendTypingIndicator(){
    mySocket.emit('sendTypingIndicator',{
      roomId:activeRoomNo,
      username,
    })
  }
  if(mySocket==null)return null;
  const messagesOfRoom=roomIdToMessageMapping[activeRoomNo]||[];
  // console.log(roomIdToTypinUsernameMapping[activeRoomNo]);
  const typingUsersInTheRoom=roomIdToTypinUsernameMapping[activeRoomNo]!=null?[...roomIdToTypinUsernameMapping[activeRoomNo]]||[]:[]
  // console.log([...roomIdToTypinUsernameMapping[activeRoomNo]])
  function sendMessage(roomId,message){
    if(typeof roomId !== 'number'){
      console.log(typeof roomId);
      return alert("Please be a part of room before sending message");

    }
    mySocket.emit("sendMessage",{roomId:activeRoomNo,message:message,username})
    console.log(roomId);
    setMessage('');
  }
  return (
    <>
      <div className="grid grid-cols-12 divide-x divide-gray-600 h-screen ">
        <aside className="col-span-4 overflow-y-auto">
          {
            Array(50).fill(0).map((_,i)=>{
              return <div className= {`hover:bg-gray-300 p-3 hover:cursor-pointer ${activeRoomNo===i+1?"bg-blue-500":"bg-white"}`} key={i} onClick={()=>joinRoomExclusively(i+1)}>Room#{i+1}</div>
            })
          }
        </aside>
        <main className="col-span-8 flex flex-col mx-1 pl-1">
          <div className="bg-blue-500 px-2 py-1 self-center">Room No {activeRoomNo}</div>
          {typingUsersInTheRoom && <p className="italic text-gray-700">Typing: {typingUsersInTheRoom.join(',')}</p>}
        {messagesOfRoom.map(({message,username},i)=>{
            return (<>
              <b>sent by {username}</b>
              <h1 key={i}>{message}</h1>
            </>)
          })}
        <div className="flex-grow"></div>
        <div className="flex justify-center-items-center gap-2">
        <textarea onChange={(e)=>{
          setMessage(e.target.value);
          sendTypingIndicator();
          }} value={message} id="about" name="about" rows="3" className=" flex-grow block mb-2 w-full rounded-md border border-blue-600  px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
        <button type="submit" className="h-12 self-end mb-2 flex-shrink rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" onClick={()=>sendMessage(activeRoomNo,message)}>Send</button>
        </div>
          
        </main>
      </div>
    </>
  )
}

export default App
