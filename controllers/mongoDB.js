const { findUserByPhone, createUser } = require("../services/mongoDB.js");
const { postMessage, getNotification } = require("../greenApi.js");
const { formatIsraeliPhoneNumberToGreenAPI } = require("../functions/phoneNumbers.js");
const {addMessageToUser} = require("../services/mongoDB.js");

const SubmitDetailsController = async (req, res) => {
  const userPhone = req.body.phone || req.query.phone;
  const userName = req.body.name || req.query.name;

  if (!userPhone) {
    return res.status(400).json({ message: "מספר טלפון חובה." });
  }

  try {
    const userExists = await findUserByPhone(userPhone);
    console.log("is user exists: ", userExists);

    if (userExists) {
      console.log("User already exists: ",userExists);
      // return res.send({ message: 'המשתמש קיים.', exists: true });
    } else {
      console.log("Creating new user:", userPhone, userName);
      await createUser(userPhone, userName);
      // await addMessageToUser(userPhone, 'user', )
    }

    postMessage(formatIsraeliPhoneNumberToGreenAPI(userPhone), userName);
    res.status(200).json({
      message: "פרטי המשתמש הוגשו בהצלחה."
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "שגיאת שרת פנימית.", error: error.message });
  }
};

module.exports = {
  SubmitDetailsController,
};
