import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { View } from "react-native";

import { SocialProvider } from "@turbostarter/auth";
import { useTranslation } from "@turbostarter/i18n";
import { capitalize } from "@turbostarter/shared/utils";
import { Button } from "@turbostarter/ui-mobile/button";
import { Icons } from "@turbostarter/ui-mobile/icons";
import { Spin } from "@turbostarter/ui-mobile/spin";
import { Text } from "@turbostarter/ui-mobile/text";

import { authClient } from "~/lib/auth";
import { auth } from "~/modules/auth/lib/api";

import type { SVGProps } from "react";

const ICONS: Record<SocialProvider, React.FC<SVGProps<SVGElement>>> = {
  [SocialProvider.GITHUB]: Icons.Github,
  [SocialProvider.GOOGLE]: Icons.Google,
};

export default function AccountsScreen() {
  const { t, i18n } = useTranslation(["auth", "common"]);

  const { data: session } = authClient.useSession();

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    ...auth.queries.accounts.getAll,
    enabled: !!session?.user.id,
  });

  const accounts = data ?? [];
  const socials = accounts.filter((account) =>
    Object.values(SocialProvider).includes(account.providerId),
  );
  const missing = Object.values(SocialProvider).filter(
    (provider) => !socials.some((social) => social.providerId === provider),
  );

  const connect = useMutation({
    ...auth.mutations.accounts.connect,
    onSuccess: async () => {
      await queryClient.invalidateQueries(auth.queries.accounts.getAll);
    },
  });

  const disconnect = useMutation({
    ...auth.mutations.accounts.disconnect,
    onSuccess: async () => {
      await queryClient.invalidateQueries(auth.queries.accounts.getAll);
    },
  });

  const handleDisconnect = (provider: SocialProvider) => {
    Alert.alert(
      t("account.accounts.disconnect.cta", {
        provider: capitalize(provider),
      }),
      t("account.accounts.disconnect.disclaimer", {
        provider: capitalize(provider),
      }),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("continue"),
          onPress: () => disconnect.mutate({ providerId: provider }),
        },
      ],
    );
  };

  return (
    <View className="bg-background flex-1 gap-6 p-6">
      <Text className="text-muted-foreground font-sans-medium text-base">
        {t("account.accounts.description")}
      </Text>

      {isLoading ? (
        <View className="p-6">
          <Spin>
            <Icons.Loader2 className="text-foreground mx-auto size-6" />
          </Spin>
        </View>
      ) : (
        <>
          {socials.length > 0 && (
            <View className="border-border overflow-hidden rounded-lg border">
              {socials.map((social) => {
                const provider = social.providerId as SocialProvider;
                const Icon = ICONS[provider];

                return (
                  <View
                    key={social.accountId}
                    className="border-border flex-row items-center border-b p-4 last:border-b-0"
                  >
                    <Icon className="text-foreground size-10" />
                    <View className="ml-3 flex-1">
                      <Text className="font-sans-medium capitalize">
                        {social.providerId}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {t("account.accounts.connectedAt", {
                          date: social.updatedAt.toLocaleDateString(
                            i18n.language,
                          ),
                        })}
                      </Text>
                    </View>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={accounts.length === 1 || disconnect.isPending}
                      onPress={() => handleDisconnect(provider)}
                    >
                      {disconnect.isPending &&
                      disconnect.variables.providerId === provider ? (
                        <Spin>
                          <Icons.Loader2 className="text-foreground size-5" />
                        </Spin>
                      ) : (
                        <Icons.Trash className="text-foreground" size={20} />
                      )}
                    </Button>
                  </View>
                );
              })}
            </View>
          )}

          {missing.length > 0 && (
            <View className="border-border gap-3 rounded-lg border border-dashed px-5 py-4">
              <Text className="font-sans-medium">{t("addNew")}</Text>
              <View className="bg-border h-px" />
              <View className="flex-row flex-wrap gap-2">
                {missing.map((provider) => {
                  const Icon = ICONS[provider as SocialProvider];

                  return (
                    <Button
                      key={provider}
                      variant="outline"
                      disabled={connect.isPending}
                      onPress={() => connect.mutate({ provider })}
                      className="h-[44px] flex-row items-center gap-2 px-4"
                    >
                      {connect.isPending &&
                      connect.variables.provider === provider ? (
                        <Spin>
                          <Icons.Loader2 className="size-5" />
                        </Spin>
                      ) : (
                        <Icon className="text-foreground size-6" />
                      )}
                      <Text className="capitalize">{provider}</Text>
                    </Button>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}

      <Text className="text-muted-foreground -mt-3 max-w-80 text-sm">
        {t("account.accounts.info")}
      </Text>
    </View>
  );
}
