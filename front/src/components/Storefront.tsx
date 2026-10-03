import App from "../App";
import { CarritoProvider } from "../store";
import type { AuthUser } from "../types";

export function Storefront({ currentUser }: { currentUser: AuthUser | null }) {
  return (
    <CarritoProvider>
      <App currentUser={currentUser} />
    </CarritoProvider>
  );
}