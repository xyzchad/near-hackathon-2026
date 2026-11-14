# Privacy and payment limits

Each payer receives an individual checkout capability. The organizer's receiving account is not included in diner responses. Capability links are bearer secrets, so share each link only with its intended recipient. Organizer access is recovered through its private link or browser storage; the receiving address is not an authorization credential. Uploaded receipts and bill details are stored by the configured backend and made available through authorized capabilities; this is not a claim that nothing is stored server-side.

The organizer supplies a `nearcom:` internal receiving identifier for Confidential Intents USDC. This is a receiving identifier, not proof of ownership, and it must not be treated as an ordinary blockchain deposit address. Confidential balances and internal activity are not publicly browsable like ordinary blockchain transactions, but providers process payment and routing data. A private balance does not hide unrelated public wallet history, nor does this app guarantee anonymity or unlinkability.

Privacy depends on the payer's route:

- **Zcash:** a shielded source can protect sender information, but the provider deposit and any transparent refund may be publicly visible. The payer must provide a supported, payer-controlled transparent refund address. Wallet behavior and refunds need device testing.
- **Solana USDC:** an ordinary transfer publicly exposes the sender and amount. Confidential receiving does not hide this source transaction.
- **Existing confidential balance:** a compatible external NEAR wallet can sign a generated intent after review. The implementation does not provide a near.com passkey signing bridge; confidential sending remains disabled in the pilot.

Provider status and actual output are necessary to assess settlement. A dry quote, generated payment URI, simulation or browser test does not prove wallet compatibility, confidential credit or refund behavior. Device, refund and full funded acceptance are outstanding. Consult the [NEAR Intents confidential documentation](https://docs.near-intents.org/integration/market-makers/confidential-intents) and [near.com terms](https://near.com/terms) for provider boundaries.

Optional receipt reading sends the uploaded image to OCR.space when the organizer opts in. OCR.space says it deletes uploaded files after processing; see its [privacy policy](https://ocr.space/privacypolicy). The server stores the image with the configured backend regardless of extraction. OCR text is used to suggest a merchant and total, and a currency only when unambiguous; extraction may fail or be wrong, and users must review and confirm the details or enter them manually.

NEAR AI is also optional when configured and credited. Model providers and privacy tiers differ; choose an appropriate image-capable model and review [NEAR AI model privacy tiers](https://docs.near.ai/cloud/models). This app does not verify model attestation or response signatures.
