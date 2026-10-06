import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Alert, Field, Input, Select, Textarea, Button } from '@/components/ui/index.jsx';
import { PostForm, Switch } from '@/components/ui/client.jsx';
import { requireOwner } from '@/lib/auth.js';
import { getPaymentMethods } from '@/lib/queries.js';
import { PAYMENT_METHODS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment Settings — DarazEA management' };

const COPY = {
  card: { title: 'Card gateway', blurb: 'Visa, Mastercard and American Express' },
  wallet: { title: 'Mobile wallet', blurb: 'eZ Cash, mCash and KOKO' },
  bank_transfer: { title: 'Bank transfer', blurb: "Shoppers pay into the store's account" },
  paypal: { title: 'PayPal', blurb: 'Shoppers pay from a PayPal balance or card' },
  cod: { title: 'Cash on delivery', blurb: 'The courier collects the money at the door' },
};

export default async function PaymentSettingsPage() {
  const viewer = await requireOwner('/admin/settings/payments');
  const methods = await getPaymentMethods();
  const ordered = ['card', 'wallet', 'bank_transfer', 'paypal', 'cod']
    .map((method) => methods.find((row) => row.method === method) || { method, is_enabled: method === 'cod', store_account_details: {} });

  return (
    <AdminPage viewer={viewer} active="/admin/settings/payments" title="Payment Settings" subtitle="Last saved just now">
      <p className="lede">Choose which online payment methods shoppers are offered at Checkout, and keep the store's own account details for each one. Cash on delivery is always offered.</p>

      <div className="stack u-mt5">
        {ordered.map((method) => {
          const details = method.store_account_details || {};
          return (
            <Card
              key={method.method}
              title={COPY[method.method].title}
              className={method.is_enabled ? '' : 'card--flat'}
              aside={<><Badge tone={method.is_enabled ? 'ok' : 'off'}>{method.is_enabled ? 'On' : 'Off'}</Badge> <span className="u-small u-muted">{COPY[method.method].blurb}</span></>}
            >
              <PostForm
                action="/api/admin/payments"
                hidden={{ method: method.method, is_enabled: method.is_enabled }}
                submitLabel="Save this method"
                submitVariant="primary"
                testId={`payment-${method.method}`}
                footer={null}
              >
                {method.method === 'card' && (
                  <div className="field-row">
                    <Field label="Gateway" htmlFor="card-gateway">
                      <Select id="card-gateway" defaultValue={details.gateway || 'LankaPay Card Gateway'}>
                        <option>LankaPay Card Gateway</option>
                        <option>PayHere Card Gateway</option>
                        <option>Another gateway</option>
                      </Select>
                    </Field>
                    <Field label="Merchant ID" htmlFor="card-merchant">
                      <Input id="card-merchant" defaultValue={details.merchant_id || ''} />
                    </Field>
                  </div>
                )}

                {method.method === 'wallet' && (
                  <div className="field-row field-row--3">
                    <Field label="Wallet provider" htmlFor="wallet-provider">
                      <Select id="wallet-provider" defaultValue={details.provider || 'eZ Cash'}>
                        <option>eZ Cash</option><option>mCash</option><option>KOKO</option>
                      </Select>
                    </Field>
                    <Field label="Wallet merchant number" htmlFor="wallet-number">
                      <Input id="wallet-number" defaultValue={details.merchant_number || ''} />
                    </Field>
                    <Field label="Account name on the wallet" htmlFor="wallet-name">
                      <Input id="wallet-name" defaultValue={details.account_name || ''} />
                    </Field>
                  </div>
                )}

                {method.method === 'bank_transfer' && (
                  <>
                    <div className="field-row">
                      <Field label="Bank" htmlFor="bank-name"><Input id="bank-name" defaultValue={details.bank || ''} /></Field>
                      <Field label="Account name" htmlFor="bank-account-name"><Input id="bank-account-name" defaultValue={details.account_name || ''} /></Field>
                      <Field label="Account number" htmlFor="bank-account-number"><Input id="bank-account-number" defaultValue={details.account_number || ''} /></Field>
                      <Field label="Branch" htmlFor="bank-branch"><Input id="bank-branch" defaultValue={details.branch || ''} /></Field>
                    </div>
                    <Field label="What the shopper is told" htmlFor="bank-instructions" hint="Shown at Checkout when a shopper picks bank transfer, and again on the order email.">
                      <Textarea id="bank-instructions" name="shopper_instructions" rows="4" defaultValue={method.shopper_instructions || ''} />
                    </Field>
                  </>
                )}

                {method.method === 'paypal' && (
                  <div className="field-row">
                    <Field label="PayPal account email" htmlFor="paypal-email"><Input id="paypal-email" defaultValue={details.email || ''} /></Field>
                    <Field label="PayPal merchant ID" htmlFor="paypal-merchant"><Input id="paypal-merchant" defaultValue={details.merchant_id || ''} /></Field>
                  </div>
                )}

                {method.method === 'cod' && (
                  <Alert tone="soft" title="Always offered">
                    The order is recorded straight away and the money is collected when the parcel arrives. Staff mark it collected on the order.
                  </Alert>
                )}

                {method.method !== 'cod' && (
                  <p className="hint">
                    {method.is_enabled
                      ? 'Switched on: shoppers are offered this at Checkout.'
                      : 'Switched off: shoppers are not shown this at Checkout until it is turned on.'}
                  </p>
                )}

                <div className="u-flex u-mt3">
                  <label className="switch" style={{ gap: 10 }}>
                    <input type="hidden" name="enable" value="0" />
                    <Switch name="enable" defaultChecked={method.is_enabled} label={`${COPY[method.method].title} switched on`} />
                    <span className="u-small">{method.is_enabled ? 'On' : 'Off'} — turn this method on or off</span>
                  </label>
                </div>

                <button className="btn btn--primary u-mt3" type="submit" data-testid={`save-${method.method}`}>Save {PAYMENT_METHODS[method.method]}</button>
              </PostForm>
            </Card>
          );
        })}
      </div>

      <div className="u-flex u-mt5">
        <Button href="/checkout" variant="ghost">View checkout</Button>
        <span className="u-small u-muted">Changes reach Checkout as soon as they are saved.</span>
      </div>

      <Alert tone="warn" className="u-mt4" title="What a live provider needs">
        Card, wallet and PayPal payments are authorised by the store's own provider before an order is recorded. Until real, live
        credentials are in place, an attempt is refused exactly as the approved Checkout screen shows: no order, no coupon use and
        no stock movement, and the shopper is asked to try again or pay cash on delivery.
      </Alert>
    </AdminPage>
  );
}
