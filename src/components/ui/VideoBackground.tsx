import React, { useRef, useEffect } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fadeFrame: number;

    const fadeVideo = (startOpacity: number, endOpacity: number, duration: number, callback?: () => void) => {
      cancelAnimationFrame(fadeFrame);
      const startTime = performance.now();
      
      const animateFade = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (video) {
          video.style.opacity = String(startOpacity + (endOpacity - startOpacity) * progress);
        }

        if (progress < 1) {
          fadeFrame = requestAnimationFrame(animateFade);
        } else if (callback) {
          callback();
        }
      };
      
      fadeFrame = requestAnimationFrame(animateFade);
    };

    const handleLoadedData = () => {
      video.style.opacity = '0';
      video.play().catch(console.error);
      // Fade in over 250ms
      fadeVideo(0, 1, 250);
    };

    const handleTimeUpdate = () => {
      // 250ms fade-out when 0.55s remain
      if (video.duration - video.currentTime <= 0.55 && !fadingOutRef.current) {
        fadingOutRef.current = true;
        fadeVideo(parseFloat(video.style.opacity || '1'), 0, 250);
      }
    };

    const handleEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(console.error);
        fadingOutRef.current = false;
        fadeVideo(0, 1, 250);
      }, 100);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(fadeFrame);
      if (video) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
        muted
        playsInline
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[115%] h-[115%] object-cover object-top max-w-none"
        style={{ opacity: 0 }} // Start hidden for manual fade logic
      />
    </div>
  );
}
