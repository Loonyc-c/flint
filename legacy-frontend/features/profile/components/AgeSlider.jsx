import * as React from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { useProfileStore } from "@/features/profile";
import { useAuthStore } from "@/features/auth";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

function valuetext(value) {
  return `${value}`;
}

export default function AgeSlider() {
  const { t } = useTranslation();
  const { authUser } = useAuthStore();
  const { updateProfile } = useProfileStore();

  const [value, setValue] = React.useState([
    authUser?.preferences?.ageRange?.min || 18,
    authUser?.preferences?.ageRange?.max || 25,
  ]);

  // Update value when authUser changes
  React.useEffect(() => {
    if (authUser?.preferences?.ageRange) {
      setValue([
        authUser.preferences.ageRange.min,
        authUser.preferences.ageRange.max,
      ]);
    }
  }, [authUser]);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  const handleChangeCommitted = async (_, newValue) => {
    try {
      await updateProfile({
        preferences: {
          ...authUser?.preferences,
          ageRange: {
            min: newValue[0],
            max: newValue[1],
          },
        },
      });
      toast.success("Age range updated!");
    } catch (error) {
      toast.error("Failed to update age range");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <div className="flex justify-between items-center text-sm sm:text-base text-neutral-800 dark:text-neutral-200">
        <span>{t("profile.age")}</span>
        <span>
          {value[0]} - {value[1]}
        </span>
      </div>

      <Slider
        getAriaLabel={() => "Age range"}
        value={value}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        valueLabelDisplay="auto"
        getAriaValueText={valuetext}
        min={18}
        max={100}
        sx={{
          mt: 1.5,
          "& .MuiSlider-thumb": {
            color: "#D9776D",
            width: 18,
            height: 18,
            "&:hover, &.Mui-focusVisible": {
              boxShadow: "0 0 0 8px rgba(217,119,109,0.16)",
            },
          },
          "& .MuiSlider-track": {
            color: "#D9776D",
            height: 4,
          },
          "& .MuiSlider-rail": {
            color: "rgba(2, 132, 199, 0.35)",
            height: 4,
          },
          "& .MuiSlider-valueLabel": {
            borderRadius: 1,
            fontSize: 12,
          },
        }}
      />
    </Box>
  );
}
