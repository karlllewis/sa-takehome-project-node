# Stripe Press - Payment Element Demo
**Welcome to Stripe Press! A simple storefront that takes a live test-mode card payment with Stripe Elements, then shows the buyer exactly what they were charged and the PaymentIntent ID that proves it.**

This demo is built using Node.js & Express as a skeleton. Use this example to explore how Stripe can integrate with a simple single purchase e-commerce business logic, allowing for coverage of multiple regions and payment methods, along with flexibility and security embedded into any website. Once you install this code, and all of its requirememts, you should be able to test this on your own local system to test various use cases

---

## What Does the Demo Do?

| Requirement | Implementation |
| --- | --- |
| Select a book to purchase | `GET /`  => `views/index.hbs` |
| Checkout with **Stripe Elements** | `views/checkout.hbs` + `public/js/checkout.js` |
| Display Total Charged and PaymentIntend ID | `GET /success` => retrieves (server-side) the amount and PaymentIntentID shown as -  `pi_xxx` |

---

## How do I get started?

On your local machine in Terminal execute the following commands

```bash
git clone https://github.com/karlllewis/sa-takehome-project-node.git && cd sa-takehome-project-node
npm install         # install node dependencies
cp sample.env .env         # We Will use this file next to place our API keys.
```

Next, Sign Up for a Stripe Account if you don't already have one. In the upper left-hand corner click on the drop down menu and selct "Switch sandbox" and either create a new sandbox or simply entire **test-mode**. You will be presented with **Two API keys**, both from the [Dashboard -> API keys](https://dashboard.stripe.com/test/apikeys) in **test mode**. We now want to open that .env file we created earlier to paste your keys into this file. This is IMPORTANT and necessary for the demo to work. Check Below for reference:

| Variable in .env | Key Structure | Security Note |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | **Never** Share your secret key or expose this key to the browser |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | It is used to tokenize requests to stripe, but can be shared with browser and public |

Once you have included your keys into the .env file (**note:** do NOT place these keys in sample.env). Within your terminal window inside the repo directory:

```bash
npm start   # start the service from within your directory
```

Open **http://localhost:3000**

Viola. You should see a storefront similar to this
 
![Placeholder for a screenshot of index.hbs](docs/index.png)

Feel free to choose any of the 3 books by clicking on the 'Purchase' button and follow the instructions for inputing a card. As this is a demo, email is not necessary.

**Exercise all four use case paths described below** Any future expiry, any CVC, any postcode (we suggest not using Link now). These card numbers are described in [Stripe's Testing Page](https://docs.stripe.com/testing) if you would like further information and use cases to explore. 

| Input | Expected | 
| --- | --- |
| `4242 4242 4242 4242` | Succeeds -> Displays amount + PaymentIntentId `pi_xxx` |
| `4000 0000 0000 0002` | Declined -> Message should display under the card field |
| `4000 0025 0000 3155` | 3-D Secure Challeng, then succeeds and displays amount + PaymentIntentId |
| Browse to `http://localhost:3000/checkout?item=99` | Fails -> The server refuses to price or show an unknown item |

Every attempt appears in **Dashboard -> Payments** within seconds, with the book title attached as metadata, and every API call is replayable under **Developers -> Logs**. Worth watching alongside the app.

---

## How does this work?

PlaceHolder 

---

## Lets talk Security.

PlaceHolder

---

## Approach, Docs, and Helpful Resources

PlaceHolder

---

## Challenges

PlaceHolder

--

## Extensions and Improvements

PlaceHolder