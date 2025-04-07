import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import DraggableNet from './components/DraggableNet';
import Butterfly from './components/Butterfly'; 

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [caughtCount, setCaughtCount] = useState(0);
  const [butterflyKey, setButterflyKey] = useState(0);
  const [releasedButterflies, setReleasedButterflies] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [players, setPlayers] = useState([]); // State to store player data
  const butterflyRef = useRef(null);
  const netRef = useRef(null);
  const cageRef = useRef(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch players' data from the backend
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched data:', data);  // Log the data to check the structure
        setPlayers(data.data); // Set the player data in state
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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

  const releaseButterflies = useCallback(() => {
    if (caughtCount === 0) return;
    
    const newButterflies = [];
    for (let i = 0; i < caughtCount; i++) {
      newButterflies.push({
        id: Date.now() + i,
        x: window.innerWidth - (isMobile ? 80 : 100),
        y: window.innerHeight - (isMobile ? 80 : 100)
      });
    }
    
    setReleasedButterflies(newButterflies);
    setCaughtCount(0);
  }, [caughtCount, isMobile]);

  return (
    <div className="App">
      <div className="editable-label">
        {isEditing ? (
          <>
            <input
              autoFocus
              type="text"
              placeholder="Input your name here"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="editable-input"
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
              {name ? `Hello ${name}!` : <span className="placeholder">Input your name here..</span>}
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
      <div className="top-left-label2">Top 10 butterfly catchers yey!</div>
      <div className="cartoon_butterfly"></div>
      <div 
        className="cage" 
        ref={cageRef}
        onClick={releaseButterflies}
        style={{ cursor: 'pointer' }}
      ></div>
      <div className="butterfly-counter">
        <span className="counter-number">{caughtCount}</span>
        <span className="counter-label">Butterflies Caught</span>
      </div>
      
      {showPopup && (
        <div className="popup-overlay">
          <img 
            src={`${process.env.PUBLIC_URL}/images/gotchaa.png`} 
            alt="Caught!" 
            className="popup-image"
          />
        </div>
      )}
      
      <Butterfly key={butterflyKey} ref={butterflyRef} />
      
      {releasedButterflies.map((butterfly) => (
        <Butterfly 
          key={butterfly.id}
          initialPosition={{ x: butterfly.x, y: butterfly.y }}
        />
      ))}
      
      <DraggableNet 
        ref={netRef} 
        butterflyRef={butterflyRef} 
        onCatch={handleCatch} 
      />

      {/* Display player data */}
      <div className="players-list">
        <div className="player-data">
          {players.length === 0 ? (
            <p>Loading player data...</p>
          ) : (
            players.map((player, index) => (
              <div key={index} className="players">
                {player.username} — {player.caught_butterflies} <span role="img" aria-label="butterflies">🦋</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
