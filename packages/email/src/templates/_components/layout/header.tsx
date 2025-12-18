import { Text } from "@react-email/components";

interface HeaderProps {
  readonly origin: string;
}

export const Header = ({ origin: _origin }: HeaderProps) => {
  return (
    <Text className="mb-10 text-3xl font-bold">
      🎅 SantaCall
    </Text>
  );
};
