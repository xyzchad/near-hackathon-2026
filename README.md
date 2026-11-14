# split/d/bill

<img src="app-web/public/app-icon-192.png" alt="split/d/bill icon" width="96" />

Split a shared receipt into individual USDC reimbursement requests. Built for friends meeting across borders who use different currencies and want to keep the organizer's personal wallet out of the group chat.

[Open split/d/bill](https://split-d-bill.vercel.app)

![One receipt becomes separate payment requests and confidential USDC for the organizer](docs/flow.svg)

## How it works

1. Upload a receipt or enter a bill manually, then confirm its total and currency. Receipt extraction is not yet connected, so uploaded details must be entered manually.
2. Enter the organizer's Confidential Intents receiving address and review the equal USDC shares. The organizer's own share is excluded from reimbursement requests.
3. Share each private checkout link with its intended payer and use the organizer link to track progress. Solana and Zcash requests use separate deposit addresses for each payer; the app rejects a duplicate before displaying it.

The public app can create real payment requests for **Zcash from VIZOR or Zodl** and **Solana USDC**, routed through NEAR Intents toward the organizer's confidential USDC balance. Wallet compatibility and refunds still need broader verification. Sending from an existing NEAR Confidential Intents balance is not enabled.

## Privacy

Each payer receives a separate private checkout link; anyone with a link can access its associated request, so share it carefully. The organizer recovery link grants access to the bill and should also be kept private.

Privacy depends on the payment route. A shielded Zcash source does not make every part of a payment private: deposit details can be public and routing providers process payment data. Ordinary Solana USDC transfers expose the sender and amount on-chain. The app does not promise universal anonymity or unlinkability. See [privacy details](docs/technical/PRIVACY.md).

## NEAR Hackathon tracks

- **Real-World Money**: stablecoin reimbursements for shared real-world expenses.
- **Privacy & Private AI**: shielded-source Zcash and confidential receiving, with route-specific privacy limits; receipt processing is not private AI.
- **Social Money**: separate payer links and shared reimbursement progress for a group.

Project code and documentation are available under the [MIT License](LICENSE). The bundled Space Grotesk font retains its own Open Font License.

[Developer setup](app-web/README.md) · [Architecture](docs/technical/ARCHITECTURE.md)
