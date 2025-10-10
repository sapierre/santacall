import { memo } from "react";
import { View } from "react-native";

import { useTranslation } from "@turbostarter/i18n";
import { cn, ThemeColor, ThemeMode } from "@turbostarter/ui";

import { Button } from "./button";
import { Icons } from "./icons";
import { Label } from "./label";
import { Text } from "./text";

import type { ThemeConfig } from "@turbostarter/ui";

interface ThemeCustomizerProps {
  readonly config: ThemeConfig;
  readonly onChange: (config: ThemeConfig) => Promise<void>;
}

export const MODE_ICONS = {
  [ThemeMode.LIGHT]: Icons.Sun,
  [ThemeMode.DARK]: Icons.Moon,
  [ThemeMode.SYSTEM]: Icons.SunMoon,
} as const;

export const ThemeCustomizer = memo<ThemeCustomizerProps>(
  ({ config, onChange }) => {
    const { t } = useTranslation("common");
    return (
      <View className="mt-2 flex-1 items-center gap-4">
        <View className="w-full gap-1.5">
          <Label nativeID="color" className="text-xs">
            {t("theme.color.label")}
          </Label>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(ThemeColor)
              .filter((color) => Object.values(ThemeColor).includes(color))
              .map((color) => {
                const isActive = config.color === color;

                return (
                  <Button
                    variant="outline"
                    size="sm"
                    key={color}
                    onPress={() => onChange({ ...config, color })}
                    hitSlop={2}
                    className={cn(
                      "h-11 grow basis-[100px] flex-row justify-start gap-3 px-3",
                      isActive && "border-primary border-2",
                      `theme-${color}`,
                    )}
                  >
                    <View
                      className={cn(
                        "bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      )}
                    />
                    <Text className="text-sm capitalize">
                      {t(`theme.color.${color}`)}
                    </Text>
                  </Button>
                );
              })}
          </View>
        </View>
        <View className="w-full gap-1.5">
          <Label nativeID="mode" className="text-xs">
            {t("theme.mode.label")}
          </Label>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(ThemeMode).map((mode) => {
              const isActive = config.mode === mode;
              const Icon = MODE_ICONS[mode];

              return (
                <Button
                  variant="outline"
                  size="sm"
                  key={mode}
                  onPress={() => onChange({ ...config, mode })}
                  hitSlop={2}
                  className={cn(
                    "h-11 grow basis-[100px] flex-row justify-start gap-2 capitalize",
                    isActive && "border-primary border-2",
                  )}
                >
                  <Icon
                    className="text-foreground shrink-0"
                    width={20}
                    height={20}
                  />
                  <Text className="text-sm capitalize">
                    {t(`theme.mode.${mode}`)}
                  </Text>
                </Button>
              );
            })}
          </View>
        </View>
      </View>
    );
  },
);

ThemeCustomizer.displayName = "ThemeCustomizer";
