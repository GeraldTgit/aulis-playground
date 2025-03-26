import React, { 
  useState, 
  useEffect, 
  useRef, 
  forwardRef, 
  useImperativeHandle,
  useCallback 
} from 'react';
import './Butterfly.css';

const Butterfly = forwardRef(({ initialPosition }, ref) => {
  const [butterflyImage, setButterflyImage] = useState('');
  const butterflyRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef(initialPosition || { x: 0, y: 0 });
  const velocityRef = useRef({ x: 2, y: 1 });
  const scaleRef = useRef(1);
  const scaleDirectionRef = useRef(1);

  useImperativeHandle(ref, () => ({
    getPosition: () => positionRef.current,
    getElement: () => butterflyRef.current
  }));

  const resetButterfly = useCallback(() => {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    setButterflyImage(`${process.env.PUBLIC_URL}/images/butterfly${randomNum}.gif`);
    
    if (!initialPosition) {
      positionRef.current = {
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100)
      };
    }
    
    velocityRef.current = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4
    };
  }, [initialPosition]);

  useEffect(() => {
    resetButterfly();
  }, [resetButterfly]);

  useEffect(() => {
    if (!butterflyRef.current) return;

    const animate = () => {
      const butterfly = butterflyRef.current;
      const { width: butterflyWidth, height: butterflyHeight } = butterfly.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      if (positionRef.current.x <= 0 || positionRef.current.x + butterflyWidth >= windowWidth) {
        velocityRef.current.x *= -1;
        scaleRef.current = velocityRef.current.x > 0 ? 1 : -1;
      }

      if (positionRef.current.y <= 0 || positionRef.current.y + butterflyHeight >= windowHeight) {
        velocityRef.current.y *= -1;
      }

      if (Math.random() < 0.02) {
        velocityRef.current.x = (Math.random() - 0.5) * 4;
      }
      if (Math.random() < 0.02) {
        velocityRef.current.y = (Math.random() - 0.5) * 4;
      }

      scaleDirectionRef.current *= -0.95;
      if (Math.abs(scaleDirectionRef.current) < 0.1) {
        scaleDirectionRef.current = Math.random() < 0.5 ? -1 : 1;
      }
      const scaleY = 1 + scaleDirectionRef.current * 0.1;

      butterfly.style.transform = `
        translate(${positionRef.current.x}px, ${positionRef.current.y}px)
        scaleX(${scaleRef.current})
        scaleY(${scaleY})
      `;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [butterflyImage]);

  if (!butterflyImage) return null;

  return (
    <img
      ref={butterflyRef}
      src={butterflyImage}
      alt="Butterfly"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100px',
        height: 'auto',
        zIndex: 10,
        pointerEvents: 'none',
        transition: 'transform 0.1s ease-out',
        transform: 'translate(0, 0)'
      }}
    />
  );
});

Butterfly.displayName = 'Butterfly';

export default Butterfly;