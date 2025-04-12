import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AudioPlayer = () => {
  // Refs and State
  const audioRef = useRef(null); // Reference to the audio element
  const [isMuted, setIsMuted] = useState(false); // Tracks if audio is muted
  const [isPlaying, setIsPlaying] = useState(false); // Tracks if audio is currently playing
  const [volume, setVolume] = useState(0.3); // Current volume level

  // Refs to hold latest values for use inside effects
  const isMutedRef = useRef(isMuted);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);

  // Keep refs in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Setup background music and autoplay logic
  useEffect(() => {
    // Create a new audio element
    const audio = new Audio(
      `${process.env.PUBLIC_URL}/audio/joy-happiness-and-pleasurea-happy-xylophoneclarinet-264006.mp3`
    );
    audio.loop = true; // Loop the audio
    audio.volume = volumeRef.current; // Set initial volume
    audioRef.current = audio;

    // Play audio once user clicks anywhere
    const playAudio = () => {
      if (!isPlayingRef.current) {
        audio.play().then(() => {
          audio.muted = isMutedRef.current;
          audio.volume = volumeRef.current;
          setIsPlaying(true);
        });
      }
    };

    window.addEventListener("click", playAudio, { once: true }); // Listen once

    return () => {
      window.removeEventListener("click", playAudio); // Clean up
    };
  }, []); // Run only once on mount

  // Toggle mute/unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    }
  };

  // Handle volume slider changes
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;

    if (audio) {
      audio.volume = newVolume;
      audio.muted = newVolume === 0; // Auto-mute if volume is 0
    }

    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  return (
    <div className="audio-player">
      {/* Label */}
      <span className="sound-note">Better with sound 🔊</span>

      {/* Mute/unmute button */}
      <button onClick={toggleMute}>
        {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="volume-slider"
      />
    </div>
  );
};

export default AudioPlayer;
