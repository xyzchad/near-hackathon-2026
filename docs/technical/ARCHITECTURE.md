# Architecture

The application in `app-web/` uses React and Next.js. It can run with Vinext on Sites using D1 and R2, or with native Next.js and Supabase. See the [application README](../../app-web/README.md) for configuration and commands.

A bill stores the confirmed total, conversion reference, equal shares and the organizer's confirmed Confidential Intents receiving account. The account is fixed once the bill is created. Each payer gets a separate capability link; the organizer has a separate management capability. Receipt access and bill operations require the appropriate capability. Links are bearer secrets: anyone holding one can exercise the access it grants.

For live routes, the server requests exact-output NEAR Intents quotes for confidential USDC, checks the returned routing fields and signature, and records payment attempts. Zcash and Solana payers send the quoted input using their wallet. The confidential-balance adapter generates an intent for a compatible external NEAR wallet to sign explicitly; this route remains disabled in the public app. Background reconciliation checks provider status and output before updating a share; a quote or deposit notification alone does not establish settlement. A database constraint rejects duplicate deposit instructions across payers.

Receipt upload optionally sends the image to NEAR AI when configured and explicitly selected. Extracted fields are suggestions requiring user confirmation; failures fall back to manual entry. Wallet/device, refund and full funded acceptance remain incomplete. See [privacy and payment limits](PRIVACY.md).
