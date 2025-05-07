const admin = require("firebase-admin")
const { readDocuments,setDocument , updateDocument } = require("../helpers/firebaseConfig.js")
const asyncHandler = require("express-async-handler")

// Authentication
// Everytime a user sign in the version of profile changes, so we need to update the token
// We can use the version to check if the user is authenticated
// If the version is different, the user needs to sign in again
const handleAuth = asyncHandler(async (req, res) => {
    const { idToken, deviceToken } = req.body;

    if (typeof deviceToken !== "string" || deviceToken.length > 256) {
        return res.status(400).json({ error: "Invalid device token" });
    }

    try {
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check existing user
        const existingUser = await readDocuments("profile", { id: uid });

        if (existingUser) {
            // Update device token
            await updateDocument("profile", uid, { device: deviceToken });

            const version = existingUser.version || 1;
            const token = jwt.sign({ uid, version }, JWT_SECRET, { expiresIn: "7d" });

            return res.sendResponse("user_authenticated", { token, user: existingUser });
        }

        // Create new user
        const user = {
            name: decodedToken.name || "",
            email: decodedToken.email || "",
            age: null,
            height: null,
            role: "user",
            passkey: { fake: "", real: "" },
            addresses: [],
            version: 1,
            device: deviceToken,
            trustedContacts: [],
            profile: false,
            createdAt: FieldValue.serverTimestamp(),
        };

        // Save new user
        await admin.firestore().collection("profile").doc(uid).set(user);

        const token = GenerateJWT({ uid, version: user.version }, { expiresIn: "30d" });

        res.sendResponse("user_created", { token, user });

    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid token" });
    }
});



// Profile Update
// This function updates the user profile

/*
const handleProfile = asyncHandler( async (req, res) => {

    const { user, body } = req

    try {
        const profile = {
            name: body.name || user.name,
            age: body.age || user.age,
            height: body.height || user.height,
            passkey: { 
                fake: body.passkey.fake || user.passkey.fake,
                real: body.passkey.real || user.passkey.real
            },
            addresses: body.addresses || user.addresses,
            version: user.version + 1,
            profile: true
        }

        await updateDocument("profile", user.uid, profile)
        res.sendResponse('profile_updated', profile)
    } catch (error) {
        console.error("Profile error:", error.message)
        res.throwError('profile_error', 400)
    }

}) */

// Replace handleProfile with this simplified version for mvp, 
    // Profile Controller
    const handleProfile = {
     getProfile: asyncHandler(async (req, res) => {
      const { userId } = req.query;
      const snapshot = await admin.database().ref(`profiles/${userId}`).once('value');
      res.json(snapshot.val() || {});
      }),
  
     updateProfile: asyncHandler(async (req, res) => {
      const { userId, name, age, height, passkeys } = req.body;
      await admin.database().ref(`profiles/${userId}`).update({
        name,
        age,
        height,
        passkeys
      });
      res.json({ status: "success", message: "Profile updated" });
     })
    };
  
  


// Search Profile using Email
const handleProfileSearch = asyncHandler( async (req, res) => {
    const { email } = req.query

    try {
        const user = await readDocuments("profile", { email })
        if (user) {
            delete user.passkey
            res.sendResponse('profile_found', user)
        } else {
            res.throwError('profile_not_found', 404)
        }
    } catch (error) {
        console.error("Profile search error:", error.message)
        res.throwError('profile_error', 400)
    }
});


module.exports = {
    handleAuth,
    handleProfile,
    handleProfileSearch
}