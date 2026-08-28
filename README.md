# Stripe Press - Payment Element Demo
**Welcome to Stripe Press! A simple storefront that takes a live test-mode card payment with Stripe Elements, then shows the buyer exactly what they were charged and the PaymentIntent ID that proves it.**

This demo is built using Node.js & Express as a skeleton. Use this example to explore how Stripe can integrate with a simple single purchase e-commerce business logic, allowing for coverage of multiple regions and payment methods, along with flexibility and security embedded into any website. Once you install this code, and all of its requirements, you should be able to test this on your own local system to test various use cases

---

## What Does the Demo Do?

| Requirement | Implementation |
| --- | --- |
| Select a book to purchase | `GET /`  -> `views/index.hbs` |
| Checkout with **Stripe Elements** (not Stripe Checkout) | `views/checkout.hbs` + `public/js/checkout.js` |
| Display Total Charged and PaymentIntent ID | `GET /success` -> retrieves (server-side) the amount and PaymentIntent ID shown as -  `pi_xxx` |

---

## How do I get started?

As this is a Node.js based project please make sure you have installed Node, by [following the instructions here](https://nodejs.org/en/download). 

On your local machine in Terminal execute the following commands. 

```bash
git clone https://github.com/karlllewis/sa-takehome-project-node.git && cd sa-takehome-project-node
npm install         # install node dependencies (you could use pnpm or yarn as well)
cp sample.env .env         # We will use this file next to place our API keys.
```

Next, Sign Up for a Stripe Account if you don't already have one. In the upper left-hand corner click on the drop down menu and select "Switch sandbox" and either create a new sandbox or simply entire **test-mode**. You will be presented with **Two API keys**, both from the [Dashboard -> API keys](https://dashboard.stripe.com/test/apikeys) in **test mode**. We now want to open that .env file we created earlier to paste your keys into this file. This is IMPORTANT and necessary for the demo to work. Check Below for reference:

| Variable in .env | Key Structure | Security Note |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | **Never** share your secret key or expose this key to the browser |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Used to identify your account to Stripe.js and tokenize payment details, but can be shared with browser and public |

### Start

Once you have included your keys into the .env file (**note:** do NOT place these keys in sample.env). Within your terminal window inside the repo directory:

```bash
npm start   # start the service from within your directory
```

Open **http://localhost:3000**

You should see a storefront similar to the screenshot below
 
![screenshot of index.hbs](docs/index.png)

### Select 
Feel free to choose any of the 3 books by clicking on the 'Purchase' button and follow the instructions for entering a card. As this is a demo, email is not necessary.

![screenshot of checkout.hbs](docs/checkout.png)

**Exercise all four use case paths described below** Any future expiry, any CVC, any postcode. Avoid using Link while testing. These card numbers are described in [Stripe's Testing Page](https://docs.stripe.com/testing) if you would like further information and use cases to explore. 

| Input | Expected | 
| --- | --- |
| `4242 4242 4242 4242` | Succeeds -> Displays amount + PaymentIntent ID `pi_xxx` |
| `4000 0000 0000 0002` | Declined -> Message should display under the card field |
| `4000 0025 0000 3155` | 3-D Secure Challenge, then succeeds and displays amount + PaymentIntent ID |
| Browse to `http://localhost:3000/checkout?item=99` | Fails -> Shows an No item found error, renders an empty form, but is blocked from receiving a client secret |
| **AU Direct Debit:** BSB `000000` Account No. `000123456` (Any email and name) | Processing -> This show the user that payment is processing as opposed to Succeeding |


### Success 
Every attempt appears in **Dashboard -> Payments** within seconds, with the book title attached as metadata, and every API call is replayable under **Developers -> Logs**. Worth watching alongside the app. Your Succeeded page should look similar to the screenshot below

![screenshot of success.hbs](docs/success.png)

---

## How does this Demo work?

This demo uses the PaymentIntent API and Stipe Web Elements to provide a checkout experience for the Stripe Press Book Store. This was an intentonal decision to use a lower level API for demo purposes. **Stripe generally recommends most integrations use the [Checkout Sessions API](https://docs.stripe.com/payments/quickstart) as it covers more use cases including Payment Intents**.  The visual diagram below shows the important interactions between the 4 main architectural pieces: The customer, The browser, The server, and Stripe.


```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant B as Browser
    participant S as Node server
    participant St as Stripe

    C->>B: Picks book no. 2
    B->>S: GET /checkout?item=2
    S-->>B: Page + publishable Key<br/>(no card fields yet)

    B->>S: Ask for payment for item 2<br/>(POST /create-payment-intent)
    Note over S: Server looks up price using grabItemInfo() function.<br/>The browser never sends amount.
    S->>St: paymentIntents.create({ amount, currency })<br/>(Create PaymentIntent for A$25) 
    St-->>S: client_secret
    S-->>B: client_secret
    Note over B: Payment Element mounts.<br/>Card fields appear now.

    C->>St: Enter card into Stripe's iframe
    Note over C,St: Card details go straight to Stripe. Server never sees card data.
    B->>St: stripe.confirmPayment()<br/>(Confirms the payment)
    St-->>B: Sends the customer back to /success
    B->>S: GET /success?payment_intent=pi_...
    S->>St: paymentIntents.retrieve(paymentIntent.id)
    Note over S,St: Asks whether payment actually succeeded
    St-->>S: status, amount, metadata
    Note over S: Ignores redirect_status from URL.<br/>Confirms the client_secret matches.
    S-->>B: Confirmation page with amount and pi_...
```

### Some Important Considerations 
1) The browser tells the server which book with its item number, but the amount it cost is derived from the server. The prices come from the grabItemInfo() function within app.js.The request could be tampered by changing the item number (changing which book you purchase), but the amount is never passed from the client side for payment. This is per Stripe's own best-practices documentation to create the PaymentIntent as soon as you know the amount. 
2) The  Payment Element requires a client secret in order to mount, but in order to receive a client secret a PaymentIntent needs to be made. The POST is used to create a PaymentIntent when the checkout page loads (allowing for a client secret to also be generated). This means there is potential for the PaymentIntent to sit on the Dashboard waiting but never receiving payment.
3) Stripe.js renders the Payment Element within an iframe from Stripe's own origin, so whenever a user puts in payment details, that information is passed directly to Stripe and is never stored on the server or logs. This is crucial as its one of the main reasons customers benefit from Payment Element over custom forms where PCI compliance plays a much larger role.
4) The success page of this demo actually reaches out to Stripe to get the status of the payment as opposed to simply refering to the redirect_status. This is intentional to not trust information from the client side as it could be tampered with. The API call to Stripe to obtain the status is server-side using secret key.
5) This demo has been tested for card payments, but has automatic_payment_methods enabled. Stripe can offer methods that take time to settle, but we have left the use of webhooks and more advanced topics for a later date.

