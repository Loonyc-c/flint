"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useUser } from "@/features/auth/context/UserContext";

export type UserBusyStatus = 'available' | 'queueing' | 'connecting' | 'in-call';

interface GlobalSocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    joinMatch: (matchId: string) => void;
    leaveMatch: (matchId: string) => void;
    isUserBusy: (userId: string) => boolean;
    busyStates: Record<string, UserBusyStatus>;
}

const GlobalSocketContext = createContext<GlobalSocketContextValue | null>(null);

const RAW_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;

const getSocketBaseUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return url;
    }
};

const SOCKET_URL = RAW_SOCKET_URL || (RAW_API_URL ? getSocketBaseUrl(RAW_API_URL) : "http://localhost:9999");

export const GlobalSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, token } = useUser();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [busyStates, setBusyStates] = useState<Record<string, UserBusyStatus>>({});

    // Ref to hold the socket instance to prevent unnecessary re-creations
    const socketRef = useRef<Socket | null>(null);
    const joinedMatches = useRef<Set<string>>(new Set());

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        }
    }, []);

    const connect = useCallback(() => {
        if (!token || socketRef.current) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        });

        newSocket.on("connect", () => {
            setIsConnected(true);

            // Rejoin any match rooms after reconnection
            joinedMatches.current.forEach((matchId) => {
                newSocket.emit("join-match", matchId);
            });
        });

        newSocket.on("disconnect", (_reason) => {
            setIsConnected(false);
        });

        newSocket.on("connect_error", (err) => {
            console.error("[GlobalSocket] Connect Error:", err);
            setIsConnected(false);
        });

        // Busy state events
        newSocket.on("busy-states-sync", (states: Record<string, UserBusyStatus>) => {
            setBusyStates(states);
        });

        newSocket.on("user-busy-state-changed", ({ userId, status }: { userId: string, status: UserBusyStatus }) => {
            setBusyStates(prev => ({
                ...prev,
                [userId]: status
            }));
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
    }, [token]);

    // Auto-connect when user/token is available
    useEffect(() => {
        if (user && token) {
            connect();
        } else {
            disconnect();
        }
        return () => disconnect();
    }, [user?.id, token, connect, disconnect]);

    // Join a match room
    const joinMatch = useCallback((matchId: string) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("join-match", matchId);
            joinedMatches.current.add(matchId);
        }
    }, []);

    // Leave a match room
    const leaveMatch = useCallback((matchId: string) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("leave-match", matchId);
            joinedMatches.current.delete(matchId);
        }
    }, []);

    const isUserBusy = useCallback((userId: string) => {
        return !!busyStates[userId] && busyStates[userId] !== 'available';
    }, [busyStates]);

    const value: GlobalSocketContextValue = {
        socket,
        isConnected,
        connect,
        disconnect,
        joinMatch,
        leaveMatch,
        isUserBusy,
        busyStates,
    };

    return (
        <GlobalSocketContext.Provider value={value}>
            {children}
        </GlobalSocketContext.Provider>
    );
};

export const useGlobalSocket = (): GlobalSocketContextValue => {
    const context = useContext(GlobalSocketContext);
    if (!context) {
        throw new Error("useGlobalSocket must be used within a GlobalSocketProvider");
    }
    return context;
};
