# Stripe Integration Guide

This document provides guidance on setting up and integrating Stripe with your E-commerce Telegram Mini App.

## What is Stripe?

Stripe is a payment processing platform that allows businesses to accept payments online. It provides APIs and tools to build custom checkout experiences.

## Setting Up Stripe

### 1. Create a Stripe Account

1. Go to [Stripe](https://stripe.com/) and sign up for an account
2. Complete the onboarding process to set up your business details

### 2. Get Your API Keys

1. In your Stripe dashboard, go to "Developers" > "API keys"
2. You'll see two types of keys:
   - **Publishable key**: Used in your frontend code
   - **Secret key**: Used in your backend code
3. For development, use the test keys (they start with `pk_test_` and `sk_test_`)
4. Add these to your `.env` files:
   - Backend: `STRIPE_SECRET_KEY=your_stripe_secret_key`
   - Frontend: `REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`

## Integrating Stripe with Your App

### Backend Integration

The backend uses the Stripe Node.js library to create payment intents:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Integration

The frontend uses the Stripe React components to create a checkout form:

```jsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    // Create a payment intent when the page loads
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }), // $10.00
    })
    .then((res) => res.json())
    .then((data) => setClientSecret(data.clientSecret));
  }, []);
  
  return (
    <div>
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
```

### Checkout Form Component

The checkout form component uses the Stripe Elements to collect payment information:

```jsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    const cardElement = elements.getElement(CardElement);
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Jenny Rosen',
        },
      },
    });
    
    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment successful!
      // Update your database, show success message, etc.
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>Pay</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

## Testing Payments

Stripe provides test card numbers for testing payments:

- **Card number**: 4242 4242 4242 4242
- **Expiration date**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

For testing different scenarios, you can use these card numbers:

- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

## Handling Successful Payments

When a payment is successful, you should:

1. Create an order in your database
2. Send a confirmation to the user
3. Update your inventory

```javascript
// After successful payment
if (paymentIntent.status === 'succeeded') {
  // Create order in database
  const orderData = {
    userId: user.id,
    products: cartItems,
    totalAmount,
    paymentIntentId: paymentIntent.id,
    shippingAddress,
  };
  
  await createOrder(orderData);
  
  // Clear cart
  clearCart();
  
  // Show success message
  showSuccessMessage();
  
  // Redirect to success page
  navigate('/order-success');
}
```

## Webhook Integration (Advanced)

For production, you should set up Stripe webhooks to handle asynchronous events:

1. In your Stripe dashboard, go to "Developers" > "Webhooks"
2. Add an endpoint URL (e.g., `https://your-api.com/webhook`)
3. Select the events you want to listen for (e.g., `payment_intent.succeeded`)
4. Implement a webhook handler in your backend:

```javascript
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.send();
});
```

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Node.js Library](https://stripe.com/docs/api?lang=node)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)
