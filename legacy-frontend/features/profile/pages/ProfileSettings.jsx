import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, User, Eye, MapPin, Heart, MessageSquare } from "lucide-react";

// Features
import { useAuthStore } from "@/features/auth";
import { useProfileStore } from "@/features/profile";
import QuestionEditor from "@/features/profile/components/QuestionEditor";
import { CustomAudioPlayer } from "@/features/chat";

function ProfileSettings() {
  const navigate = useNavigate();
  const { authUser, logout } = useAuthStore();
  const {
    profile,
    getMyProfile,
    updateProfile,
    uploadProfilePic,
    uploadAudio,
    updateContactInfo: updateContactInfoStore,
    isUpdatingProfile,
    isLoadingProfile,
    isUploadingPhoto,
  } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    age: 18,
    bio: "",
    location: "",
    gender: "",
    interests: [],
  });

  const [contactInfo, setContactInfo] = useState({
    phone: "",
    instagram: "",
    telegram: "",
    snapchat: "",
    whatsapp: "",
    wechat: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    other: "",
  });

  const interestsList = [
    "Travel",
    "Movies",
    "Fitness",
    "Photography",
    "Technology",
    "Gaming",
    "Nature",
    "Writing",
    "Coffee",
    "Hiking",
    "Music",
    "Books",
    "Cooking",
    "Art",
    "Sports",
    "Fashion",
    "Dancing",
    "Yoga",
    "Wine",
    "Cycling",
  ];

  // Load profile on mount
  useEffect(() => {
    getMyProfile();
  }, [getMyProfile]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        nickname: profile.nickname || "",
        age: profile.age || 18,
        bio: profile.bio || "",
        location: profile.location || "",
        gender: profile.gender || "",
        interests: profile.interests || [],
      });

      // Load contact info
      if (profile.contactInfo) {
        setContactInfo({
          phone: profile.contactInfo.phone || "",
          instagram: profile.contactInfo.instagram || "",
          telegram: profile.contactInfo.telegram || "",
          snapchat: profile.contactInfo.snapchat || "",
          whatsapp: profile.contactInfo.whatsapp || "",
          wechat: profile.contactInfo.wechat || "",
          facebook: profile.contactInfo.facebook || "",
          twitter: profile.contactInfo.twitter || "",
          linkedin: profile.contactInfo.linkedin || "",
          other: profile.contactInfo.other || "",
        });
      }
    }
  }, [profile]);

  const toggleInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleSaveQuestions = async (questions) => {
    try {
      // Upload audio recordings and get URLs
      console.log(
        "Processing questions with audio:",
        questions.filter((q) => q.audioBlob).length
      );

      const questionsWithAudio = await Promise.all(
        questions.map(async (q) => {
          if (q.audioBlob) {
            console.log("Uploading audio for question:", q.question);
            // Convert blob to base64
            const reader = new FileReader();
            const base64Audio = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(q.audioBlob);
            });

            // Upload to backend
            const result = await uploadAudio(base64Audio);
            if (result.success) {
              console.log("Audio uploaded successfully:", result.audioUrl);
              return {
                question: q.question,
                answer: q.answer || "",
                audioUrl: result.audioUrl,
              };
            } else {
              console.error("Audio upload failed:", result.error);
            }
          }
          return {
            question: q.question,
            answer: q.answer || "",
            audioUrl: q.audioUrl || null, // Keep existing audioUrl if no new recording
          };
        })
      );

      console.log("Questions with audio URLs:", questionsWithAudio);

      // Update profile with questions
      const result = await updateProfile({ questions: questionsWithAudio });
      if (result.success) {
        toast.success("Questions updated successfully!");
        setIsEditingQuestions(false);
        await getMyProfile(); // Refresh profile
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Failed to save questions");
    }
  };

  const handleSaveContactInfo = async () => {
    const result = await updateContactInfoStore(contactInfo);
    if (result.success) {
      setIsEditingContactInfo(false);
      await getMyProfile(); // Refresh profile to get updated verification status
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only accept common web image formats
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported image format. Please use JPG, PNG, or WEBP.", {
        duration: 4000,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeMB = 5;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      toast.error(
        `Image size (${fileSizeMB.toFixed(
          2
        )}MB) exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`,
        { duration: 5000 }
      );
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const result = await uploadProfilePic(base64Image);

      // Show success or error message
      if (!result.success && result.error) {
        // Error already shown by store, but we can add additional context
        console.error("Profile pic upload failed:", result.error);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto bg-gray-50 dark:bg-neutral-900">
      <header className="sticky top-0 z-10 w-full px-4 sm:px-8 lg:px-16 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        {/* Left side */}
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
          <h1 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
            Profile Settings
          </h1>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-md truncate max-w-[150px] sm:max-w-none">
            {authUser?.email}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:underline whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 5v14" />
              <path d="M21 12H7" />
              <path d="m15 18 6-6-6-6" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>
      {/* Main */}
      <div className="max-w-2xl mx-4 sm:mx-auto my-6 sm:my-12 p-4 sm:p-6 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-md bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
            Edit Profile
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-3 py-1 border border-gray-300 dark:border-neutral-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative">
            {profile?.profilePic ? (
              <img
                src={profile.profilePic}
                alt={profile.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-brand"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-brand/10 flex items-center justify-center border-4 border-brand">
                <User className="w-16 h-16 text-brand" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingPhoto ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click the camera icon to upload a profile picture
          </p>
        </div>

        <form className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                htmlFor="nickname"
              >
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                disabled={!isEditing}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                placeholder="How should people call you?"
                maxLength="20"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Displayed in chats (max 20 characters)
              </p>
            </div>
            <div className="flex-1">
              <label
                className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                disabled={!isEditing}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label
                className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                htmlFor="age"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                disabled={!isEditing}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: Number(e.target.value) })
                }
                placeholder="25"
                min="18"
                max="100"
              />
            </div>
          </div>
          <div>
            <label
              className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              htmlFor="bio"
            >
              Bio
            </label>
            <textarea
              id="bio"
              disabled={!isEditing}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2 resize-none h-24"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label
              className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              htmlFor="location"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              disabled={!isEditing}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label
              className="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              htmlFor="gender"
            >
              Gender
            </label>
            <select
              id="gender"
              disabled={!isEditing}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <p className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Interests
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-h-72 overflow-auto p-1">
              {interestsList.map((interest) => (
                <label
                  key={interest}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={formData.interests.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                    className="w-4 h-4 text-gray-700 dark:text-gray-300 rounded border-gray-300 dark:border-neutral-600 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {interest}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdatingProfile}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>

      {/* Question Editor Section */}
      <div className="max-w-2xl mx-auto my-8 p-6 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-md bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Profile Questions
          </h2>
          {!isEditingQuestions && (
            <button
              onClick={() => setIsEditingQuestions(true)}
              className="text-sm text-brand hover:underline"
            >
              {profile?.questions && profile.questions.length > 0
                ? "Edit Questions"
                : "Add Questions"}
            </button>
          )}
        </div>

        {isEditingQuestions ? (
          <QuestionEditor
            initialQuestions={
              profile?.questions?.map((q, index) => ({
                id: `existing_${index}`,
                question: q.question,
                answer: q.answer || "",
                audioUrl: q.audioUrl || null,
                audioBlob: null,
              })) || []
            }
            onSave={handleSaveQuestions}
          />
        ) : (
          <div className="space-y-4">
            {profile?.questions && profile.questions.length > 0 ? (
              <>
                <p className="text-sm text-gray-600">
                  You have answered {profile.questions.length} question
                  {profile.questions.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-3">
                  {profile.questions.map((q, index) => (
                    <div key={index}>
                      {q.audioUrl && (
                        <CustomAudioPlayer
                          audioUrl={q.audioUrl}
                          question={q.question}
                          showQuestion={true}
                          showDelete={false}
                          size="medium"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No questions answered yet
                </p>
                <button
                  onClick={() => setIsEditingQuestions(true)}
                  className="bg-brand hover:bg-brand/90 text-white py-2 px-6 rounded-lg transition-colors"
                >
                  Add Questions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Preview Section */}
      <div className="max-w-2xl mx-auto my-8 p-6 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-md bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Profile Preview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How others see you
          </p>
        </div>

        {/* Preview Card - Similar to Swipe Card */}
        <div className="relative bg-gradient-to-br from-brand/5 to-pink-50 dark:from-brand/10 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-brand/20 dark:border-brand/30">
          <div className="flex flex-col items-center gap-4">
            {/* Profile Picture */}
            <div className="relative">
              {profile?.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt={profile.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand/10 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-16 h-16 text-brand" />
                </div>
              )}
            </div>

            {/* Name and Age */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {profile?.fullName || "Your Name"}
                {profile?.age && (
                  <span className="text-gray-600 dark:text-gray-400">
                    , {profile.age}
                  </span>
                )}
              </h3>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-center text-gray-700 dark:text-gray-300 max-w-md">
                {profile.bio}
              </p>
            )}

            {/* Location */}
            {profile?.location && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}

            {/* Interests */}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="w-full">
                <div className="flex flex-wrap gap-2 justify-center">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white dark:bg-neutral-700 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-brand/20 dark:border-brand/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gender */}
            {profile?.gender && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Gender:</span> {profile.gender}
              </div>
            )}

            {/* Questions */}
            {profile?.questions && profile.questions.length > 0 && (
              <div className="w-full space-y-3 mt-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  About Me
                </h4>
                {profile.questions.map((q, index) => (
                  <div key={`question-${index}-${q.audioUrl || q.answer}`}>
                    {q.audioUrl && (
                      <CustomAudioPlayer
                        audioUrl={q.audioUrl}
                        question={q.question}
                        showQuestion={true}
                        showDelete={false}
                        size="small"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-brand/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-pink-200/30 rounded-full blur-xl"></div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          This is how your profile appears to others when they swipe
        </p>
      </div>

      {/* Contact Info Section */}
      <div className="max-w-2xl mx-auto my-8 p-6 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-md bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 2v2" />
                <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                <path d="M8 2v2" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <circle cx="12" cy="10" r="3" />
                <path d="M8 2v2" />
              </svg>
              Contact Information
              {profile?.isContactVerified && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-300 dark:border-green-700">
                  ✓ Verified
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Required for Stage 3 (Contact Exchange). Add at least 1 contact
              method.
              {profile?.contactMethodsCount >= 3 && (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {" "}
                  ✨ You have {profile.contactMethodsCount} contacts - Verified!
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setIsEditingContactInfo(!isEditingContactInfo)}
            className="flex items-center gap-1 px-3 py-1 border border-gray-300 dark:border-neutral-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            {isEditingContactInfo ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📱 Phone
            </label>
            <input
              type="tel"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📷 Instagram
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.instagram}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, instagram: e.target.value })
              }
              placeholder="@username"
            />
          </div>

          {/* Telegram */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ✈️ Telegram
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.telegram}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, telegram: e.target.value })
              }
              placeholder="@username"
            />
          </div>

          {/* Snapchat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              👻 Snapchat
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.snapchat}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, snapchat: e.target.value })
              }
              placeholder="username"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              💬 WhatsApp
            </label>
            <input
              type="tel"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.whatsapp}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, whatsapp: e.target.value })
              }
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* WeChat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              💚 WeChat
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.wechat}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, wechat: e.target.value })
              }
              placeholder="WeChat ID"
            />
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              👥 Facebook
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.facebook}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, facebook: e.target.value })
              }
              placeholder="facebook.com/username"
            />
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🐦 Twitter/X
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.twitter}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, twitter: e.target.value })
              }
              placeholder="@username"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              💼 LinkedIn
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.linkedin}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, linkedin: e.target.value })
              }
              placeholder="linkedin.com/in/username"
            />
          </div>

          {/* Other */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📧 Other
            </label>
            <input
              type="text"
              disabled={!isEditingContactInfo}
              className="w-full rounded-md border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-neutral-800 disabled:text-gray-400 dark:disabled:text-gray-500 px-3 py-2"
              value={contactInfo.other}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, other: e.target.value })
              }
              placeholder="Email or other contact"
            />
          </div>
        </div>

        {isEditingContactInfo && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSaveContactInfo}
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingProfile ? "Saving..." : "Save Contact Info"}
            </button>
            <button
              onClick={() => {
                setIsEditingContactInfo(false);
                // Reset to profile data
                if (profile?.contactInfo) {
                  setContactInfo({
                    phone: profile.contactInfo.phone || "",
                    instagram: profile.contactInfo.instagram || "",
                    telegram: profile.contactInfo.telegram || "",
                    snapchat: profile.contactInfo.snapchat || "",
                    whatsapp: profile.contactInfo.whatsapp || "",
                    wechat: profile.contactInfo.wechat || "",
                    facebook: profile.contactInfo.facebook || "",
                    twitter: profile.contactInfo.twitter || "",
                    linkedin: profile.contactInfo.linkedin || "",
                    other: profile.contactInfo.other || "",
                  });
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account delete section */}
      <div className="max-w-2xl mx-auto my-12 mt-12 p-6 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/20">
        <h2 className="text-xl font-bold text-[#DB000D] dark:text-red-400 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-triangle-alert-icon lucide-triangle-alert"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          Danger Zone
        </h2>
        <div className="mb-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Delete Account
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
        </div>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-trash2-icon lucide-trash-2"
          >
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default ProfileSettings;
