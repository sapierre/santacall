import { Pressable } from "react-native";

import { cn } from "@turbostarter/ui";
import { Icons } from "@turbostarter/ui-mobile/icons";
import { TextClassContext } from "@turbostarter/ui-mobile/text";

interface SettingsTileProps {
  readonly icon: React.ElementType;
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
  readonly destructive?: boolean;
}

export const SettingsTile = ({
  icon: Icon,
  onPress,
  children,
  destructive,
}: SettingsTileProps) => {
  return (
    <Pressable
      hitSlop={4}
      className={cn(
        "bg-background active:bg-muted flex-row items-center justify-between gap-5 px-7 py-4 transition-colors",
      )}
      onPress={onPress}
    >
      <Icon
        width={22}
        height={22}
        className={cn("text-muted-foreground", {
          "text-destructive": destructive,
        })}
      />
      <TextClassContext.Provider
        value={cn("mr-auto", {
          "text-destructive": destructive,
        })}
      >
        {children}
      </TextClassContext.Provider>
      <Icons.ChevronRight className="text-muted-foreground" />
    </Pressable>
  );
};
