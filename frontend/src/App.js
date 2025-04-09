import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import DraggableNet from './components/DraggableNet';
import Butterfly from './components/Butterfly';

function App() {
  // State management
  const [showPopup, setShowPopup] = useState(false);
  const [caughtCount, setCaughtCount] = useState(0);
  const [butterflyKey, setButterflyKey] = useState(0);
  const [releasedButterflies, setReleasedButterflies] = useState([]);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const butterflyRef = useRef(null);
  const netRef = useRef(null);
  const cageRef = useRef(null);

  // API endpoints
  const API_BASE = 'http://localhost:8000';
  const LEADERBOARD_URL = `${API_BASE}/`;
  const SAVE_SESSION_URL = `${API_BASE}/save-session`;

  // Fetch leaderboard data
  const fetchPlayers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(LEADERBOARD_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      console.error('Failed to fetch players:', err);
      setError('Failed to load leaderboard');
      setPlayers([]);
    }
  }, [LEADERBOARD_URL]); // Added LEADERBOARD_URL as dependency

  // Initial data load
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Save session to backend
  const saveSession = useCallback(async () => {
    if (!name || caughtCount === 0) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(SAVE_SESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name,
          caught_butterflies: caughtCount
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const updatedLeaderboard = Array.isArray(result.leaderboard) ? result.leaderboard : [];
      setPlayers(updatedLeaderboard);
    } catch (err) {
      console.error('Failed to save session:', err);
      setError('Failed to save your score');
    } finally {
      setIsSaving(false);
    }
  }, [name, caughtCount, SAVE_SESSION_URL]); // Added SAVE_SESSION_URL as dependency

  // Handle butterfly catch
  const handleCatch = useCallback(() => {
    if (!showPopup) {
      setShowPopup(true);
      setCaughtCount(prev => prev + 1);
      setTimeout(() => {
        setShowPopup(false);
        setButterflyKey(prev => prev + 1);
      }, 2000);
    }
  }, [showPopup]);

  // Release butterflies from cage position with natural animation
  const releaseButterflies = useCallback(() => {
    if (caughtCount === 0 || !cageRef.current) return;
    
    saveSession();
    
    // Get cage position and dimensions
    const cageRect = cageRef.current.getBoundingClientRect();
    const startX = cageRect.left + cageRect.width / 2;
    const startY = cageRect.top + cageRect.height / 2;
    
    // Create butterflies with natural flight patterns
    const newButterflies = Array.from({ length: caughtCount }, (_, i) => {
      // Random angle for flight direction
      const angle = Math.random() * Math.PI * 2;
      // Random speed between 2-5
      const speed = 2 + Math.random() * 3;
      
      return {
        id: Date.now() + i,
        initialPosition: { 
          x: startX + (Math.random() - 0.5) * 30, // Small random offset from center
          y: startY + (Math.random() - 0.5) * 30
        },
        initialVelocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        }
      };
    });
    
    setReleasedButterflies(newButterflies);
    setCaughtCount(0);
  }, [caughtCount, saveSession]);

  return (
    <div className="App">
      {/* Header Section */}
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
              style={{ cursor: 'pointer' }}
            />
          </>
        ) : (
          <>
            <span onClick={() => setIsEditing(true)} className="editable-text">
              {name ? `Hello ${name}!` : <span className="placeholder">Click to add your name</span>}
            </span>
            <img
              src={`${process.env.PUBLIC_URL}/images/pencil.png`}
              alt="Edit"
              className="pencil-icon"
              onClick={() => setIsEditing(true)}
              style={{ cursor: 'pointer' }}
            />
          </>
        )}
      </div>

      <div className="top-left-label">Auliria's Playmates</div>
      <div className="top-left-label2">Top 10 butterfly catchers!</div>

      {/* Game Elements */}
      <div className="cartoon_butterfly"></div>
      
      <div 
        className="cage" 
        ref={cageRef}
        onClick={releaseButterflies}
        style={{ cursor: caughtCount > 0 ? 'pointer' : 'default' }}
      >
        {isSaving && <div className="saving-indicator">Saving...</div>}
        {caughtCount > 0 && (
          <div className="cage-count">{caughtCount}</div>
        )}
      </div>
      
      <div className="butterfly-counter">
        <span className="counter-number">{caughtCount}</span>
        <span className="counter-label">Butterflies Caught</span>
      </div>
      
      {/* Popup */}
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
      
      {/* Released butterflies */}
      {releasedButterflies.map((butterfly) => (
        <Butterfly 
          key={butterfly.id}
          initialPosition={butterfly.initialPosition}
          initialVelocity={butterfly.initialVelocity}
        />
      ))}
      
      <DraggableNet 
        ref={netRef} 
        butterflyRef={butterflyRef} 
        onCatch={handleCatch} 
      />

      {/* Leaderboard */}
      <div className="players-list">
        <div className="player-data">
          {error ? (
            <p className="error-message">{error}</p>
          ) : players.length === 0 ? (
            <p>No players yet. Be the first!</p>
          ) : (
            players.map((player, index) => (
              <div key={`${player.username} - ${index}`} className="player">
                <span className="player-rank">{index + 1}.</span>
                <span className="player-name">{player.username || 'Anonymous'}</span>
                <span className="player-score">
                  {' '}—{' '} {/* Added space-dash-space separator */}
                  {player.caught_butterflies || 0} <span role="img" aria-label="butterflies">🦋</span>
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