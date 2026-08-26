import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaSignOutAlt } from "react-icons/fa";

// Remplace par ton vrai App ID Agora (test App ID pour dev)
const APP_ID = "e2d6939f17b44bc8b272b748a0a1325e";
const CHANNEL = "chan1";
const TOKEN = null; // null si App ID en mode test

const TeleconsultationDemo = () => {
  const localVideoRef = useRef(null);
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Création du client Agora
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // Rejoindre le channel
        await client.join(APP_ID, CHANNEL, TOKEN, null);

        // Créer les tracks audio et vidéo
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: "480p_4",
        });

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Afficher la vidéo locale
        videoTrack.play(localVideoRef.current);

        // Publier les tracks
        await client.publish([audioTrack, videoTrack]);

        console.log("Téléconsultation initialisée avec succès !");
      } catch (err) {
        console.error("Erreur Agora:", err);
      }
    };

    init();

    return () => {
      // Nettoyage à la fermeture du composant
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  const toggleAudio = () => {
    if (!localAudioTrackRef.current) return;
    localAudioTrackRef.current.setEnabled(!audioEnabled);
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (!localVideoTrackRef.current) return;
    localVideoTrackRef.current.setEnabled(!videoEnabled);
    setVideoEnabled(!videoEnabled);
  };

  const leaveCall = () => {
    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    clientRef.current?.leave();
    alert("Vous avez quitté la téléconsultation");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", backgroundColor: "#000" }}>
      {/* Vidéo locale */}
      <div
        ref={localVideoRef}
        style={{
          position: "absolute",
          bottom: "100px",
          right: "20px",
          width: "300px",
          height: "225px",
          border: "2px solid #fff",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "14px",
        }}
      >
        {!videoEnabled && <span>Caméra désactivée</span>}
      </div>

      {/* Boutons flottants */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "20px",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "10px 20px",
          borderRadius: "30px",
          alignItems: "center",
        }}
      >
        <button
          onClick={toggleAudio}
          style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
        >
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>

        <button
          onClick={toggleVideo}
          style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
        >
          {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>

        <button
          onClick={leaveCall}
          style={{
            background: "#e74c3c",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            padding: "5px 15px",
            borderRadius: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaSignOutAlt /> Quitter
        </button>
      </div>
    </div>
  );
};

export default TeleconsultationDemo;
