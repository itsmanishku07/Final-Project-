import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../contexts/FirebaseAuthContext'
import AILoadingAnimation from '../components/AILoadingAnimation'
import { db } from '../config/firebase'
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Monitor, MonitorOff, MessageSquare, Users,
  Maximize, Minimize, Clock, Calendar, Briefcase, 
  ArrowLeft, Send, X
} from 'lucide-react'
import { doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore'

function VideoCall() {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [meetingInfo, setMeetingInfo] = useState(null)
  const [joined, setJoined] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [callStartTime, setCallStartTime] = useState(null)
  const [status, setStatus] = useState('Ready to join')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const unsubRef = useRef(null)
  const timerRef = useRef(null)

  // WebRTC configuration with multiple STUN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    loadMeetingInfo()
    return () => cleanup()
  }, [interviewId])

  useEffect(() => {
    if (callStartTime) {
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    }
    return () => timerRef.current && clearInterval(timerRef.current)
  }, [callStartTime])

  const cleanup = () => {
    console.log('Cleaning up...')
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const loadMeetingInfo = async () => {
    try {
      const res = await api.get(`/interviews/${interviewId}/join`)
      if (res.data.success) {
        setMeetingInfo(res.data.meeting)
        console.log('Meeting info:', res.data.meeting)
      }
    } catch (err) {
      console.error('Failed to load meeting:', err)
      toast.error('Failed to load meeting')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const joinMeeting = async () => {
    try {
      console.log('=== JOIN MEETING CLICKED ===')
      setJoined(true)
      setStatus('Requesting camera access...')
      
      // Step 1: Get local media
      console.log('Step 1: Getting user media...')
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        console.log('Got media stream:', stream.getTracks().map(t => t.kind))
      } catch (mediaError) {
        console.error('Media error:', mediaError)
        toast.error('Camera/Microphone access denied. Please allow access and try again.')
        setStatus('Camera access denied')
        setJoined(false)
        return
      }
      
      localStreamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        console.log('Local video element set')
      }
      setStatus('Camera ready. Connecting...')
      toast.success('Camera connected!')

      // Step 2: Create peer connection
      console.log('Step 2: Creating peer connection...')
      const pc = new RTCPeerConnection(rtcConfig)
      pcRef.current = pc

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to PC:', track.kind)
        pc.addTrack(track, stream)
      })

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log('=== RECEIVED REMOTE TRACK ===', event.track.kind)
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setRemoteConnected(true)
          setStatus('Connected!')
          if (!callStartTime) setCallStartTime(Date.now())
          toast.success('Connected to remote participant!')
        }
      }

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE state changed:', pc.iceConnectionState)
        setStatus(`ICE: ${pc.iceConnectionState}`)
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setRemoteConnected(true)
          setStatus('Connected!')
        } else if (pc.iceConnectionState === 'disconnected') {
          setStatus('Reconnecting...')
        } else if (pc.iceConnectionState === 'failed') {
          setStatus('Connection failed')
          setRemoteConnected(false)
        }
      }

      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState)
      }

      // Step 3: Setup signaling with Firebase
      console.log('Step 3: Setting up Firebase signaling...')
      const roomId = `interview_${interviewId}`
      const roomRef = doc(db, 'videoCalls', roomId)
      
      console.log('Checking room:', roomId)
      let roomSnapshot
      try {
        roomSnapshot = await getDoc(roomRef)
        console.log('Room exists:', roomSnapshot.exists())
        if (roomSnapshot.exists()) {
          console.log('Room data:', roomSnapshot.data())
        }
      } catch (firebaseError) {
        console.error('Firebase error:', firebaseError)
        toast.error('Firebase connection error. Check console.')
        setStatus('Firebase error')
        return
      }
      
      if (roomSnapshot.exists() && roomSnapshot.data()?.offer) {
        // Room exists with offer - join as answerer
        console.log('=== JOINING AS ANSWERER ===')
        setStatus('Connecting to host...')
        await joinAsAnswerer(pc, roomRef, roomSnapshot.data())
      } else {
        // Create new room as offerer
        console.log('=== CREATING AS OFFERER ===')
        setStatus('Waiting for participant...')
        await createAsOfferer(pc, roomRef)
      }

    } catch (err) {
      console.error('Join meeting error:', err)
      toast.error('Failed to join: ' + err.message)
      setStatus('Error: ' + err.message)
      setJoined(false)
    }
  }

  const createAsOfferer = async (pc, roomRef) => {
    // Collect ICE candidates
    const iceCandidates = []
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate (offerer)')
        iceCandidates.push(event.candidate.toJSON())
        // Update Firestore with new candidate
        setDoc(roomRef, {
          offer: pc.localDescription ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : null,
          offerCandidates: iceCandidates,
          createdAt: Date.now()
        }, { merge: true }).catch(console.error)
      }
    }

    // Create offer
    console.log('Creating offer...')
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    console.log('Offer created and set as local description')

    // Save offer to Firestore
    await setDoc(roomRef, {
      offer: { type: offer.type, sdp: offer.sdp },
      offerCandidates: [],
      createdAt: Date.now()
    })
    console.log('Offer saved to Firestore')

    // Listen for answer
    unsubRef.current = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data()
      if (!data) return

      // Handle answer
      if (data.answer && pc.signalingState === 'have-local-offer') {
        console.log('Received answer')
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
          console.log('Remote description set (answer)')
        } catch (e) {
          console.error('Error setting remote description:', e)
        }
      }

      // Handle answer ICE candidates
      if (data.answerCandidates && pc.remoteDescription) {
        for (const candidate of data.answerCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            // Ignore duplicate candidates
          }
        }
      }
    })
  }

  const joinAsAnswerer = async (pc, roomRef, roomData) => {
    // Set remote description (offer)
    console.log('Setting remote description (offer)...')
    await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer))
    console.log('Remote description set')

    // Add existing offer ICE candidates
    if (roomData.offerCandidates) {
      console.log('Adding offer candidates:', roomData.offerCandidates.length)
      for (const candidate of roomData.offerCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error('Error adding offer candidate:', e)
        }
      }
    }

    // Collect answer ICE candidates
    const iceCandidates = []
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate (answerer)')
        iceCandidates.push(event.candidate.toJSON())
        // Update Firestore with new candidate
        setDoc(roomRef, {
          answerCandidates: iceCandidates
        }, { merge: true }).catch(console.error)
      }
    }

    // Create answer
    console.log('Creating answer...')
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    console.log('Answer created and set as local description')

    // Save answer to Firestore
    await setDoc(roomRef, {
      answer: { type: answer.type, sdp: answer.sdp },
      answerCandidates: []
    }, { merge: true })
    console.log('Answer saved to Firestore')

    // Listen for new offer candidates
    unsubRef.current = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data()
      if (!data) return

      if (data.offerCandidates && pc.remoteDescription) {
        for (const candidate of data.offerCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            // Ignore duplicate candidates
          }
        }
      }
    })
  }

  const endCall = async () => {
    cleanup()
    
    try {
      const roomId = `interview_${interviewId}`
      await deleteDoc(doc(db, 'videoCalls', roomId))
      console.log('Room deleted')
    } catch (e) {
      console.error('Error deleting room:', e)
    }

    toast.success('Call ended')
    navigate(-1)
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setIsVideoOn(track.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0]
      if (track) {
        track.enabled = !track.enabled
        setIsAudioOn(track.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop())
      }
      // Replace with camera
      const track = localStreamRef.current?.getVideoTracks()[0]
      if (track && pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(track)
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      setIsScreenSharing(false)
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screen
        const track = screen.getVideoTracks()[0]
        
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(track)
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screen
        }
        
        track.onended = () => toggleScreenShare()
        setIsScreenSharing(true)
      } catch (e) {
        console.error('Screen share error:', e)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages(p => [...p, { 
      sender: 'You', 
      text: chatInput, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }])
    setChatInput('')
  }

  const formatDuration = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <AILoadingAnimation message="Loading Meeting" context="interview" size="medium" />
      </div>
    )
  }

  if (!meetingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Meeting Not Found</h2>
          <button onClick={() => navigate(-1)} className="text-blue-400 hover:underline">Go Back</button>
        </div>
      </div>
    )
  }

  // Pre-join screen
  if (!joined) {
    const dt = new Date(meetingInfo.scheduled_at)
    const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Video Interview</h1>
            <p className="text-gray-400">Click Join to start your video call</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{meetingInfo.job_title}</h2>
                <p className="text-gray-400">{meetingInfo.company}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="text-sm">{dateStr}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm text-gray-500">Time</div>
                  <div>{timeStr}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm text-gray-500">Joining as</div>
                <div>{meetingInfo.user_name}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Go Back
            </button>
            <button 
              onClick={() => {
                alert('Join Meeting clicked!')
                joinMeeting()
              }} 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold transition-all"
            >
              <Video className="w-5 h-5" /> Join Meeting
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 rounded-xl border border-blue-800">
            <h3 className="text-blue-400 font-medium mb-2">💡 How to connect</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>1. Click "Join Meeting" and allow camera/microphone</li>
              <li>2. First person waits, second person connects automatically</li>
              <li>3. Both participants must click "Join Meeting"</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // In-call screen
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${remoteConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-white font-medium">{meetingInfo.job_title}</span>
          {callStartTime && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${remoteConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {status}
        </span>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Remote Video (Main) */}
        <div className="flex-1 relative bg-gray-800">
          {remoteConnected ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Users className="w-16 h-16 text-gray-500" />
                </div>
                <p className="text-white text-xl mb-2">{status}</p>
                <p className="text-gray-400">Waiting for the other participant to join...</p>
                <p className="text-gray-500 text-sm mt-4">Make sure they also click "Join Meeting"</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-72 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
          />
          {!isVideoOn && (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {meetingInfo.user_name?.charAt(0)?.toUpperCase() || 'Y'}
                </span>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
            You {!isAudioOn && '🔇'}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">No messages yet</p>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg px-3 py-2 bg-blue-600">
                      <div className="text-xs text-blue-200 mb-1">{m.sender} • {m.time}</div>
                      <p className="text-white text-sm">{m.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && sendChat()} 
                placeholder="Type a message..." 
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button onClick={sendChat} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 px-4 py-4 border-t border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={toggleAudio} 
            className={`p-4 rounded-full transition-all ${isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleVideo} 
            className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleScreenShare} 
            className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => setShowChat(!showChat)} 
            className={`p-4 rounded-full transition-all ${showChat ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
            title="Chat"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          
          <button 
            onClick={toggleFullscreen} 
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={endCall} 
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all ml-4"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall
