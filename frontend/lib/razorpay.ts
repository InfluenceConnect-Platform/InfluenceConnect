// Loads the Razorpay Checkout script once (idempotent — safe to call from
// both billing pages) and exposes a typed helper to open it.

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
}

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  await loadCheckoutScript();
  const RazorpayCtor = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
  new RazorpayCtor(options).open();
}
