const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

// Creates the stripe client using your account secret key. Only executes on server
// This is crucial for security. The secret key should never reach the browser
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

// Created a function to house product catalog for reuse within multiple routes
// This function also serves to keep the price on the server-side rather than allowing it 
// to be tampered on the client side. Follows best practices from Stripe Documentation.

function grabItemInfo(item) {
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }
  return { title, amount, error };
};
/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 * 
 * Renders the payment form for a single book. PaymentIntent is not created yet. 
 * The PaymentIntent is asked by the browser. Check public/js/checkout.js for logic
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  const { title, amount, error } = grabItemInfo(item);

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error,
    // Passed through the page so the browser can tell us which item to price
    item: item,
    // Passes the publishable key to be exposed in HTML. Account selection and tokenizes payment details.
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/**
 * Create PaymentIntent route
 * 
 * This is called by the browser as the checkout pages loads. Uses a POST to create state in Stripe.
 */
app.post("/create-payment-intent", async (req, res) => {
  // We only accept the item id from the browser. Not the price.
  const { item } = req.body;

  // Allows for book information to be re-derived server-side from the catalog.
  const { title, amount, error } = grabItemInfo(item);
  

  if (error) {
    return res.status(400).send({ error })
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      // Added Metadata to see information in Stripe Dashboard about the purchase
      // Also following Best Practices from Stripe Docs: https://docs.stripe.com/payments/payment-element/best-practices 
      metadata: {
        item: item,
        title: title,
      },
    });

    // Return the client_secret of the Payment Intent. Needed to authorize
    // user's browser to confirm this a single payment.
    res.send ({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Something went wrong creating your payment.' })
  }
});
/**
 * Success route
 * 
 * Stripe redirects the buyer here after confirmation. Appending 3 parameters:
 * payment_intent, payment_intent_client_secret, and redirect_status
 * 
 */
app.get('/success', async (req, res) => {
  const paymentIntentId = req.query.payment_intent;
  const clientSecret = req.query.payment_intent_client_secret;

  // added a condition that if someone tries to go to the success page without a
  // payment Intent or PI client secret it will return an error
  if (!paymentIntentId || !clientSecret) {
    return res.status(400).send({ error: 'Missing payment details.' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.client_secret !== clientSecret) {
      return res.status(403).send({ error: 'Payment details do not match.' })
    }

    res.render('success', {
      amount: paymentIntent.amount,
      paymentIntentId: paymentIntent.id,
      title: paymentIntent.metadata.title,
      // Creating status for success + processing to have a conditional
      // for the success page to only show 'Success' if the Payment Intent actually succeeds.
      // Processing was added as I experimented with BECS and realized I didnt have webhooks
      succeeded: paymentIntent.status === 'succeeded',
      processing: paymentIntent.status === 'processing'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Unable to retreive payment details.' })
  }
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});
