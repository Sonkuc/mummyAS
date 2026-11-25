/**
 * Zkušební režim („Vyzkoušet bez registrace“).
 *
 * Příznak je jen v paměti (proměnná modulu), takže po obnovení stránky nebo
 * restartu aplikace zmizí. V tomto režimu se nevolá backend ani se nic
 * neukládá do AsyncStorage – viz kontroly v api.ts, syncService.ts a ChildContext.
 */
let guestMode = false;

export const isGuestMode = () => guestMode;

export const setGuestMode = (value: boolean) => {
  guestMode = value;
};

export class GuestModeError extends Error {
  constructor() {
    super("Zkušební režim: data se neukládají na server");
    this.name = "GuestModeError";
  }
}
