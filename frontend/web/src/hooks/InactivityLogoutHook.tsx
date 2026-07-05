import React, { useEffect, useRef } from 'react';
import { logout } from '../api/auth';

interface TimeProps {
    timer: number;
}

export const Timer: React.FC<TimeProps> = ({ timer }) => {
    const timeLeft = useRef(timer);

    async function handleLogout() {
        try {
            await logout();
        } finally {
            window.location.href = '/login';
            window.location.reload();
        }
    }

    useEffect(() => {
        const reset = () => { timeLeft.current = timer; };
        window.addEventListener('mousemove', reset);
        window.addEventListener('keydown', reset);
        window.addEventListener('click', reset);
        window.addEventListener('scroll', reset);
        return () => {
            window.removeEventListener('mousemove', reset);
            window.removeEventListener('keydown', reset);
            window.removeEventListener('click', reset);
            window.removeEventListener('scroll', reset);
        };
    }, [timer]);

    useEffect(() => {
        const interval = setInterval(() => {
            timeLeft.current -= 1;
            if (timeLeft.current <= 0) {
                clearInterval(interval);
                handleLogout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
};
