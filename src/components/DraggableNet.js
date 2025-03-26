import React, { 
  useState, 
  useRef, 
  useEffect, 
  forwardRef, 
  useImperativeHandle,
  useCallback 
} from 'react';

const DraggableNet = forwardRef(({ butterflyRef, onCatch }, ref) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState('right');
  const netRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dimensions = { width: 200, height: 200 };

  useImperativeHandle(ref, () => ({
    getElement: () => netRef.current
  }));

  useEffect(() => {
    const centerX = window.innerWidth / 2 - dimensions.width / 2;
    const centerY = window.innerHeight / 2 - dimensions.height / 2;
    setPosition({ x: centerX, y: centerY });
  }, [dimensions.width, dimensions.height]);

  const checkCollision = useCallback(() => {
    if (!butterflyRef?.current || !netRef.current) return false;
    
    const butterfly = butterflyRef.current.getElement();
    const butterflyPos = butterflyRef.current.getPosition();
    const net = netRef.current;
    
    const butterflyRect = {
      left: butterflyPos.x,
      top: butterflyPos.y,
      right: butterflyPos.x + butterfly.offsetWidth,
      bottom: butterflyPos.y + butterfly.offsetHeight
    };
    
    const netRect = {
      left: position.x,
      top: position.y,
      right: position.x + net.offsetWidth,
      bottom: position.y + net.offsetHeight
    };
    
    const isColliding = !(
      butterflyRect.right < netRect.left ||
      butterflyRect.left > netRect.right ||
      butterflyRect.bottom < netRect.top ||
      butterflyRect.top > netRect.bottom
    );
    
    return isColliding;
  }, [butterflyRef, position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;
      
      setDirection(newX > position.x ? 'right' : 'left');
      setPosition({ x: newX, y: newY });

      // Check for collision on every move
      if (checkCollision()) {
        onCatch();
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position.x, checkCollision, onCatch]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = netRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const netImage = direction === 'left' 
    ? `${process.env.PUBLIC_URL}/images/catching_net_left.png`
    : `${process.env.PUBLIC_URL}/images/catching_net_right.png`;

  return (
    <img
      ref={netRef}
      src={netImage}
      alt="Catching net"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 20,
        userSelect: 'none',
        transition: 'transform 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
    />
  );
});

DraggableNet.displayName = 'DraggableNet';

export default DraggableNet;