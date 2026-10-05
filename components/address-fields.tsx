import type { Address } from "@/lib/address";

/** The shipping address inputs, shared by the cart, the account page and order edits. */
export function AddressFields({ defaults }: { defaults?: Partial<Address> | null }) {
  const d = defaults ?? {};
  return (
    <>
      <input name="name" required defaultValue={d.name} placeholder="Full name" autoComplete="name" className="input" />
      <input name="line1" required defaultValue={d.line1} placeholder="Street address" autoComplete="address-line1" className="input" />
      <input name="line2" defaultValue={d.line2} placeholder="Apartment, suite (optional)" autoComplete="address-line2" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <input name="city" required defaultValue={d.city} placeholder="City" autoComplete="address-level2" className="input" />
        <input name="state" required defaultValue={d.state} placeholder="State" autoComplete="address-level1" className="input" />
        <input name="postal_code" required defaultValue={d.postal_code} placeholder="ZIP code" autoComplete="postal-code" className="input" />
        <select name="country" defaultValue={d.country ?? "US"} className="input">
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
      </div>
      <input name="phone" type="tel" defaultValue={d.phone} placeholder="Phone number (optional)" autoComplete="tel" className="input" />
    </>
  );
}
