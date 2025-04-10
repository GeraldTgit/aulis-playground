import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";

/**
 * DraggableNet component that allows users to catch butterflies by dragging a net
 * Features:
 * - Draggable with mouse or touch
 * - Direction flipping based on movement
 * - Collision detection with butterfly
 * - Responsive sizing
 */
const DraggableNet = forwardRef(({ butterflyRef, onCatch }, ref) => {
  // State for tracking net position and dragging status
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState("right"); // 'left' or 'right'

  // Refs for DOM access and persistent values
  const netRef = useRef(null); // Reference to the net DOM element
  const offsetRef = useRef({ x: 0, y: 0 }); // Stores mouse offset when dragging starts
  const dimensions = useRef({
    width: window.innerWidth < 768 ? 120 : 200, // Responsive dimensions
    height: window.innerWidth < 768 ? 120 : 200,
  });

  /**
   * Expose methods to parent components via ref
   */
  useImperativeHandle(ref, () => ({
    // Returns the net DOM element
    getElement: () => netRef.current,
  }));

  /**
   * Handles window resize events to update net dimensions
   */
  useEffect(() => {
    const handleResize = () => {
      dimensions.current = {
        width: window.innerWidth < 768 ? 120 : 200,
        height: window.innerWidth < 768 ? 120 : 200,
      };
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Centers the net when component mounts or dimensions change
   */
  useEffect(() => {
    const centerX = window.innerWidth / 2 - dimensions.current.width / 2;
    const centerY = window.innerHeight / 2 - dimensions.current.height / 2;
    setPosition({ x: centerX, y: centerY });
  }, [dimensions.current.width, dimensions.current.height]);

  /**
   * Checks for collision between net and butterfly
   * @returns {boolean} True if collision detected
   */
  const checkCollision = useCallback(() => {
    if (!butterflyRef?.current || !netRef.current) return false;

    // Get butterfly position and dimensions
    const butterfly = butterflyRef.current.getElement();
    const butterflyPos = butterflyRef.current.getPosition();

    // Define bounding rectangles for collision detection
    const butterflyRect = {
      left: butterflyPos.x,
      top: butterflyPos.y,
      right: butterflyPos.x + butterfly.offsetWidth,
      bottom: butterflyPos.y + butterfly.offsetHeight,
    };

    const netRect = {
      left: position.x,
      top: position.y,
      right: position.x + netRef.current.offsetWidth,
      bottom: position.y + netRef.current.offsetHeight,
    };

    // Check for rectangle overlap
    const isColliding = !(
      butterflyRect.right < netRect.left ||
      butterflyRect.left > netRect.right ||
      butterflyRect.bottom < netRect.top ||
      butterflyRect.top > netRect.bottom
    );

    return isColliding;
  }, [butterflyRef, position]);

  /**
   * Handles net movement during drag
   * @param {number} clientX - Current mouse/touch X position
   * @param {number} clientY - Current mouse/touch Y position
   */
  const handleMove = useCallback(
    (clientX, clientY) => {
      // Calculate new position accounting for initial offset
      const newX = clientX - offsetRef.current.x;
      const newY = clientY - offsetRef.current.y;

      // Flip net direction based on movement
      setDirection(newX > position.x ? "right" : "left");
      setPosition({ x: newX, y: newY });

      // Check for collision with butterfly
      if (checkCollision()) {
        onCatch();
      }
    },
    [position.x, checkCollision, onCatch]
  );

  /**
   * Handles mouse down event (start of drag)
   * @param {Object} e - Mouse event
   */
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = netRef.current.getBoundingClientRect();
    // Store offset from mouse to net corner
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  /**
   * Handles touch start event (mobile drag start)
   * @param {Object} e - Touch event
   */
  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = netRef.current.getBoundingClientRect();
    // Store offset from touch to net corner
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }, []);

  /**
   * Handles touch move event (mobile dragging)
   * @param {Object} e - Touch event
   */
  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent page scroll
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [isDragging, handleMove]
  );

  /**
   * Sets up and cleans up event listeners for dragging
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = () => setIsDragging(false);

    // Add event listeners for both mouse and touch
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);

    // Cleanup function
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove, handleTouchMove]);

  // Determine which net image to use based on direction
  const netImage =
    direction === "left"
      ? `${process.env.PUBLIC_URL}/images/catching_net_left.png`
      : `${process.env.PUBLIC_URL}/images/catching_net_right.png`;

  return (
    <img
      ref={netRef}
      src={netImage}
      alt="Catching net"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.current.width}px`,
        height: `${dimensions.current.height}px`,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: 20,
        userSelect: "none", // Prevent text selection during drag
        touchAction: "none", // Prevent browser touch handling
        transition: "transform 0.1s ease", // Smooth movement
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    />
  );
});

DraggableNet.displayName = "DraggableNet";

export default DraggableNet;
