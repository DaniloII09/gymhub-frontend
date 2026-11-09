import { LogoutButton } from "./logout-button";
import { SessionInfo } from "./session-info";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-semibold">Hello world</h1>
      <SessionInfo />
      <LogoutButton />
    </div>
  );
}
