import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import DraggableNet from './components/DraggableNet';
import Butterfly from './components/Butterfly';

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [caughtCount, setCaughtCount] = useState(0);
  const [butterflyKey, setButterflyKey] = useState(0);
  const [releasedButterflies, setReleasedButterflies] = useState([]);
  const butterflyRef = useRef(null);
  const netRef = useRef(null);
  const cageRef = useRef(null);

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
        x: window.innerWidth - 100, // Start from right side (near cage)
        y: window.innerHeight - 100 // Start from bottom (near cage)
      });
    }
    
    setReleasedButterflies(newButterflies);
    setCaughtCount(0); // Reset counter after release
  }, [caughtCount]);

  return (
    <div className="App">
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
    </div>
  );
}

export default App;