import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import "./Butterfly.css";

/**
 * Butterfly component that renders an animated butterfly that moves around the screen
 * with natural fluttering motion. Can be controlled via refs and accepts initial position/velocity props.
 */
const Butterfly = forwardRef(({ initialPosition, initialVelocity }, ref) => {
  // State for storing the current butterfly image
  const [butterflyImage, setButterflyImage] = useState("");

  // Refs for DOM access and animation control
  const butterflyRef = useRef(null); // Reference to the butterfly image element
  const animationRef = useRef(null); // Reference to the animation frame
  const positionRef = useRef(initialPosition || { x: 0, y: 0 }); // Current position
  const velocityRef = useRef(initialVelocity || { x: 2, y: 1 }); // Current velocity
  const scaleRef = useRef(1); // Current horizontal scale (for flipping)
  const scaleDirectionRef = useRef(1); // Current vertical scale direction (for fluttering)
  const isMobile = window.innerWidth <= 768; // Flag for mobile devices
  const isMountedRef = useRef(false); // Flag to track component mount status

  /**
   * Expose methods to parent components via ref
   */
  useImperativeHandle(ref, () => ({
    // Returns current position of the butterfly
    getPosition: () => positionRef.current,
    // Returns the DOM element of the butterfly
    getElement: () => butterflyRef.current,
  }));

  /**
   * Resets the butterfly's position, velocity, and appearance
   * - Randomly selects a butterfly image
   * - Sets random initial position if none provided
   * - Sets random velocity if none provided
   */
  const resetButterfly = useCallback(() => {
    // Select random butterfly image (1-10)
    const randomNum = Math.floor(Math.random() * 10) + 1;
    setButterflyImage(
      `${process.env.PUBLIC_URL}/images/butterfly${randomNum}.gif`
    );

    // Set random starting position if none provided
    if (!initialPosition) {
      positionRef.current = {
        x: Math.random() * (window.innerWidth - (isMobile ? 60 : 100)),
        y: Math.random() * (window.innerHeight - (isMobile ? 60 : 100)),
      };
    }

    // Set random velocity if none provided
    if (!initialVelocity) {
      velocityRef.current = {
        x: (Math.random() - 0.5) * (isMobile ? 3 : 4),
        y: (Math.random() - 0.5) * (isMobile ? 3 : 4),
      };
    }
  }, [initialPosition, initialVelocity, isMobile]);

  /**
   * Component mount/unmount lifecycle
   * - Sets mounted flag to true
   * - Resets butterfly state on mount
   * - Cleans up by setting mounted flag to false on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;
    resetButterfly();
    return () => {
      isMountedRef.current = false;
    };
  }, [resetButterfly]);

  /**
   * Animation effect
   * - Runs only when butterflyImage changes
   * - Handles the butterfly's movement and animation
   * - Cleans up animation frame on unmount
   */
  useEffect(() => {
    // Don't start animation if no image is loaded
    if (!butterflyImage) return;

    /**
     * Animation frame callback
     * - Updates butterfly position based on velocity
     * - Handles screen edge bouncing
     * - Adds random velocity changes for natural movement
     * - Applies fluttering animation via scale transforms
     */
    const animate = () => {
      // Stop animation if component unmounted or no DOM element
      if (!isMountedRef.current || !butterflyRef.current) {
        cancelAnimationFrame(animationRef.current);
        return;
      }

      const butterfly = butterflyRef.current;
      if (!butterfly) return;

      // Get current dimensions and position
      const butterflyRect = butterfly.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Update position based on velocity
      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      // Bounce off horizontal edges (left/right of screen)
      if (
        positionRef.current.x <= 0 ||
        positionRef.current.x + butterflyRect.width >= windowWidth
      ) {
        velocityRef.current.x *= -1; // Reverse horizontal direction
        scaleRef.current = velocityRef.current.x > 0 ? 1 : -1; // Flip sprite
      }

      // Bounce off vertical edges (top/bottom of screen)
      if (
        positionRef.current.y <= 0 ||
        positionRef.current.y + butterflyRect.height >= windowHeight
      ) {
        velocityRef.current.y *= -1; // Reverse vertical direction
      }

      // Random velocity changes for natural movement
      if (Math.random() < 0.02) {
        velocityRef.current.x = (Math.random() - 0.5) * (isMobile ? 3 : 4);
      }
      if (Math.random() < 0.02) {
        velocityRef.current.y = (Math.random() - 0.5) * (isMobile ? 3 : 4);
      }

      // Fluttering animation using scaleY
      scaleDirectionRef.current *= -0.95;
      if (Math.abs(scaleDirectionRef.current) < 0.1) {
        scaleDirectionRef.current = Math.random() < 0.5 ? -1 : 1;
      }
      const scaleY = 1 + scaleDirectionRef.current * 0.1;

      // Apply all transforms
      butterfly.style.transform = `
        translate(${positionRef.current.x}px, ${positionRef.current.y}px)
        scaleX(${scaleRef.current})
        scaleY(${scaleY})
      `;

      // Request next animation frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup: cancel animation frame when effect ends
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [butterflyImage, isMobile]);

  // Don't render anything until image is loaded
  if (!butterflyImage) return null;

  // Render the butterfly image with all necessary styles
  return (
    <img
      ref={butterflyRef}
      src={butterflyImage}
      alt="Butterfly"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: isMobile ? "60px" : "100px",
        height: "auto",
        zIndex: 10,
        pointerEvents: "none", // Prevent butterfly from intercepting mouse events
        transition: "transform 0.1s ease-out",
        transform: "translate(0, 0)",
        touchAction: "none", // Important for touch devices
      }}
    />
  );
});

Butterfly.displayName = "Butterfly";

export default Butterfly;
