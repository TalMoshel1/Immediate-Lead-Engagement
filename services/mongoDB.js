const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');


dotenv.config();

// הגדרת כתובת ה-URL לחיבור ל-MongoDB
// אם ה-MongoDB שלך רץ ב-Docker על פורט 27017, הכתובת תהיה כזו:
const uri = process.env.MONGODB_URI 
// const dbName = 'my-mongo'; // החלף ב-שם מסד הנתונים שלך
const dbName = 'whatsapp-bot'; // ללא דוקר, DB שפתחתי באתר של MONGO

const collectionName = 'users'; // שם הקולקשן שהגדרת

/**
 * @typedef {Object} User - מייצג את מבנה אובייקט המשתמש.
 * @property {string} userPhone - מספר הטלפון של המשתמש (שדה חובה).
 * @property {string} [userName] - שם המשתמש (אופציונלי).
 */

/**
 * פונקציה לבדיקה האם משתמש קיים לפי מספר טלפון.
 * @param {string} userPhoneValue המספר טלפון של המשתמש לבדיקה.
 * @returns {Promise<User|null>} אובייקט המשתמש הקיים, או null אם לא נמצא או אירעה שגיאה.
 */
async function findUserByPhone(userPhoneValue) {
    const client = new MongoClient(uri);
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection(collectionName);
  
      const existingUser = await usersCollection.findOne({ userPhone: userPhoneValue });
      // אם המשתמש נמצא, החזר true
      if (existingUser) {
        console.log('existing user: ', existingUser)
        return existingUser;
      }
      // אם המשתמש לא נמצא, החזר false
      console.log('user not found')
      console.log('service mongo db input: ', userPhoneValue.length)
      return false;
    } catch (error) {
      console.error('שגיאה בחיפוש משתמש:', error);
      return false; 
    } finally {
      await client.close();
    }
  }

/**
 * פונקציה ליצירת משתמש חדש.
 * @param {string} userPhoneValue המספר טלפון של המשתמש החדש.
 * @param {string} [userNameValue] שם המשתמש שיוגדר למשתמש החדש (אופציונלי).
 * @returns {Promise<User|null>} אובייקט המשתמש החדש שנוצר, או null אם אירעה שגיאה.
 */
// async function  createUser(userPhoneValue, userNameValue) {
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();
//     const db = client.db(dbName);
//     const usersCollection = db.collection(collectionName);

//     /** @type {User} */
//     const newUser = {
//       userPhone: userPhoneValue,
//     };

//     if (userNameValue) {
//       newUser.userName = userNameValue;
//     }
    
//     const result = await usersCollection.insertOne(newUser);
//     // MongoDB driver returns an object with insertedId, we want the full user object
//     if (result.acknowledged) {
//         console.log(`משתמש חדש נוצר עם מספר טלפון ${userPhoneValue}:`, result.insertedId);
//         return { _id: result.insertedId, ...newUser }; // Return the created user with its ID
//     }
//     return null;

//   } catch (error) {
//     console.error('שגיאה ביצירת משתמש:', error);
//     return null;
//   } finally {
//     await client.close();
//   }
// }


/* ***********************       need to check if works                 ******************8*/
async function createUser(userPhoneValue, userNameValue) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection(collectionName);

    /** @type {User} */
    const newUser = {
      userPhone: userPhoneValue,
      messages: [] 
    };

    if (userNameValue) {
      newUser.userName = userNameValue;
    }
    
    const result = await usersCollection.insertOne(newUser);
    
    if (result.acknowledged) {
        console.log(`משתמש חדש נוצר עם מספר טלפון ${userPhoneValue}:`, result.insertedId);
        return { _id: result.insertedId, ...newUser }; 
    }
    return null;

  } catch (error) {
    console.error('שגיאה ביצירת משתמש:', error);
    return null;
  } finally {
    await client.close();
  }
}


async function addMessageToUser(userPhoneValue, role, content) {
  const client = new MongoClient(uri);
  try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection(collectionName);

      const newMessage = {
          role: role,
          content: content,
          timestamp: new Date() // שמור את חותמת הזמן
      };

      await usersCollection.updateOne(
          { userPhone: userPhoneValue },
          {
              $push: {
                  messages: {
                      $each: [newMessage],
                      $slice: -10 // לדוגמה, שמור רק את 20 ההודעות האחרונות
                  }
              }
          }
      );
      console.log(`הודעה חדשה נוספה למשתמש ${userPhoneValue}`);
  } catch (error) {
      console.error('שגיאה בהוספת הודעה למשתמש:', error);
  } finally {
      await client.close();
  }
}



  
  module.exports = {
    findUserByPhone, createUser, addMessageToUser}