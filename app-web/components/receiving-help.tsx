"use client";
import { useEffect, useRef } from "react";

export function ReceivingHelp() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  function restore() {
    document.body.style.overflow = previousOverflow.current;
    trigger.current?.focus();
  }
  useEffect(() => {
    const element = dialog.current;
    return () => { if (element?.open) document.body.style.overflow = previousOverflow.current; };
  }, []);
  function open() {
    previousOverflow.current = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }
  return (
    <>
      <button ref={trigger} type="button" className="text-button receiving-help-link" onClick={open}>
        Where do I find this?
      </button>
      <dialog ref={dialog} className="receiving-dialog" aria-labelledby="receiving-help-title" onClose={restore}
        onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}>
        <div className="receiving-dialog-content">
          <div className="dialog-heading">
            <h2 id="receiving-help-title">Find your near.com address</h2>
            <button type="button" className="dialog-close" aria-label="Close address help" autoFocus onClick={() => dialog.current?.close()}>×</button>
          </div>

          <p>New to near.com? Follow these steps, then return here with your receiving address.</p>
          <ol className="receiving-steps receiving-visual-steps">
            <li>
              <h3>Open near.com and sign in</h3>
              <p>Visit <a href="https://near.com" target="_blank" rel="noreferrer">near.com</a>. Sign in, or follow its prompts to create an account.</p>
            </li>
            <li>
              <h3>Turn on Confidential Mode</h3>
              <p>Find <strong>Confidential Mode</strong> in the sidebar, turn it on and authenticate if asked. This opens the confidential balance within your near.com account.</p>
            </li>
            <li>
              <h3>Account → My address</h3>
              <p>Open <strong>Account</strong> at the bottom of the menu, then choose <strong>My address</strong>.</p>
              <figure className="address-guide-image account-menu-guide">
                <img src="/help/near-address/account-menu.png" width="652" height="984" alt="near.com account menu. Open Account at the bottom, then My address above Help articles. Both targets are outlined in red." loading="lazy" />
                <span className="address-guide-target target-account" aria-hidden="true" />
                <span className="address-guide-target target-my-address" aria-hidden="true" />
              </figure>
            </li>
            <li>
              <h3>Read the notice and show your address</h3>
              <p>This is an <strong>internal near.com address</strong>. Read the warning, tick the acknowledgement, then choose <strong>Show address</strong>.</p>
              <figure className="address-guide-image show-address-guide">
                <img src="/help/near-address/show-address.png" width="862" height="730" alt="near.com internal-address notice. The acknowledgement checkbox and Show address button are outlined in red." loading="lazy" />
                <span className="address-guide-target target-acknowledgement" aria-hidden="true" />
                <span className="address-guide-target target-show-address" aria-hidden="true" />
              </figure>
            </li>
            <li>
              <h3>Copy the address and paste it here</h3>
              <p>Choose <strong>Copy address</strong>. Return to split/d/bill and paste the full address, including <strong>nearcom:</strong>, into the receiving-address field.</p>
              <figure className="address-guide-image copy-address-guide">
                <img src="/help/near-address/copy-address.png" width="880" height="546" alt="near.com address panel with Copy address outlined in red, above Share with other near.com users." loading="lazy" />
                <span className="address-guide-target target-copy-address" aria-hidden="true" />
              </figure>
            </li>
          </ol>

          <p className="field-hint">Use the internal address, not a token’s blockchain deposit address. Never send a blockchain transfer directly to a nearcom: address.</p>
          <div className="dialog-actions">
            <a className="button secondary" href="https://near.com" target="_blank" rel="noreferrer">Open near.com ↗</a>
            <button type="button" className="button primary" onClick={() => dialog.current?.close()}>Done</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
