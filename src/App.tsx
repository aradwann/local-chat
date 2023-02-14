import { useEffect, useState } from 'react'
import './App.css'
import { MessageForm } from './components/MessageForm';
import { MessageList } from './components/MessageList';
import { connectPeers } from './rtc-connection'
import { MessageSender } from './typing/enums';
import { Message } from './typing/interfaces';



function App() {

  const localConnection = new RTCPeerConnection();
  const remoteConnection = new RTCPeerConnection();
  const [connectionState, setConnectionState] = useState(localConnection.connectionState)
  const [isConnectBtnDisabled, setConnectBtnDisabled] = useState(false)
  const [messages, setMessages] = useState<Array<Message>>([])

  // configure event listeners for connection state  
  localConnection.onconnectionstatechange = e => setConnectionState(localConnection.connectionState)

  // remoteConnection.onconnectionstatechange = e => console.log({ remoteConnectionState: remoteConnection.connectionState })


  // create data channel for local peer
  const sendChannel = localConnection.createDataChannel("sendChannel");
  sendChannel.onopen = (e) => console.log('sendChannel opened', sendChannel);
  sendChannel.onclose = (e) => {
    console.log('sendChannel closed on local peer');
  };

  // remote data channel event listener
  remoteConnection.ondatachannel = (event) => {
    const receiveChannel = event.channel
    console.log('receivedChannel opened', receiveChannel);
    receiveChannel.onclose = (event) => {
      console.log('sendChannel closed on remote peer');
    };
    receiveChannel.onmessage = (event) => console.log('message receive on remote', event.data)
  }


  // setup the ICE candidates
  localConnection.addEventListener('icecandidate', async (e) => {
    if (e.candidate) {
      console.log('local connection ICE candidate: ', e.candidate)
      await remoteConnection.addIceCandidate(e.candidate)
    }
  })
  remoteConnection.addEventListener('icecandidate', async (e) => {
    if (e.candidate) {
      console.log('remote connection ICE candidate: ', e.candidate);
      await localConnection.addIceCandidate(e.candidate)
    }
  })

  function handleConnectClick() {
    connectPeers(localConnection, remoteConnection)
  }
  function handleDisonnectClick() {
    sendChannel.close()
    localConnection.close()
    remoteConnection.close()
    setConnectionState(localConnection.connectionState)
    console.log(localConnection.connectionState)
  }

  function handleSend(message: Message) {
    // sendChannel.send(message.data)
    setMessages([...messages, message])
  }

  useEffect(() => {
    if (connectionState === 'connected') {
      setConnectBtnDisabled(true)
    } else if (connectionState === 'closed') {
      setConnectBtnDisabled(false)
    }
    console.log('use effect used')
  }, [connectionState])

  return (
    <div className="App">

      <h1>Peers</h1>
      <div className="card">
        <button id='connectBtn' onClick={handleConnectClick} disabled={isConnectBtnDisabled}>
          Connect Peers
        </button>
        <button id='disconnectBtn' onClick={handleDisonnectClick} disabled={!isConnectBtnDisabled}>
          Disconnect Peers
        </button>
        <p>connection state is {connectionState}</p>
      </div>

      <MessageForm disabled={!isConnectBtnDisabled} handleSend={handleSend} />
      <MessageList messages={messages} />
    </div >
  )
}

export default App
