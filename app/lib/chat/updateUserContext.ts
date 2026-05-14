import {
  updateMemory,
  savePattern,
  saveMicroDetail,
  setUserStyle,
  setUserType,
} from "@/lib/userMemory";

import { updateUserIdentity }
from "@/lib/userIdentity";

import { updateUserProfile }
from "@/lib/userProfile";

import { detectPattern }
from "@/lib/patternEngine";

import { detectUserStyle }
from "@/lib/personalityEngine";

import { detectUserType }
from "@/lib/psychologyEngine";

type Input = {
  userId: string;
  userText: string;
  historyTexts: string[];
  analysis: any;
};

export async function updateUserContext({
  userId,
  userText,
  historyTexts,
  analysis,
}: Input) {
  updateMemory(
    userId,
    userText
  );

  await saveMicroDetail(
    userId,
    userText
  );

  updateUserIdentity(
    userId,
    userText
  );

  updateUserProfile(
    userId,
    analysis
  );

  const pattern =
    detectPattern(
      userText
    );

  if (pattern) {
    await savePattern(
      userId,
      pattern
    );
  }

  const userStyle =
    detectUserStyle(
      userText
    );

  await setUserStyle(
    userId,
    userStyle
  );

  const userType =
    detectUserType(
      userText,
      historyTexts
    );

  await setUserType(
    userId,
    userType
  );

  return {
    pattern,
    userStyle,
    userType,
  };
}