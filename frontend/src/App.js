import React, { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";
import DraggableNet from "./components/DraggableNet";
import Butterfly from "./components/Butterfly";
import AudioPlayer from "./components/AudioPlayer";
import confetti from "canvas-confetti";

function App() {
  // State management
  const [showPopup, setShowPopup] = useState(false); // Controls popup visibility
  const [caughtCount, setCaughtCount] = useState(0); // Tracks caught butterflies
  const [butterflyKey, setButterflyKey] = useState(0); // Key to reset butterfly
  const [releasedButterflies, setReleasedButterflies] = useState([]); // Stores released butterflies
  const [players, setPlayers] = useState([]); // Leaderboard data
  const [name, setName] = useState(""); // Player name
  const [isEditing, setIsEditing] = useState(false); // Name edit mode
  const [isSaving, setIsSaving] = useState(false); // Saving state
  const [error, setError] = useState(null); // Error messages

  // Refs for DOM elements
  const butterflyRef = useRef(null); // Reference to butterfly component
  const netRef = useRef(null); // Reference to net component
  const cageRef = useRef(null); // Reference to cage element

  // API configuration
  const API_BASE = process.env.REACT_APP_API_BASE;
  const LEADERBOARD_URL = `${API_BASE}/`;
  const SAVE_SESSION_URL = `${API_BASE}/save-session`;

  // SFX
  const sfx_coinRef = useRef(
    new Audio(`${process.env.PUBLIC_URL}/sfx/super-mario-bros-coin.mp3`)
  );
  const sfx_yeheyRef = useRef(
    new Audio(
      `${process.env.PUBLIC_URL}/sfx/yehey-clap-sound-effect-awarding.mp3`
    )
  );

  /**
   * Checks if API base URL is configured
   */
  useEffect(() => {
    if (!process.env.REACT_APP_API_BASE) {
      console.warn(
        "REACT_APP_API_BASE is not set. Using fallback URL:",
        API_BASE
      );
    }
  }, [API_BASE]);

  /**
   * Fetches leaderboard data with retry logic
   */
  const fetchPlayers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(LEADERBOARD_URL, {
        headers: { "Content-Type": "application/json" },
        mode: "cors",
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      // Handle different response formats
      let playersData = [];
      if (Array.isArray(data)) {
        playersData = data;
      } else if (data && Array.isArray(data.data)) {
        playersData = data.data;
      }

      setPlayers(playersData);
    } catch (err) {
      console.error("Failed to fetch players:", err);
      setError(err.message || "Failed to load leaderboard");
      setPlayers([]);
      setTimeout(fetchPlayers, 5000); // Retry after 5 seconds
    }
  }, [LEADERBOARD_URL]);

  // Initial data load
  useEffect(() => {
    fetchPlayers();
    return () => {
      // Cleanup if needed
    };
  }, [fetchPlayers]);

  /**
   * Checks backend health status
   */
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const result = await response.json();

        if (!response.ok || result.status !== "healthy") {
          throw new Error("Backend is unhealthy");
        }

        console.log("✅ Backend healthy:", result);
      } catch (err) {
        console.error("❌ Backend health check failed:", err);
        setError("Unable to connect to backend. Please try again later.");
      }
    };

    checkHealth();
  }, [API_BASE]);

  /**
   * Saves the current game session to the backend
   */
  const saveSession = useCallback(async () => {
    if (!name || caughtCount === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(SAVE_SESSION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          caught_butterflies: caughtCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const result = await response.json();
      const updatedLeaderboard = Array.isArray(result.leaderboard)
        ? result.leaderboard
        : [];
      setPlayers(updatedLeaderboard);
      return result;
    } catch (err) {
      console.error("Failed to save session:", err);
      setError(err.message || "Failed to save your score");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [name, caughtCount, SAVE_SESSION_URL]);

  /**
   * Handles butterfly catch event
   * - Shows popup
   * - Increments counter
   * - Resets butterfly after delay
   */
  const handleCatch = useCallback(() => {
    if (!showPopup) {
      sfx_coinRef.current.play();
      setShowPopup(true);
      setCaughtCount((prev) => prev + 1);
      setTimeout(() => {
        setShowPopup(false);
        setButterflyKey((prev) => prev + 1);
      }, 2000);
    }
  }, [showPopup]);

  /**
   * Releases all caught butterflies from the cage
   * - Saves session first
   * - Creates new butterfly instances with random flight patterns
   */
  const releaseButterflies = useCallback(async () => {
    if (caughtCount === 0 || !cageRef.current) return;

    try {
      await saveSession();

      // Trigger confetti explosion
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          "#ff0000",
          "#00ff00",
          "#0000ff",
          "#ffff00",
          "#ff00ff",
          "#00ffff",
        ],
      });

      // Trigger yehey sound effect
      sfx_yeheyRef.current.play();

      // Extra null check just before using the ref
      if (!cageRef.current) {
        console.warn("Cage ref is null at the time of release");
        return;
      }

      // Calculate release position from cage center
      const cageRect = cageRef.current.getBoundingClientRect();
      const startX = cageRect.left + cageRect.width / 2;
      const startY = cageRect.top + cageRect.height / 2;

      // Create new butterflies with random flight patterns
      const newButterflies = Array.from({ length: caughtCount }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;

        return {
          id: Date.now() + i,
          initialPosition: {
            x: startX + (Math.random() - 0.5) * 30,
            y: startY + (Math.random() - 0.5) * 30,
          },
          initialVelocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
        };
      });

      setReleasedButterflies(newButterflies);
      setCaughtCount(0);
    } catch (err) {
      console.error("Error in releaseButterflies:", err);
    }
  }, [caughtCount, saveSession]);

  return (
    <div className="App">
      {/**Audio Player */}
      <AudioPlayer />

      {/* Connection status indicator */}
      <div className="connection-status">
        {error ? "🔴 Connection Issues" : "🟢 Connected"}
      </div>

      {/* Name input/edit section */}
      <div className="editable-label">
        {isEditing ? (
          <>
            <input
              autoFocus
              type="text"
              placeholder="Input your name here"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              className="editable-input"
              maxLength="20"
            />
            <img
              src={`${process.env.PUBLIC_URL}/images/save.png`}
              alt="Save"
              className="pencil-icon"
              onClick={() => setIsEditing(false)}
              style={{ cursor: "pointer" }}
            />
          </>
        ) : (
          <>
            <span onClick={() => setIsEditing(true)} className="editable-text">
              {name ? (
                `Hello ${name}!`
              ) : (
                <span className="placeholder">Click to add your name</span>
              )}
            </span>
            <img
              src={`${process.env.PUBLIC_URL}/images/pencil.png`}
              alt="Edit"
              className="pencil-icon"
              onClick={() => setIsEditing(true)}
              style={{ cursor: "pointer" }}
            />
          </>
        )}
      </div>

      {/* Game title and instructions */}
      <div className="top-left-label">Auliria's Playmates</div>
      <div className="top-left-label2">Top 10 butterfly catchers!</div>

      {/* Caught butterflies counter */}
      <div className="butterfly-counter">
        <span className="counter-number">{caughtCount} 🦋</span>
        {/* Cage for caught butterflies */}
        <div
          className="cage"
          ref={cageRef}
          onClick={releaseButterflies}
          style={{ cursor: caughtCount > 0 ? "pointer" : "default" }}
        >
          {isSaving && <div className="saving-indicator">Saving...</div>}
          <span className="tooltiptext">Open the cage!</span>
        </div>
        {/* Decorative butterfly image */}
        <div className="cartoon_butterfly"></div>
      </div>

      {/* Catch success popup - now with responsive sizing */}
      {showPopup && (
        <div className="popup-overlay">
          <img
            src={`${process.env.PUBLIC_URL}/images/gotchaa.png`}
            alt="Caught!"
            className="popup-image"
          />
        </div>
      )}

      {/* Main butterfly to catch */}
      <Butterfly key={butterflyKey} ref={butterflyRef} />

      {/* Released butterflies flying freely */}
      {releasedButterflies.map((butterfly) => (
        <Butterfly
          key={butterfly.id}
          initialPosition={butterfly.initialPosition}
          initialVelocity={butterfly.initialVelocity}
        />
      ))}

      {/* Player-controlled net */}
      <DraggableNet
        ref={netRef}
        butterflyRef={butterflyRef}
        onCatch={handleCatch}
      />

      {/* Leaderboard display */}
      <div className="players-list">
        <div className="player-data">
          {error ? (
            <p className="error-message">{error}</p>
          ) : players.length === 0 ? (
            <p>No players yet. Be the first!</p>
          ) : (
            players.map((player, index) => (
              <div key={`${player.username}-${index}`} className="player">
                <span className="player-rank">{index + 1}.</span>
                <span className="player-name">
                  {player.username || "Anonymous"}
                </span>
                <span className="player-score">
                  {" "}
                  — {player.caught_butterflies || 0}{" "}
                  <span role="img" aria-label="butterflies">
                    🦋
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
