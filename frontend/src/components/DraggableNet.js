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
  const dimensions = useRef({
    width: window.innerWidth < 768 ? 120 : 200,
    height: window.innerWidth < 768 ? 120 : 200
  });

  useImperativeHandle(ref, () => ({
    getElement: () => netRef.current
  }));

  useEffect(() => {
    const handleResize = () => {
      dimensions.current = {
        width: window.innerWidth < 768 ? 120 : 200,
        height: window.innerWidth < 768 ? 120 : 200
      };
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const centerX = window.innerWidth / 2 - dimensions.current.width / 2;
    const centerY = window.innerHeight / 2 - dimensions.current.height / 2;
    setPosition({ x: centerX, y: centerY });
  }, [dimensions.current.width, dimensions.current.height]);

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

  const handleMove = useCallback((clientX, clientY) => {
    const newX = clientX - offsetRef.current.x;
    const newY = clientY - offsetRef.current.y;
    
    setDirection(newX > position.x ? 'right' : 'left');
    setPosition({ x: newX, y: newY });

    if (checkCollision()) {
      onCatch();
    }
  }, [position.x, checkCollision, onCatch]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = netRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = netRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [isDragging, handleMove]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMove, handleTouchMove]);

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
        width: `${dimensions.current.width}px`,
        height: `${dimensions.current.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 20,
        userSelect: 'none',
        touchAction: 'none',
        transition: 'transform 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    />
  );
});

DraggableNet.displayName = 'DraggableNet';

export default DraggableNet;