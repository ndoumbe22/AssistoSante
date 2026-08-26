import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

export default function VideoCall({ token, channelName, uid }) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));

  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await client.current.join("TON_APP_ID", channelName, token, uid);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        videoTrack.play(localVideoRef.current);

        await client.current.publish([audioTrack, videoTrack]);

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        client.current.on("user-published", async (user, mediaType) => {
          await client.current.subscribe(user, mediaType);
          if (mediaType === "video") user.videoTrack.play(remoteVideoRef.current);
          if (mediaType === "audio") user.audioTrack.play();
        });

        client.current.on("user-unpublished", (user, type) => {
          if (type === "video") remoteVideoRef.current.innerHTML = "";
        });
      } catch (err) {
        console.error("Erreur Agora:", err);
      }
    };

    init();

    return async () => {
      if (localAudioTrack) await localAudioTrack.close();
      if (localVideoTrack) await localVideoTrack.close();
      await client.current.leave();
    };
  }, [token, channelName, uid]);

  const toggleMic = async () => {
    if (!localAudioTrack) return;
    if (micOn) {
      await localAudioTrack.setEnabled(false);
    } else {
      await localAudioTrack.setEnabled(true);
    }
    setMicOn(!micOn);
  };

  const toggleCamera = async () => {
    if (!localVideoTrack) return;
    if (cameraOn) {
      await localVideoTrack.setEnabled(false);
    } else {
      await localVideoTrack.setEnabled(true);
    }
    setCameraOn(!cameraOn);
  };

  const leaveCall = async () => {
    if (localAudioTrack) await localAudioTrack.close();
    if (localVideoTrack) await localVideoTrack.close();
    await client.current.leave();
    // Optionnel: rediriger vers une autre page
    window.location.href = "/"; 
  };

  return (
    <div>
      <h2>Téléconsultation</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <div
          ref={localVideoRef}
          style={{ width: "50%", height: "400px", backgroundColor: "black" }}
        />
        <div
          ref={remoteVideoRef}
          style={{ width: "50%", height: "400px", backgroundColor: "black" }}
        />
      </div>
      <div style={{ marginTop: "10px" }}>
        <button onClick={toggleMic}>{micOn ? "Couper Micro" : "Activer Micro"}</button>
        <button onClick={toggleCamera}>{cameraOn ? "Couper Caméra" : "Activer Caméra"}</button>
        <button onClick={leaveCall} style={{ color: "red" }}>Quitter</button>
      </div>
    </div>
  );
}
