import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { teleconsultationAPI } from "../../services/api";
import { toast } from "react-toastify";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhone,
  FaUserMd,
  FaUser,
  FaFileMedical,
} from "react-icons/fa";
import "./TeleconsultationRoom.css";

// Import Agora RTC SDK
import AgoraRTC from "agora-rtc-sdk-ng";

function TeleconsultationRoom() {
  const { id } = useParams(); // Teleconsultation ID
  const navigate = useNavigate();
  const { user } = useAuth();

  // State variables
  const [teleconsultation, setTeleconsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isPatient, setIsPatient] = useState(false);

  // Video state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);

  // Agora RTC client and tracks
  const clientRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Check user role
  useEffect(() => {
    if (user) {
      setIsDoctor(user.role === "medecin");
      setIsPatient(user.role === "patient");
    }
  }, [user]);

  // Load teleconsultation details
  useEffect(() => {
    const loadTeleconsultation = async () => {
      try {
        setLoading(true);
        const response = await teleconsultationAPI.getTeleconsultation(id);
        setTeleconsultation(response.data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement de la téléconsultation");
        toast.error("Erreur lors du chargement de la téléconsultation");
        setLoading(false);
      }
    };

    if (id) {
      loadTeleconsultation();
    }
  }, [id]);

  // Initialize Agora client
  useEffect(() => {
    try {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    } catch (err) {
      console.error("Error initializing Agora client:", err);
      toast.error(
        "Erreur lors de l'initialisation du client vidéo. Veuillez vérifier votre connexion et réessayer."
      );
    }

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);

  // Join the call
  const joinCall = async () => {
    try {
      if (!teleconsultation) return;

      // Check if Agora App ID is configured
      const appId = process.env.REACT_APP_AGORA_APP_ID;
      if (!appId || appId === "your_agora_app_id_here") {
        toast.error(
          "Configuration manquante: Agora App ID non configuré. Veuillez contacter l'administrateur."
        );
        return;
      }

      // Check for media devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        if (videoDevices.length === 0) {
          toast.warn("Aucune caméra détectée. La vidéo sera désactivée.");
        }

        if (audioDevices.length === 0) {
          toast.warn("Aucun microphone détecté. L'audio sera désactivé.");
        }
      } catch (err) {
        console.warn("Could not enumerate media devices:", err);
      }

      // Get Agora token and channel info
      let tokenResponse;
      try {
        tokenResponse = await teleconsultationAPI.generateToken(id);
      } catch (err) {
        console.error("Error generating token:", err);
        if (err.response && err.response.data && err.response.data.error) {
          toast.error(
            "Erreur lors de la génération du jeton de connexion: " +
              err.response.data.error
          );
        } else {
          toast.error("Erreur lors de la génération du jeton de connexion");
        }
        return;
      }

      const { token, channel_name, uid } = tokenResponse.data;

      // Join the channel
      await clientRef.current.join(appId, channel_name, token, uid || null);

      // Create local tracks
      try {
        [localAudioTrackRef.current, localVideoTrackRef.current] =
          await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack(),
          ]);
      } catch (err) {
        console.error("Error creating local tracks:", err);
        toast.error(
          "Erreur lors de l'accès à la caméra ou au microphone. Veuillez vérifier les permissions."
        );
        return;
      }

      // Play local video
      localVideoTrackRef.current.play(localVideoRef.current);

      // Publish local tracks
      await clientRef.current.publish([
        localAudioTrackRef.current,
        localVideoTrackRef.current,
      ]);

      // Set up event listeners for remote tracks
      clientRef.current.on("user-published", async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);

        if (mediaType === "video") {
          const remoteTrack = user.videoTrack;
          remoteTrack.play(remoteVideoRef.current);
          remoteVideoTrackRef.current = remoteTrack;
        }

        if (mediaType === "audio") {
          const remoteTrack = user.audioTrack;
          remoteTrack.play();
        }
      });

      // Handle user leaving
      clientRef.current.on("user-left", (user) => {
        if (remoteVideoTrackRef.current) {
          remoteVideoTrackRef.current.stop();
          remoteVideoTrackRef.current = null;
        }
      });

      setIsInCall(true);
      toast.success("Connexion à la téléconsultation réussie");
    } catch (err) {
      console.error("Error joining call:", err);
      toast.error(
        "Erreur lors de la connexion à la téléconsultation: " +
          (err.response?.data?.detail || err.message || "Erreur inconnue")
      );
    }
  };

  // Leave the call
  const leaveCall = async () => {
    try {
      // Stop and close local tracks
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // Stop remote tracks
      if (remoteVideoTrackRef.current) {
        remoteVideoTrackRef.current.stop();
        remoteVideoTrackRef.current = null;
      }

      // Leave the channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      setIsInCall(false);
      toast.success("Téléconsultation terminée");
    } catch (err) {
      console.error("Error leaving call:", err);
      toast.error("Erreur lors de la fin de la téléconsultation");
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // End teleconsultation
  const handleEndTeleconsultation = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir terminer cette téléconsultation ?"
      )
    ) {
      try {
        // Leave the call first if in progress
        if (isInCall) {
          await leaveCall();
        }

        // End the teleconsultation on the server
        await teleconsultationAPI.endTeleconsultation(id);
        toast.success("Téléconsultation terminée avec succès");
        navigate(
          isDoctor ? "/medecin/consultations" : "/patient/consultations"
        );
      } catch (err) {
        toast.error("Erreur lors de la fin de la téléconsultation");
      }
    }
  };

  if (loading) {
    return (
      <div className="teleconsultation-room">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de la téléconsultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teleconsultation-room">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teleconsultation-room">
      {/* Header */}
      <div className="teleconsultation-header">
        <div className="header-info">
          <h2>Téléconsultation en direct</h2>
          <div className="teleconsultation-details">
            <div className="detail-item">
              <FaUserMd className="detail-icon" />
              <span>
                {isDoctor
                  ? `${teleconsultation?.consultation_details?.patient?.user?.first_name} ${teleconsultation?.consultation_details?.patient?.user?.last_name}`
                  : `Dr. ${teleconsultation?.consultation_details?.medecin?.user?.first_name} ${teleconsultation?.consultation_details?.medecin?.user?.last_name}`}
              </span>
            </div>
            <div className="detail-item">
              <FaFileMedical className="detail-icon" />
              <span>
                {teleconsultation?.consultation_details?.date} à{" "}
                {teleconsultation?.consultation_details?.heure}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`btn ${
              isVideoEnabled ? "btn-success" : "btn-secondary"
            }`}
            onClick={toggleVideo}
            disabled={!isInCall}
          >
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />} Vidéo
          </button>
          <button
            className={`btn ${isAudioEnabled ? "btn-info" : "btn-secondary"}`}
            onClick={toggleAudio}
            disabled={!isInCall}
          >
            {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />} Audio
          </button>
          {!isInCall ? (
            <button className="btn btn-success" onClick={joinCall}>
              <FaPhone /> Rejoindre l'appel
            </button>
          ) : (
            <button className="btn btn-danger" onClick={leaveCall}>
              <FaPhone /> Quitter l'appel
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={handleEndTeleconsultation}
          >
            <FaPhone /> Terminer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="teleconsultation-content">
        {/* Video Container */}
        <div className="video-container">
          {/* Remote Video */}
          <div className="remote-video-container">
            <div ref={remoteVideoRef} className="remote-video" />
            <div className="remote-video-overlay">
              {isDoctor
                ? `${teleconsultation?.consultation_details?.patient?.user?.first_name} ${teleconsultation?.consultation_details?.patient?.user?.last_name}`
                : `Dr. ${teleconsultation?.consultation_details?.medecin?.user?.first_name} ${teleconsultation?.consultation_details?.medecin?.user?.last_name}`}
            </div>
          </div>

          {/* Local Video */}
          <div className="local-video-container">
            <div ref={localVideoRef} className="local-video" />
            <div className="local-video-overlay">
              {isDoctor
                ? `Dr. ${teleconsultation?.consultation_details?.medecin?.user?.first_name} ${teleconsultation?.consultation_details?.medecin?.user?.last_name}`
                : `${teleconsultation?.consultation_details?.patient?.user?.first_name} ${teleconsultation?.consultation_details?.patient?.user?.last_name}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeleconsultationRoom;
