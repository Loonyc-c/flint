import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/features/profile";
import { useAuthStore } from "@/features/auth";
import toast from "react-hot-toast";
import {
  Camera,
  User,
  ChevronRight,
  ChevronLeft,
  Mic,
  Square,
  Play,
} from "lucide-react";
import QuestionEditor from "@/features/profile/components/QuestionEditor";

export default function Onboarding() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    uploadProfilePic,
    uploadAudio,
    updateProfile,
    isUploadingPhoto,
    isUpdatingProfile,
  } = useProfileStore();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  const [formData, setFormData] = useState({
    nickname: "",
    age: 18,
    gender: "",
    bio: "",
    location: "",
    interests: [],
  });

  const [questions, setQuestions] = useState([]);

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

  const handleImageChange = (e) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      setProfilePicPreview(reader.result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const canProceed = () => {
    if (step === 1) return profilePic !== null;
    if (step === 2)
      return (
        formData.nickname &&
        formData.age &&
        formData.gender &&
        formData.bio &&
        formData.location
      );
    if (step === 3) {
      return questions.length >= 3;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (step === 1) toast.error("Please upload a profile picture");
      if (step === 2) toast.error("Please fill in all basic information");
      if (step === 3)
        toast.error("Please select and answer at least 3 questions");
      return;
    }
    setStep(step + 1);
  };

  const handleQuestionsSelected = (selectedQuestions) => {
    setQuestions(selectedQuestions);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!canProceed()) {
      toast.error("Please select and answer at least 3 questions");
      return;
    }

    try {
      // Upload profile picture
      if (profilePic) {
        await uploadProfilePic(profilePic);
      }

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
            audioUrl: null,
          };
        })
      );

      console.log(
        "Questions with audio URLs:",
        questionsWithAudio.filter((q) => q.audioUrl).length
      );

      // Filter questions that have either text answer or audio
      const validQuestions = questionsWithAudio.filter(
        (q) => q.answer.trim() || q.audioUrl
      );

      // Update profile with all data
      const profileData = {
        ...formData,
        questions: validQuestions,
      };

      await updateProfile(profileData);

      toast.success("Profile setup complete!");
      navigate("/main");
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Failed to complete setup");
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Profile Picture */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Upload Your Profile Picture
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Let others see your beautiful smile!
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Profile preview"
                    className="w-40 h-40 rounded-full object-cover border-4 border-brand"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-brand/10 flex items-center justify-center border-4 border-brand">
                    <User className="w-20 h-20 text-brand" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-brand text-white p-3 rounded-full hover:bg-brand/90 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                Click the camera icon to upload
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Tell Us About Yourself
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Help others get to know you better
              </p>
            </div>

            <div className="space-y-4">
              {/* Nickname Input */}
              <div>
                <label className="block font-medium mb-2">
                  Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({ ...formData, nickname: e.target.value })
                  }
                  placeholder="How should people call you?"
                  maxLength="20"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be displayed in chats (max 20 characters)
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2">Age</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., New York, NY"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Interests (select at least 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.interests.includes(interest)
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Questions */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Answer Some Questions</h2>
              <p className="text-gray-600">
                Select 3-5 questions from our pool and answer them with your
                voice
              </p>
            </div>

            <QuestionEditor
              initialQuestions={questions}
              onSave={handleQuestionsSelected}
              showSaveButton={false}
              autoSave={true}
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-brand text-white hover:bg-brand/90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isUploadingPhoto || isUpdatingProfile}
              className="px-6 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {isUploadingPhoto || isUpdatingProfile
                ? "Saving..."
                : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
