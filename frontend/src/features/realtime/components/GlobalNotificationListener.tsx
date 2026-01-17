"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";
import { useGlobalSocket } from "../context/GlobalSocketContext";
import { useRouter } from "@/i18n/routing";

export const GlobalNotificationListener = () => {
    const { socket } = useGlobalSocket();
    const router = useRouter();

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data: { title: string; message: string; type?: "info" | "success" | "warning" | "error" | "default"; link?: string }) => {
            const onClick = data.link ? () => router.push(data.link as Parameters<typeof router.push>[0]) : undefined;

            toast(data.message, {
                type: data.type || "info",
                onClick,
                autoClose: 5000,
            });
        };

        // Listen for generic notifications
        socket.on("notification", handleNotification);

        // Also listen for call-requests if they are separate
        socket.on("call-request", (data: { callerName?: string }) => {
            toast.info(`Incoming call from ${data.callerName || "Unknown"}`, {
                autoClose: false,
                // We'll likely handle the actual UI via CallOrchestrator, but a toast doesn't hurt
            });
        });

        return () => {
            socket.off("notification", handleNotification);
            socket.off("call-request");
        };
    }, [socket, router]);

    return null;
};