---

## Approach, Docs, and Helpful Resources

When attempting to develop this demo myself the first approach was to familiarize myself with the concept of the Payment Element and how and why would they be  beneficial for an organization looking to provide secure and adaptable checkout options for their customers. I used Stripe's documentation to understand the how and why. This included the following docs:
*  [Stripe API 101](https://docs.stripe.com/payments-api/tour )
*  [Understanding Payment Element](https://docs.stripe.com/payments/payment-element )
*  [Payment Element Quick Start Guide](https://docs.stripe.com/payments/quickstart-payment-intents )


The next step was to follow along with the quickstart guide and to use the example code as guides and templates for introducing the necessary changes to the existing codebase. This included creating the PaymentIntent route, configuring checkout.js, and applying the proper Payment Element into the checkout page. The quick start guide is extremely useful but I used other documentation to really adjust it to my needs. I've included them below:
* [Understanding PaymentIntents](https://docs.stripe.com/payments/payment-intents)
* [PaymentIntents Lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle)
* [Understanding `stripe.confirmPayment()`](https://docs.stripe.com/js/payment_intents/confirm_payment)
* [Understanding `payment_intent` object](https://docs.stripe.com/api/payment_intents/object)

After getting the payment element to appear and accept my first card payment. I set out to learn more about security best practices, how to test and approach testing, and how to introduce some general best practices into the existing integration. The Docs that helped with that are:
* [Payment Element Best Practices](https://docs.stripe.com/payments/payment-element/best-practices)
* [Card Testing](https://docs.stripe.com/testing)
* [Australia BECS Testing](https://docs.stripe.com/payments/au-becs-debit)
* [API Key Best Practices](https://docs.stripe.com/keys-best-practices) 

Lastly, I decided to add some small bits of polish to make it more relevant for my region (Australia). So I changed the amount to use aud and updated the HTML to reflect A$ and enabled both BECS and PayTo payment methods, so it would look familiar to what I am used to seeing at home. 

---

## Challenges

> "Behind every beautiful thing, there's some kind of pain"
>
> *-- Bob Dylan*


Challenges were certainly felt on this journey. All of the problems encountered were worth solving, but the most notable were:

1) Let's start with the first. After creating the `/create-payment-intent` route within `app.js` and configuring `checkout.js` according to the quickstart guide, I kept receiving "No Item Found" exceptions when attempting to select a book. This ended up being a two part problem. The initial catalog was only placed within a switch/case block within the the `/checkout` route AND the publishable key was not being sent to he browser because I was trying to have it render in the static js file instead within the handlebars file (which I admit took some heroic googling to finally figure out). So for ease, I created the same switch/case block in the `/create-payment-intent`, passing the amount from the block and it worked. This is pragmatic programming and avoids duplicates.
2) This led to issue # 2. I realized I was reusing the same code in two different routes and decided this would make more sense using an array to house the product catalog so I could have a single source of truth in this demo. That of course introduced many complexities around how to deal with undefined values, or items that didnt exist within the array as well as attempting to use the `find()` function. I ended up keeping the switch/case structure and using a function instead called `grabItemInfo()` which allowed me to keep a lot of the same structure within both the `/checkout` and `/create-payment-intent` routes and delivered the same outcome as the inital thoughts of using an array.
3) My next challenge came after tried testing various payment methods and realized that there was no condition to check for if a payment actually succeeded and if I were to use BECS or PayTo or another Australian based payment outside of cards, the only way to do so would be to introduce webhooks. I decided to created simple conditionals being rendered in `/success` to only show the message after calling `stripe.paymentIntents.retrieve()` and using the status object to show successful vs processing payments.
4) My last challenge was really just cleaning up the code to use try/catch blocks so the npm server would stop crashing. So I refreshed my knowledge on javascript best practices and refactored the code to use try/catch blocks when appropriate. This led to much smoother testing and less server crashes with npm

## Extensions and Improvements

**Although the demo is correct and fit to purpose on the path it was designed for and can handle a few failure cases, it certainly lacks durability**. Improvements I would suggest for making this more robust:

| Gap | Fix | Why it matters |
| --- | --- | --- |
|Full-access secret key in `.env` | Use [Restricted Keys](https://docs.stripe.com/keys/restricted-api-keys) scoped to PaymentIntents, rotated on a schedule, and held in a more robust secrets manager | For a production deployment, practicing the principle least privilege significantly lowers cyber attack risk |
|Catalog currently in a `switch` | Move to a proper datastore/DB, or to Stripe Products | Changing prices or expanding catalog would require more refactoring than it should| 
|Duplicate PaymentIntents on retry | [Idempotency key](https://docs.stripe.com/payments/payment-intents#best-practices) on `paymentIntents.create()` | A double-click could lead to duplicates, so its best to follow best practices for Idempotency |
|Payment State trusted from a browser round-trip | Use signed [webhooks](https://docs.stripe.com/webhooks/handling-payment-events) | The webhook would allow for more robust delivery guarantee. Use it with signature verification from Stripe|
|Limited support for other Stripe Products | Use [Checkout Sessions API](https://docs.stripe.com/payments/quickstart) instead of Payment Intents API | This would allow for more robust coverage of use cases such as tax, subscriptions, and adaptive pricing|