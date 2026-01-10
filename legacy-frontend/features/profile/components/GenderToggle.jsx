import * as React from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Venus, Mars } from "lucide-react";
import { useProfileStore } from "@/features/profile";
import { useAuthStore } from "@/features/auth";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
  padding: "6px",
  borderRadius: "50%",
  color: "#6B7280", // gray-500 for light mode
  transition: "all 0.2s ease-in-out",
  "&.Mui-selected": {
    backgroundColor: "#D9776D",
    color: "white !important",
    "&:hover": {
      backgroundColor: "#B5655D",
      color: "white !important",
    },
  },
  "&:hover": {
    backgroundColor: "#E9B4A9",
    color: "white",
  },
  // Dark mode support
  "@media (prefers-color-scheme: dark)": {
    color: "#D1D5DB", // gray-300 for dark mode
    "&:hover": {
      backgroundColor: "#4B5563", // gray-600 for dark mode
      color: "white",
    },
    "&.Mui-selected": {
      backgroundColor: "#D9776D",
      color: "white !important",
      "&:hover": {
        backgroundColor: "#B5655D",
        color: "white !important",
      },
    },
  },
  // Support for .dark class on html/body
  ".dark &": {
    color: "#D1D5DB", // gray-300 for dark mode
    "&:hover": {
      backgroundColor: "#4B5563", // gray-600 for dark mode
      color: "white",
    },
    "&.Mui-selected": {
      backgroundColor: "#D9776D",
      color: "white !important",
      "&:hover": {
        backgroundColor: "#B5655D",
        color: "white !important",
      },
    },
  },
}));

export default function GenderToggle() {
  const { t } = useTranslation();
  const { authUser } = useAuthStore();
  const { updateProfile } = useProfileStore();

  const [gender, setGender] = React.useState(
    authUser?.preferences?.gender || "all"
  );

  // Get translated gender label
  const getGenderLabel = (genderValue) => {
    switch (genderValue) {
      case "female":
        return t("profile.female");
      case "male":
        return t("profile.male");
      case "all":
        return t("profile.all");
      default:
        return genderValue;
    }
  };

  // Update gender when authUser changes
  React.useEffect(() => {
    if (authUser?.preferences?.gender) {
      setGender(authUser.preferences.gender);
    }
  }, [authUser]);

  const handleGenderChange = async (event, newGender) => {
    if (newGender === null) return; // Don't allow deselection

    setGender(newGender);

    try {
      await updateProfile({
        preferences: {
          ...authUser?.preferences,
          gender: newGender,
        },
      });
      toast.success("Gender preference updated!");
    } catch (error) {
      toast.error("Failed to update gender preference");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span className="text-neutral-800 dark:text-neutral-200 uppercase text-sm font-medium">
        {getGenderLabel(gender)}
      </span>
      <ToggleButtonGroup
        value={gender}
        exclusive
        onChange={handleGenderChange}
        aria-label="gender selection"
      >
        <CustomToggleButton value="female" aria-label="Female">
          <Venus />
        </CustomToggleButton>
        <CustomToggleButton value="male" aria-label="Male">
          <Mars />
        </CustomToggleButton>
        <CustomToggleButton value="all" aria-label="All">
          <span className="text-xs font-medium">
            {t("profile.all").toUpperCase()}
          </span>
        </CustomToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
