import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../contexts/FirebaseAuthContext'
import AILoadingAnimation from '../components/AILoadingAnimation'
import ProctorMonitor from '../components/ProctorMonitor'
import ProctorAlert from '../components/ProctorAlert'
import InterviewLockdown from '../components/InterviewLockdown'
import { db } from '../config/firebase'
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Monitor, MonitorOff, MessageSquare, Users,
  Maximize, Minimize, Clock, Calendar, Briefcase, 
  ArrowLeft, Send, X, Shield, AlertTriangle
} from 'lucide-react'
import { 
  doc, setDoc, onSnapshot, deleteDoc, getDoc, 
  collection, addDoc, getDocs, updateDoc 
} from 'firebase/firestore'

function VideoCall() {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
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
  const [connectionLogs, setConnectionLogs] = useState([])
  const [proctorViolations, setProctorViolations] = useState([])
  const [showProctorPanel, setShowProctorPanel] = useState(false)
  const [isCandidate, setIsCandidate] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const unsubscribersRef = useRef([])
  const timerRef = useRef(null)
  const roomIdRef = useRef(null)

  const servers = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ],
    iceCandidatePoolSize: 10
  }

  const addLog = (message) => {
    console.log(`[VideoCall] ${message}`)
    setConnectionLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    loadMeetingInfo()
    return () => hangUp()
  }, [interviewId])

  useEffect(() => {
    if (callStartTime) {
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    }
    return () => timerRef.current && clearInterval(timerRef.current)
  }, [callStartTime])

  const loadMeetingInfo = async () => {
    try {
      const res = await api.get(`/interviews/${interviewId}/join`)
      if (res.data.success) {
        setMeetingInfo(res.data.meeting)
        // Determine if current user is candidate or recruiter
        setIsCandidate(res.data.meeting.candidate_id === user?.uid)
        addLog('Meeting info loaded')
      }
    } catch (err) {
      console.error('Failed to load meeting:', err)
      toast.error(err.response?.data?.message || 'Failed to load meeting')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const setupMediaStream = async () => {
    try {
      addLog('Requesting camera and microphone...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      addLog('Local media stream ready')
      return stream
    } catch (error) {
      addLog(`Media error: ${error.message}`)
      throw error
    }
  }

  const createPeerConnection = (localStream) => {
    addLog('Creating peer connection...')
    const pc = new RTCPeerConnection(servers)
    
    // Add local tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream)
      addLog(`Added local ${track.kind} track`)
    })

    // Handle remote stream
    pc.ontrack = (event) => {
      addLog(`Received remote ${event.track.kind} track`)
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setRemoteConnected(true)
        setStatus('Connected!')
        if (!callStartTime) setCallStartTime(Date.now())
        toast.success('Participant connected!')
      }
    }

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      addLog(`Connection state: ${pc.connectionState}`)
      if (pc.connectionState === 'connected') {
        setRemoteConnected(true)
        setStatus('Connected!')
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteConnected(false)
        setStatus(pc.connectionState === 'failed' ? 'Connection failed' : 'Disconnected')
      }
    }

    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state: ${pc.iceConnectionState}`)
    }

    pc.onicegatheringstatechange = () => {
      addLog(`ICE gathering state: ${pc.iceGatheringState}`)
    }

    peerConnectionRef.current = pc
    return pc
  }

  const joinMeeting = async () => {
    try {
      setJoined(true)
      setStatus('Setting up...')
      
      // Setup local media
      const localStream = await setupMediaStream()
      toast.success('Camera ready!')
      
      // Create peer connection
      const pc = createPeerConnection(localStream)
      
      // Setup room reference
      roomIdRef.current = `room_${interviewId}`
      const roomRef = doc(db, 'rooms', roomIdRef.current)
      const callerCandidatesCollection = collection(roomRef, 'callerCandidates')
      const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates')

      // Listen for proctor violations if recruiter
      if (!isCandidate) {
        const unsubProctor = onSnapshot(roomRef, (snapshot) => {
          const data = snapshot.data()
          if (data?.proctorViolations) {
            setProctorViolations(data.proctorViolations)
          }
        })
        unsubscribersRef.current.push(unsubProctor)
      }

      // Check if room exists
      const roomSnapshot = await getDoc(roomRef)
      
      if (!roomSnapshot.exists()) {
        // CREATE ROOM - We are the caller (first person)
        await createRoom(pc, roomRef, callerCandidatesCollection, calleeCandidatesCollection)
      } else {
        // JOIN ROOM - We are the callee (second person)
        await joinRoom(pc, roomRef, callerCandidatesCollection, calleeCandidatesCollection, roomSnapshot.data())
      }

    } catch (error) {
      addLog(`Error: ${error.message}`)
      toast.error('Failed to join: ' + error.message)
      setStatus('Error')
      setJoined(false)
    }
  }

  const createRoom = async (pc, roomRef, callerCandidatesCollection, calleeCandidatesCollection) => {
    addLog('Creating room as caller...')
    setStatus('Waiting for participant...')

    // Collect ICE candidates for caller
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        addLog('Sending caller ICE candidate')
        await addDoc(callerCandidatesCollection, event.candidate.toJSON())
      }
    }

    // Create offer
    const offerDescription = await pc.createOffer()
    await pc.setLocalDescription(offerDescription)
    addLog('Created and set local offer')

    const roomWithOffer = {
      offer: {
        type: offerDescription.type,
        sdp: offerDescription.sdp
      },
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'unknown'
    }

    await setDoc(roomRef, roomWithOffer)
    addLog('Room created with offer')

    // Listen for remote answer
    const unsubRoom = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data()
      if (data?.answer && !pc.currentRemoteDescription) {
        addLog('Received answer from callee')
        const answerDescription = new RTCSessionDescription(data.answer)
        await pc.setRemoteDescription(answerDescription)
        addLog('Set remote description (answer)')
      }
    })
    unsubscribersRef.current.push(unsubRoom)

    // Listen for callee ICE candidates
    const unsubCallee = onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          addLog('Received callee ICE candidate')
          const data = change.doc.data()
          await pc.addIceCandidate(new RTCIceCandidate(data))
        }
      })
    })
    unsubscribersRef.current.push(unsubCallee)
  }

  const joinRoom = async (pc, roomRef, callerCandidatesCollection, calleeCandidatesCollection, roomData) => {
    addLog('Joining room as callee...')
    setStatus('Connecting...')

    // Collect ICE candidates for callee
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        addLog('Sending callee ICE candidate')
        await addDoc(calleeCandidatesCollection, event.candidate.toJSON())
      }
    }

    // Set remote description (offer from caller)
    const offerDescription = new RTCSessionDescription(roomData.offer)
    await pc.setRemoteDescription(offerDescription)
    addLog('Set remote description (offer)')

    // Create answer
    const answerDescription = await pc.createAnswer()
    await pc.setLocalDescription(answerDescription)
    addLog('Created and set local answer')

    const roomWithAnswer = {
      ...roomData,
      answer: {
        type: answerDescription.type,
        sdp: answerDescription.sdp
      },
      answeredAt: new Date().toISOString(),
      answeredBy: user?.uid || 'unknown'
    }

    await updateDoc(roomRef, roomWithAnswer)
    addLog('Sent answer to caller')

    // Listen for caller ICE candidates
    const unsubCaller = onSnapshot(callerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          addLog('Received caller ICE candidate')
          const data = change.doc.data()
          await pc.addIceCandidate(new RTCIceCandidate(data))
        }
      })
    })
    unsubscribersRef.current.push(unsubCaller)
  }

  const hangUp = async () => {
    addLog('Hanging up...')
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    // Stop screen share
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Unsubscribe from Firestore
    unsubscribersRef.current.forEach(unsub => unsub())
    unsubscribersRef.current = []

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Delete room from Firestore
    if (roomIdRef.current) {
      try {
        const roomRef = doc(db, 'rooms', roomIdRef.current)
        
        // Delete subcollections
        const callerCandidates = await getDocs(collection(roomRef, 'callerCandidates'))
        callerCandidates.forEach(async (doc) => await deleteDoc(doc.ref))
        
        const calleeCandidates = await getDocs(collection(roomRef, 'calleeCandidates'))
        calleeCandidates.forEach(async (doc) => await deleteDoc(doc.ref))
        
        // Delete room document
        await deleteDoc(roomRef)
        addLog('Room deleted')
      } catch (e) {
        console.error('Error deleting room:', e)
      }
    }
  }

  const endCall = async () => {
    await hangUp()
    toast.success('Call ended')
    navigate(-1)
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioOn(audioTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    // Only candidates can share screen
    if (!isCandidate) {
      toast.error('Only candidates can share their screen')
      return
    }

    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      }
      const videoTrack = localStreamRef.current?.getVideoTracks()[0]
      if (videoTrack && peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(videoTrack)
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      setIsScreenSharing(false)
      toast.success('Screen sharing stopped')
      
      // Notify recruiter
      try {
        if (roomIdRef.current) {
          await updateDoc(doc(db, 'rooms', roomIdRef.current), {
            screenSharing: false,
            screenShareBy: null,
            screenShareEndedAt: Date.now()
          })
        }
      } catch (e) {
        console.error('Failed to update screen share status:', e)
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true // Include system audio if available
        })
        screenStreamRef.current = screenStream
        const screenTrack = screenStream.getVideoTracks()[0]
        
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video')
          if (sender) await sender.replaceTrack(screenTrack)
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        
        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare()
        }
        
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
        
        // Notify recruiter
        try {
          if (roomIdRef.current) {
            await updateDoc(doc(db, 'rooms', roomIdRef.current), {
              screenSharing: true,
              screenShareBy: user?.uid,
              screenShareStartedAt: Date.now()
            })
          }
        } catch (e) {
          console.error('Failed to update screen share status:', e)
        }
      } catch (e) {
        console.error('Screen share error:', e)
        toast.error('Failed to start screen sharing')
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
    setChatMessages(prev => [...prev, { 
      sender: 'You', 
      text: chatInput, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }])
    setChatInput('')
  }

  const handleProctorViolation = (violation) => {
    // Show notification to recruiter
    if (!isCandidate) {
      // Show alert popup for medium/high severity
      if (violation.severity !== 'low') {
        setActiveAlert(violation)
      }
      
      // Auto-show proctor panel on high severity violations
      if (violation.severity === 'high') {
        setShowProctorPanel(true)
      }
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
              onClick={joinMeeting} 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold transition-all"
            >
              <Video className="w-5 h-5" /> Join Meeting
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 rounded-xl border border-blue-800">
            <h3 className="text-blue-400 font-medium mb-2">💡 How it works</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>1. First person joins and waits</li>
              <li>2. Second person joins and connects automatically</li>
              <li>3. Both need to allow camera/microphone</li>
            </ul>
          </div>

          {/* Proctoring Notice for Candidates */}
          {isCandidate && (
            <div className="mt-4 p-4 bg-orange-900/30 rounded-xl border border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <h3 className="text-orange-400 font-medium">Proctoring Active</h3>
              </div>
              <ul className="text-sm text-orange-200 space-y-1">
                <li>• Stay focused on this window during the interview</li>
                <li>• Switching tabs/windows will be detected</li>
                <li>• Keep the interview in fullscreen mode</li>
                <li>• Avoid using other applications</li>
              </ul>
            </div>
          )}
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
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${!remoteConnected ? 'hidden' : ''}`}
          />
          {!remoteConnected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Users className="w-16 h-16 text-gray-500" />
                </div>
                <p className="text-white text-xl mb-2">{status}</p>
                <p className="text-gray-400">Waiting for the other participant...</p>
                
                {/* Connection Logs */}
                <div className="mt-6 max-w-md mx-auto text-left">
                  <p className="text-gray-500 text-xs mb-2">Connection Log:</p>
                  <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {connectionLogs.map((log, i) => (
                      <p key={i} className="text-gray-400 text-xs font-mono">{log}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (PiP) */}
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
                onKeyDown={e => e.key === 'Enter' && sendChat()} 
                placeholder="Type a message..." 
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button onClick={sendChat} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Proctor Panel (Recruiter Only) */}
        {!isCandidate && showProctorPanel && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">Proctoring</h3>
              </div>
              <button onClick={() => setShowProctorPanel(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ProctorMonitor 
                interviewId={interviewId}
                isCandidate={false}
                onViolation={handleProctorViolation}
                isActive={joined}
              />
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
            className={`p-4 rounded-full transition-all ${
              isCandidate 
                ? (isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600')
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            } text-white`}
            title={isCandidate ? (isScreenSharing ? 'Stop sharing' : 'Share screen') : 'Only candidates can share screen'}
            disabled={!isCandidate}
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
          
          {/* Proctor Monitor Button (Recruiter Only) */}
          {!isCandidate && (
            <button 
              onClick={() => setShowProctorPanel(!showProctorPanel)} 
              className={`p-4 rounded-full transition-all ${showProctorPanel ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'} text-white relative`}
              title="Proctoring Monitor"
            >
              <Shield className="w-6 h-6" />
              {proctorViolations.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{proctorViolations.length}</span>
                </div>
              )}
            </button>
          )}
          
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

      {/* Interview Lockdown for Candidates */}
      {isCandidate && (
        <InterviewLockdown 
          isActive={joined}
          onViolation={handleProctorViolation}
        />
      )}

      {/* Proctor Monitor for Candidates (Hidden UI, Background Monitoring) */}
      <ProctorMonitor 
        interviewId={interviewId}
        isCandidate={isCandidate}
        onViolation={handleProctorViolation}
        isActive={joined}
      />

      {/* Proctor Alert for Recruiters */}
      {!isCandidate && activeAlert && (
        <ProctorAlert 
          violation={activeAlert}
          onDismiss={() => setActiveAlert(null)}
        />
      )}
    </div>
  )
}

export default VideoCall
