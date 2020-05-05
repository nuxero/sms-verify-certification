# Implementing Certification Project for SMS & Verify API certification

This repo contains the code for the [certification project](https://vonage-workshop.nexmodev.com/verify/certification/certification-project/) on using the Nexmo Verify ans SMS API. It is written in Node.js using the Express framework.

## Get the code
Follow these steps to get your own version of this up and running:

```bash
git clone https://github.com/nuxero/sms-verify-certification.git
cd sms-verify-certification && npm install
```

## Configuring the application
Once installed, copy the `.env-example` file to `.env` in the application's root directory. Enter your API key, secret and virtual number from the [Nexmo Developer Dashboard](https://dashboard.nexmo.com) and also a name for your application which will appear on the home page and also in the `from` field of any SMS sent via the Verify API.

```
NEXMO_API_KEY=YOUR NEXMO API KEY
NEXMO_API_SECRET=YOUR NEXMO API SECRET
NEXMO_BRAND_NAME=UP TO 11 ALPHANUMERIC CHARACTERS
VIRTUAL_NUMBER=LVN
```
## Running the application
You should then be able to run the app with `npm start`.

Then on two different browser windows (if using the same browser one of these should be a private window) login as a "Driver" on one and as a "User" in the other one.

After login, as a user select a driver from the list and click on "Contact". both should receive an SMS and can start chatting using that thread.
