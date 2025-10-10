import * as React from "react";
import { View } from "react-native";

import { cn } from "@turbostarter/ui";

import { Text, TextClassContext } from "./text";

import type { Icon } from "./icons";
import type { ViewProps } from "react-native";

function Alert({
  className,
  variant,
  children,
  icon: Icon,
  iconClassName,
  ...props
}: ViewProps &
  React.RefAttributes<View> & {
    icon?: Icon;
    variant?: "default" | "destructive";
    iconClassName?: string;
  }) {
  return (
    <TextClassContext.Provider
      value={cn(
        "text-foreground text-sm",
        variant === "destructive" && "text-destructive",
        className,
      )}
    >
      <View
        role="alert"
        className={cn(
          "bg-card border-border relative w-full rounded-lg border px-4 pt-3.5 pb-2",
          className,
        )}
        {...props}
      >
        {Icon && (
          <View className="absolute top-3 left-3.5">
            <Icon
              className={cn(
                variant === "destructive" && "text-destructive",
                iconClassName,
              )}
              size={16}
            />
          </View>
        )}
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      className={cn(
        "font-sans-medium mb-1 ml-0.5 min-h-4 pl-6 leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  const textClass = React.useContext(TextClassContext);
  return (
    <Text
      className={cn(
        "text-muted-foreground ml-0.5 pb-1.5 pl-6 text-sm leading-relaxed",
        textClass?.includes("text-destructive") && "text-destructive/90",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
