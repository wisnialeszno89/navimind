import {
  getMemory,
  getPatterns,
  getUserType,
  getUserStyle,
} from "@/lib/userMemory";

import { getUserIdentity }
from "@/lib/userIdentity";

import { getUserProfile }
from "@/lib/userProfile";

import { buildEmotionalProfile }
from "./buildEmotionalProfile";

import { buildActiveTopic }
from "./buildActiveTopic";

import type {
  UserContext,
} from "./chatTypes";

import { buildMemoryPriority }
from "./buildMemoryPriority";

type Input = {
  userId: string;
};

export async function buildUserContext({
  userId,
}: Input): Promise<UserContext>{
  const memory =
    getMemory(userId);

  const patterns =
    await getPatterns(
      userId
    );

  const userType =
    (
      await getUserType(
        userId
      )
    ) || "unknown";

  const userStyle =
    (
      await getUserStyle(
        userId
      )
    ) || "neutral";

  const identity =
    getUserIdentity(
      userId
    );

  const userProfile =
    getUserProfile(
      userId
    );
    const emotionalProfile =
  buildEmotionalProfile({
    patterns,
    memory,
  });
  const activeTopic =
  buildActiveTopic({
    memory,
    patterns,
  });
  const memoryPriority =
  buildMemoryPriority({
    memory,
    patterns,
  });
   return {
    memory,
    patterns,
    userType,
    userStyle,
    identity,
    userProfile,
    emotionalProfile,
    activeTopic,
    memoryPriority,
  };
}