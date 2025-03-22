"use client";


import {
  FC,
  useEffect,
  useRef,
  useState,
  ReactNode,
  CSSProperties,
} from "react";

import { HeroGeometric } from "@/components/user/shape-landing-hero";
import { Preview } from "./preview";

interface HomeClientComponentProps {
  headerAuthComponent?: ReactNode;
}

const HomeClientComponent: FC<HomeClientComponentProps> = ({
  headerAuthComponent,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Calculate animation values based on scroll position
  const maxScroll = 300; // Reduced from 500 to make animation complete faster
  const scrollProgress = Math.min(scrollY / maxScroll, 1);

  // Helper function to interpolate between two values based on progress
  const interpolate = (
    start: number,
    end: number,
    progress: number
  ): number => {
    return start + (end - start) * progress;
  };

  // Client-side only code
  useEffect(() => {
    // Prevent scrolling until animation completes
    const preventScroll = (e: Event) => {
      if (!animationComplete) {
        window.scrollTo(0, 0);
      }
    };

    const handleScroll = () => {
      // Only update scrollY if animation is complete or we're in the initial animation phase
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);

      // Set animation as complete when reaching the threshold
      if (currentScroll >= maxScroll && !animationComplete) {
        setAnimationComplete(true);
      }
    };

    // Handle manual scroll inputs during locked period
    const handleWheel = (e: WheelEvent) => {
      if (!animationComplete) {
        // Accumulate scroll progress artificially with increased sensitivity
        setScrollY((prev) => {
          const newScroll = Math.max(
            0,
            Math.min(prev + e.deltaY * 1.0, maxScroll) // Increased multiplier from 0.5 to 1.0
          );

          // Check if animation should complete
          if (newScroll >= maxScroll) {
            setAnimationComplete(true);
          }

          return newScroll;
        });

        // Prevent actual scrolling
        e.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener("scroll", preventScroll, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Set initial scroll position to top
    window.scrollTo(0, 0);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("scroll", preventScroll);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [animationComplete, maxScroll]);

  // Card positioning calculations
  const getCardStyle = (index: number, totalCards: number) => {
    // Initial state: only the last card (Bappa Ka Prashad) is visible
    // Final state: all cards are in fan layout

    // Base positions for the fan layout (final positions)
    const positions = [
      { left: -120, top: 40, rotate: -6 }, // GenAI
      { left: 80, top: 18, rotate: -3 }, // Orientation
      { left: 250, top: 12, rotate: -2 }, // Spidercry
      { left: 420, top: 18, rotate: 0 }, // RecruitMe
      { left: 580, top: 28, rotate: 6 }, // Team Up
      { left: 720, top: 44, rotate: 12 }, // Bappa Ka Prashad
    ];

    // Initial positions (all cards stacked at the position of the last card)
    const initialLeft =
      typeof window !== "undefined" ? window.innerWidth / 2 - 140 : 500; // Center position with default fallback
    const initialTop = 54;
    const initialRotate = 2; // Initial rotation angle

    // Calculate animation phase - adjusted for earlier start
    const cardAnimationStart = 0.05; // Reduced from 0.1 for earlier animation start
    const cardAnimationRange = 0.65; // Reduced from 0.8 for faster completion

    // Calculate the normalized progress for card animation (0 to 1 during animation phase)
    const cardAnimationProgress =
      scrollProgress <= cardAnimationStart
        ? 0
        : scrollProgress >= cardAnimationStart + cardAnimationRange
          ? 1
          : (scrollProgress - cardAnimationStart) / cardAnimationRange;

    // For all but the last card, they start invisible
    const opacity =
      index === totalCards - 1
        ? 1 // Last card is always visible
        : interpolate(0, 1, Math.min(cardAnimationProgress * 3.5, 1)); // Increased from 3 to 3.5 for faster fade-in

    // Calculate position with smooth interpolation
    let leftPos = initialLeft;
    let topPos = initialTop;
    let rotateAngle = initialRotate;

    // Only apply fan layout transformation based on animation progress
    if (cardAnimationProgress > 0 || index === totalCards - 1) {
      leftPos = interpolate(
        initialLeft,
        positions[index].left,
        cardAnimationProgress
      );
      topPos = interpolate(
        initialTop,
        positions[index].top,
        cardAnimationProgress
      );
      rotateAngle = interpolate(
        initialRotate,
        positions[index].rotate,
        cardAnimationProgress
      );
    }

    const zIndex = index + 1;

    return {
      left: `${leftPos}px`,
      top: `${topPos}px`,
      transformOrigin: "center",
      transform: `rotate(${rotateAngle}deg) scale(1)`,
      opacity,
      zIndex,
      boxSizing: "border-box" as CSSProperties["boxSizing"],
      transition:
        "opacity 0.2s ease-out, transform 0.2s ease-out, left 0.2s ease-out, top 0.2s ease-out",
    };
  };

  // Tag animation styles for global tags
  const getTagStyle = (isExplore: boolean) => {
    const initialOpacity = 0;
    const finalOpacity = 1;

    const initialLeft = 300;
    const finalLeft = isExplore ? 300 : 720;

    const initialTop = -20;
    const finalTop = isExplore ? -20 : -28;

    const initialRotate = 0;
    const finalRotate = isExplore ? -12 : -6;

    // Only show tags after cards start spreading (reduced threshold for earlier appearance)
    const tagAnimationStart = 0.2; // Reduced from 0.3 for earlier appearance
    const tagAnimationRange = 0.4; // Reduced from 0.5 for faster completion

    const tagAnimationProgress =
      scrollProgress <= tagAnimationStart
        ? 0
        : scrollProgress >= tagAnimationStart + tagAnimationRange
          ? 1
          : (scrollProgress - tagAnimationStart) / tagAnimationRange;

    // Calculate with smooth interpolation
    const tagOpacity = interpolate(
      initialOpacity,
      finalOpacity,
      tagAnimationProgress
    );
    const tagLeft = interpolate(initialLeft, finalLeft, tagAnimationProgress);
    const tagTop = interpolate(initialTop, finalTop, tagAnimationProgress);
    const tagRotate = interpolate(
      initialRotate,
      finalRotate,
      tagAnimationProgress
    );

    return {
      opacity: tagOpacity,
      left: `${tagLeft}px`,
      top: `${tagTop}px`,
      transform: `rotate(${tagRotate}deg)`,
      transition:
        "opacity 0.2s ease-out, transform 0.2s ease-out, left 0.2s ease-out, top 0.2s ease-out",
    };
  };

  // Function to get card-specific tag style - NEW FUNCTION
  const getCardTagStyle = (index: number) => {
    const cardStyle = getCardStyle(index, cardImages.length);
    return {
      position: "absolute" as CSSProperties["position"],
      left: cardStyle.left, // Align with the card's left position
      top: `calc(${cardStyle.top} - 30px)`, // Position slightly above the card
      transform: cardStyle.transform, // Ensure the same rotation and scale as the card
      opacity: cardStyle.opacity, // Match the card's fade-in animation
      zIndex: (cardStyle.zIndex as number) + 1, // Keep tags above cards
      transition: cardStyle.transition, // Inherit card's transition
    };
  };

  // Image paths in order of appearance
  const cardImages = [
    "/gen.png", // GenAI Study Jams
    "/orentiation.png", // Orientation
    "/spidercraft.png", // Spidercry
    "/recuritment.png", // RecruitMe
    "/webwiz.png", // Team Up
    "/bkp.png", // Bappa Ka Prashad
  ];

  const cardAlts = [
    "GenAI Study Jams",
    "Orientation",
    "Spidercry",
    "RecruitMe",
    "Team Up",
    "Bappa Ka Prashad",
  ];

  // Define tags for specific cards - NEW DATA
  const cardTags: Record<number, string> = {
    1: "@orientation", // Tag for the second card (index 1)
    4: "@webwiz", // Tag for the fifth card (index 4)
    // You can add more tags for other cards here
  };

  // Function to handle "Explore" button click
  const handleExplore = () => {
    // Mark animation as complete and allow scrolling
    setAnimationComplete(true);

    // Programmatically scroll to content section
    if (pageRef.current) {
      const offset = window.innerHeight;
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex flex-col bg-black">
      <section className="w-full relative">
        <HeroGeometric
          badge="Upcoming event on 29th March"
          title1="Innovate, Code"
          title2="with GDG RBU"
        />
        <Preview />
      </section>

      {/* <section className="w-full relative">
        <Preview />
      </section> */}
    </div>
  );
};

export default HomeClientComponent;
