import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AudioPlayer = () => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // ✅ Start at 50%

  useEffect(() => {
    const audio = new Audio(
      `${process.env.PUBLIC_URL}/audio/joy-happiness-and-pleasurea-happy-xylophoneclarinet-264006.mp3`
    );
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playAudio = () => {
      if (!isPlaying) {
        audio.play().then(() => {
          audio.muted = isMuted;
          audio.volume = volume;
          setIsPlaying(true);
        });
      }
    };

    window.addEventListener("click", playAudio, { once: true });

    return () => {
      window.removeEventListener("click", playAudio);
    };
  }, []); // ✅ Only run once on mount

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      audio.muted = newVolume === 0;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  return (
    <div className="audio-player">
      <span className="sound-note">Better with sound 🔊</span>
      <button onClick={toggleMute}>
        {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
      </button>
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
