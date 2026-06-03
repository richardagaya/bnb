/**
 * Parse Firebase email action links (password reset, etc.).
 * Supports query string and hash fragments from Firebase / custom action URLs.
 */
export type FirebaseEmailAction = {
  mode: string;
  oobCode: string;
};

export function parseFirebaseActionLink(
  searchParams: URLSearchParams,
  hash = ""
): FirebaseEmailAction | null {
  const fromQuery = readActionParams(searchParams);
  if (fromQuery.oobCode) {
    return {
      mode: fromQuery.mode || "resetPassword",
      oobCode: fromQuery.oobCode,
    };
  }

  if (hash) {
    const fromHash = readActionParams(new URLSearchParams(hash.replace(/^#/, "")));
    if (fromHash.oobCode) {
      return {
        mode: fromHash.mode || "resetPassword",
        oobCode: fromHash.oobCode,
      };
    }
  }

  return null;
}

function readActionParams(params: URLSearchParams) {
  return {
    mode: params.get("mode") ?? "",
    oobCode: params.get("oobCode") ?? params.get("oobcode") ?? "",
  };
}

export function isPasswordResetAction(
  action: FirebaseEmailAction | null
): action is FirebaseEmailAction {
  return !!action && action.mode === "resetPassword" && !!action.oobCode;
}
