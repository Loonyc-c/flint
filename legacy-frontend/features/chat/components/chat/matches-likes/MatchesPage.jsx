import React, { useMemo, useEffect } from "react";
import PeopleGrid from "./PeopleGrid";
import { useMatchStore } from "@/features/chat";
import { useAuthStore } from "@/features/auth";

export default function MatchesPage({ onPickChat }) {
  const { unconnectedMatches, getUnconnectedMatches } = useMatchStore();
  const { authUser } = useAuthStore();

  // Load unconnected matches on mount
  useEffect(() => {
    getUnconnectedMatches();
  }, [getUnconnectedMatches]);

  // Convert matches to people format
  const people = useMemo(() => {
    if (!unconnectedMatches || !Array.isArray(unconnectedMatches)) return [];

    return unconnectedMatches
      .filter((match) => match != null)
      .map((match) => {
        // Backend returns match.user (singular) as the other user
        // But also includes match.users (array) for compatibility
        let otherUser = match.user;

        // Fallback to finding from users array if user field doesn't exist
        if (!otherUser && match.users && Array.isArray(match.users)) {
          otherUser = match.users.find(
            (u) => u?._id?.toString() !== authUser?.id
          );
        }

        return {
          id: match._id,
          name: otherUser?.nickname || otherUser?.fullName || "Unknown",
          age: otherUser?.age,
          avatar: otherUser?.profilePic || otherUser?.photos?.[0],
        };
      });
  }, [unconnectedMatches, authUser]);

  return (
    <div className="w-full flex flex-col gap-4 px-3 sm:px-4">
      <PeopleGrid
        title="Matches"
        people={people}
        onChat={(p) => onPickChat?.(p.id)}
        onLike={() => {}}
        showLikeButton={false}
        showMatchedBadge={true}
      />
    </div>
  );
}
