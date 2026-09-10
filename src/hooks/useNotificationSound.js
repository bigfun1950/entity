"use client";
import { useEffect, useRef } from "react";

export function useNotificationSound(src = "/notif.wav") {
    const soundRef = useRef(
        typeof Audio !== "undefined" ? new Audio(src) : null
    );
    const unlockedRef = useRef(false);

    useEffect(() => {
        const unlockAudio = () => {
            const sound = soundRef.current;
            if (sound && !unlockedRef.current) {
                sound
                    .play()
                    .then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                        unlockedRef.current = true;
                    })
                    .catch(() => { });
            }
        };

        const events = ["click", "keydown", "mousemove", "touchstart", "scroll"];
        events.forEach(e => window.addEventListener(e, unlockAudio, { once: true }));

        return () => {
            events.forEach(e => window.removeEventListener(e, unlockAudio));
        };
    }, []);

    const play = () => {
        if (unlockedRef.current && soundRef.current) {
            soundRef.current.currentTime = 0;
            soundRef.current.play().catch(() => { });
        }
    };

    return play;
}
