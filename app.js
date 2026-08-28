const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

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

// Creatd a function to house product catalogue for reuse within multiple routes
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
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  const { title, amount, error } = grabItemInfo(item);

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error,
    item: item,
    // Passes the publishable key to be exposed in HTML. Tokenizes payment details.
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

app.post("/create-payment-intent", async (req, res) => {
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
 */
app.get('/success', async (req, res) => {
  const paymentIntentId = req.query.payment_intent;
  const clientSecret = req.query.payment_intent_client_secret;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.client_secret !== clientSecret) {
      return res.status(403).send({ error: 'Payment details do not match.' })
    }

    res.render('success', {
      amount: paymentIntent.amount,
      paymentIntentId: paymentIntent.id,
      title: paymentIntent.metadata.title,
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
