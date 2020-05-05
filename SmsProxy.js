const Nexmo = require("nexmo");

class SmsProxy {
  constructor() {
    this.nexmo = new Nexmo({
      apiKey: process.env.NEXMO_API_KEY,
      apiSecret: process.env.NEXMO_API_SECRET,
    });
    this.brand = process.env.NEXMO_BRAND_NAME;
    this.chats = new Array();
  }

  _sendSms(from, to, message) {
    return new Promise((resolve, reject) => {
      this.nexmo.message.sendSms(from, to, message, (err, responseData) => {
        if (err) {
          reject(err);
        } else {
          console.log("send sms", responseData);
          resolve(responseData);
        }
      });
    });
  }

  requestCode(verifyRequestNumber) {
    return new Promise((resolve, reject) => {
      this.nexmo.verify.request(
        {
          number: verifyRequestNumber,
          brand: this.brand,
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            console.log("request code", result);
            resolve(result.request_id);
          }
        }
      );
    });
  }

  checkVerificationCode(verifyRequestId, code) {
    console.log(`checking code ${code} for ${verifyRequestId}`);
    return new Promise((resolve, reject) => {
      this.nexmo.verify.check(
        {
          request_id: verifyRequestId,
          code,
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            console.log("check verification", result);
            resolve(result);
          }
        }
      );
    });
  }

  async sendSMS(user, driver) {
    try {
      /*  
        Send a message from userA to the virtual number
      */
      await this._sendSms(
        process.env.VIRTUAL_NUMBER,
        user,
        "Reply to this SMS to talk to driver"
      );

      /*  
        Send a message from userB to the virtual number
      */
      await this._sendSms(
        process.env.VIRTUAL_NUMBER,
        driver,
        "Reply to this SMS to talk to user"
      );
    } catch (err) {
      console.log("error while sending the message");
    }
  }

  createChat(user, driver) {
    console.log(`creating chat for ${user} and ${driver}`);
    this.chats.push({
      user,
      driver,
    });

    this.sendSMS(user, driver);
  }

  getDestinationRealNumber(from) {
    console.log('searching in chats', this.chats);
    const chat = this.chats.filter(
      (chat) => chat.user === from || chat.driver === from
    )[0];
    console.log('chat found:', chat)
    let destinationRealNumber = null;

    // Use `from` numbers to work out who is sending to whom
    const user = from === chat.user;
    const driver = from === chat.driver;

    if (user || driver) {
      destinationRealNumber = user ? chat.driver : chat.user;
    }

    return destinationRealNumber;
  }

  async proxySms(from, text) {
    // Determine which real number to send the SMS to
    try {
      const destinationRealNumber = this.getDestinationRealNumber(from);

      if (destinationRealNumber === null) {
        console.log(`No chat found for this number`);
        return;
      }

      // Send the SMS from the virtual number to the real number
      await this._sendSms(
        process.env.VIRTUAL_NUMBER,
        destinationRealNumber,
        text
      );
    } catch (err) {
      console.error("Could not deliver SMS due to:", err);
    }
  }
}

module.exports = SmsProxy;
