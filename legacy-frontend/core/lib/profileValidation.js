/**
 * Profile Validation Utilities
 * Check if user profile is complete before allowing access to certain features
 */

/**
 * Check if user profile is complete
 * @param {Object} user - User object from authUser
 * @returns {Object} - { isComplete: boolean, missingFields: string[] }
 */
export const checkProfileCompletion = (user) => {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ["User not authenticated"],
    };
  }

  const missingFields = [];

  // Required fields for profile completion
  if (!user.profilePic || user.profilePic === "") {
    missingFields.push("Profile Picture");
  }

  if (!user.age || user.age < 18) {
    missingFields.push("Age");
  }

  if (!user.gender || user.gender === "") {
    missingFields.push("Gender");
  }

  if (!user.bio || user.bio.trim() === "") {
    missingFields.push("Bio");
  }

  if (!user.location || user.location.trim() === "") {
    missingFields.push("Location");
  }

  if (!user.nickname || user.nickname.trim() === "") {
    missingFields.push("Nickname");
  }

  // At least 3 questions with answers (text or audio)
  const validQuestions =
    user.questions?.filter((q) => q.answer?.trim() || q.audioUrl) || [];
  if (validQuestions.length < 3) {
    missingFields.push(`Questions (${validQuestions.length}/3)`);
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Get profile completion percentage
 * @param {Object} user - User object from authUser
 * @returns {number} - Percentage (0-100)
 */
export const getProfileCompletionPercentage = (user) => {
  if (!user) return 0;

  const totalFields = 7; // profilePic, age, gender, bio, location, nickname, questions
  let completedFields = 0;

  if (user.profilePic && user.profilePic !== "") completedFields++;
  if (user.age && user.age >= 18) completedFields++;
  if (user.gender && user.gender !== "") completedFields++;
  if (user.bio && user.bio.trim() !== "") completedFields++;
  if (user.location && user.location.trim() !== "") completedFields++;
  if (user.nickname && user.nickname.trim() !== "") completedFields++;

  const validQuestions =
    user.questions?.filter((q) => q.answer?.trim() || q.audioUrl) || [];
  if (validQuestions.length >= 3) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
};

