import { useEffect, useState,useRef, useContext } from "react"
import Peer from 'simple-peer';
import Context from "../../context";
import { useSocket } from "../../socketContect";
import "./video.css"

const Video = ()=>{
    const socket = useSocket()
    const {name,socketId} = useContext(Context)
    const [remoteUser,setRemoteUser] = useState("")
    const [localStream, setLocalStream] = useState(null);
    const [isTrue,setIsTrue] = useState(false)
    const [incomingCall,setIncomingcall] = useState(false)
    const [buttons,setButtons] = useState(false)
    const [isMute,setIsMute] = useState(false)
    const [isVideoMuted,setIsVideoMuted] = useState(false)
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [peer, setPeer] = useState(null);
    const [reSingle, setReSingle] = useState();

    const myVideo = useRef();
    const userVideo = useRef();


  useEffect(()=>{
    // localStream.setItem(name,socketId)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
               setLocalStream(stream);
               if (myVideo.current) {
                 myVideo.current.srcObject = stream;
               }
             });


             socket.on("callUser", (data) => {
                    setRemoteUser(data.from);
                      setReSingle(data.signal);
                        setIncomingcall(true)
                    });
  },[])
  const setupPeer = () => {
    const id = localStorage.getItem(remoteUser)
        const peer = new Peer({
          initiator: true,
          stream: localStream,
          trickle: false,
        });
    
        peer.on('signal', signal => {
          console.log('Generated offer signal:', signal);
          socket.emit("callUser", {
            userToCall: id,
            signalData: signal,
            from: name,
          });
        });
    
        peer.on('stream', stream => {
          console.log('Received remote stream');
        //   setRemoteStream(stream);
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
        });
    
        socket.on("callAccepted", (signal) => {
          peer.signal(signal);
          setIsTrue(true);
          setIncomingcall(true)
          setButtons(true)
        });
    
        peer.on('connect', () => {
          console.log('Peer connection established');
        });
    
        peer.on('error', err => {
          console.error('Peer connection error:', err);
        });
    
        setPeer(peer);
      };

  const answerCall = () => {
        setIsTrue(true);
        setButtons(true)
        const id = localStorage.getItem(remoteUser)
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: localStream,
        });
    
        peer.on("signal", (data) => {
          socket.emit("answerCall", { signal: data, to: id });
        });
    
        peer.on("stream", (stream) => {
        //   setRemoteStream(stream);
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
        });
    
        peer.on('connect', () => {
          console.log('Peer connection established');
        });
    
        peer.on('error', err => {
          console.error('Peer connection error:', err);
        });
    
        peer.signal(reSingle);
        setPeer(peer);
      };
      const toggleAudioMute = () => {
            localStream.getAudioTracks().forEach(track => {
              track.enabled = !track.enabled;
            });
            setIsMute(!isMute);
          };
        
const toggleVideoMute = () => {
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
    });
    setIsVideoMuted(!isVideoMuted);
};

const screenSharingBtn = () => {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then((screenStream) => {
          if (peer) {
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = peer._pc.getSenders().find((s) => s.track.kind === videoTrack.kind);
    
            if (sender) {
              setIsScreenSharing(true);
              sender.replaceTrack(videoTrack);
            } else {
              console.error("Sender not found in peer connection.");
            }
          } else {
            console.error("Peer connection not initialized.");
          }
        }).catch((error) => {
          console.error("Error getting screen sharing stream:", error);
        });
      };

    return(
        <div className="video-container">
            <p className="heading">Hello {name}</p>
                   {!buttons && 
                   <div>  
                        <input  type="text" value={remoteUser} onChange={(e)=>setRemoteUser(e.target.value)} placeholder="Remote User Name"/>
                        {!incomingCall && <button type="button" onClick={setupPeer} >Invite User</button>}
                        {incomingCall && <button type='button' onClick={answerCall}>Accept</button>}
                    </div>
                    }
            <div className="user-video-conatainer">
                {localStream && <video ref={myVideo} autoPlay muted style={{ width: "20%" }} />}
                {isTrue && <video ref={userVideo} autoPlay style={{ width: "100%", height:"450px" }}/>}
            </div>
            <div className="bottom-container">
                 <button type="button" className="bottom-button"  onClick={toggleAudioMute}>{isMute ? 'Unmute Audio' : 'Mute Audio'}</button>
                <button type="button" className="bottom-button" onClick={toggleVideoMute}>{isVideoMuted ? 'Unmute Video' : 'Mute Video'}</button>


                <button type="button" className="bottom-button" onClick={screenSharingBtn} disabled={isScreenSharing}>
           {isScreenSharing ? 'Screen Sharing' : 'Start Screen Share'}
         </button>

            </div>
        </div>
    )
    
}
export default Video