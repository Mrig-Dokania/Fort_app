
const asyncHandler = require("express-async-handler");
const { admin } = require("../helpers/firebaseConfig.js");

// 1. Get Contacts
const getContacts = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const snapshot = await admin.database().ref(`contacts/${userId}`).once('value');
  res.json(snapshot.val()?.list || []);
});

// 2. Add Contact
const addContact = asyncHandler(async (req, res) => {
  const { userId, contact } = req.body;
  const newContactRef = admin.database().ref(`contacts/${userId}/list`).push();
  await newContactRef.set(contact);
  res.json({ status: "success", message: "Contact added" });
});

// 3. Remove Contact
const removeContact = asyncHandler(async (req, res) => {
  const { userId, contact } = req.body;
  const snapshot = await admin.database().ref(`contacts/${userId}/list`).once('value');
  const contacts = snapshot.val() || {};
  
  const filtered = Object.fromEntries(
    Object.entries(contacts).filter(([_, value]) => value !== contact)
  );
  
  await admin.database().ref(`contacts/${userId}/list`).set(filtered);
  res.json({ status: "success", message: "Contact removed" });
});

module.exports = {
  getContacts,
  addContact,
  removeContact,
  handleRequest, // Existing functions
  handleAccept,
  handleReject
};






/*const crypto = require("crypto");
const { admin } = require("../helpers/firebaseConfig.js");

// Helper function for approval logic
const handleApprove = async (requesterUID, receiverUID, requestId, res) => {
    const batch = admin.firestore().batch();

    const userARef = admin.firestore().collection("profile").doc(requesterUID);
    const userBRef = admin.firestore().collection("profile").doc(receiverUID);
    const trustedRequestRef = admin.firestore().collection("trusted_requests").doc(requestId);

    const [userA, userB, trustedRequest] = await Promise.all([
        userARef.get(),
        userBRef.get(),
        trustedRequestRef.get(),
    ]);

    if (!userA.exists || !userB.exists) {
        return res.sendError("User profiles not found.", 404);
    }

    if (!trustedRequest.exists) {
        return res.sendError("Trusted request not found.", 404);
    }

    const userAEmail = userA.data().email;
    const userBEmail = userB.data().email;

    batch.update(userARef, {
        trustedContacts: admin.firestore.FieldValue.arrayUnion(userBEmail),
    });

    batch.update(userBRef, {
        trustedContacts: admin.firestore.FieldValue.arrayUnion(userAEmail),
    });

    batch.update(trustedRequestRef, {
        status: "accepted",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.sendResponse("trusted_contact_approved", {
        requester: requesterUID,
        receiver: receiverUID,
    });
};

// Hash two UIDs to generate a unique request ID
function generateTrustedRequestId(uid1, uid2) {
    const sortedUIDs = [uid1, uid2].sort().join("_");
    return crypto.createHash("md5").update(sortedUIDs).digest("hex");
}

// Send a trusted contact request
// This function creates a new trusted contact request in the database
// It requires the requester and receiver UIDs
// It checks if the request already exists and creates a new request if it doesn't
const handleRequest = async (req, res) => {
    const { user } = req;
    const { receiverUID } = req.body;

    const requesterUID = user.uid;

    if (requesterUID === receiverUID) {
        return res.sendError("Cannot send request to yourself.", 400);
    }

    const requestId = generateTrustedRequestId(requesterUID, receiverUID);
    const trustedRequestRef = admin.firestore().collection("trusted_requests").doc(requestId);

    try {
        const existingRequest = await trustedRequestRef.get();

        if (existingRequest.exists) {
            const requestData = existingRequest.data();

            // If receiver has already sent a request, auto-approve
            if (requestData.receiver === requesterUID && requestData.requester === receiverUID) {
                return handleApprove(receiverUID, requesterUID, requestId, res);
            }

            return res.sendError("Trusted contact request already exists.", 400);
        }

        await trustedRequestRef.set({
            requester: requesterUID,
            receiver: receiverUID,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.sendResponse("trusted_request_sent", { requestId });
    } catch (error) {
        console.error("Error sending trusted contact request:", error);
        res.sendError("Failed to send request.", 500);
    }
};


// Accept a trusted contact request
// This function accepts a trusted contact request
// It adds both users to each other's trusted contact list
// It then deletes the request from the database
const handleAccept = async (req, res) => {
    const { user } = req;
    const { requesterUID } = req.body;
    const receiverUID = user.uid;
    const requestId = generateTrustedRequestId(requesterUID, receiverUID);
    
    const trustedRequestRef = admin.firestore().collection("trusted_requests").doc(requestId);

    try {
        const requestDoc = await trustedRequestRef.get();
        if (!requestDoc.exists) {
            return res.sendError("Trusted contact request not found.", 404);
        }

        const requestData = requestDoc.data();

        // Ensure only the receiver can accept the request
        if (requestData.receiver !== receiverUID) {
            return res.sendError("Only the receiver can accept this request.", 403);
        }

        await handleApprove(requesterUID, receiverUID, requestId, res);
    } catch (error) {
        console.error("Error accepting trusted contact request:", error);
        res.sendError("Failed to accept request.", 500);
    }
};


    const handleReject = async (req, res) => {
     const { receiverUID, requesterUID } = req.body;
     const requestId = generateTrustedRequestId(requesterUID, receiverUID);
     const trustedRequestRef = admin.firestore().collection("trusted_requests").doc(requestId);

     try {
        const requestDoc = await trustedRequestRef.get();
        if (!requestDoc.exists) {
            return res.sendError("Trusted contact request not found.", 404);
        }

        const requestData = requestDoc.data();

        // Ensure only the receiver can reject the request
        if (requestData.receiver !== receiverUID) {
            return res.sendError("Only the receiver can reject this request.", 403);
        }

        // Update the request status to "rejected" instead of deleting it
        await trustedRequestRef.update({
            status: "rejected",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.sendResponse("trusted_request_rejected", { requestId, status: "rejected" });
     } catch (error) {
        console.error("Error rejecting trusted contact request:", error);
        res.sendError("Failed to reject request.", 500);
     }
    


    const handleContacts = {
        getContacts: asyncHandler(async (req, res) => {
          const { userId } = req.query;
          const snapshot = await admin.database().ref(`contacts/${userId}`).once('value');
          res.json(snapshot.val()?.list || []);
        }),
      
        addContact: asyncHandler(async (req, res) => {
          const { userId, contact } = req.body;
          const newContactRef = admin.database().ref(`contacts/${userId}/list`).push();
          await newContactRef.set(contact);
          res.json({ status: "success", message: "Contact added" });
        }),
      
        removeContact: asyncHandler(async (req, res) => {
          const { userId, contact } = req.body;
          const snapshot = await admin.database().ref(`contacts/${userId}/list`).once('value');
          const contacts = snapshot.val() || {};
          
          const entries = Object.entries(contacts)
            .filter(([_, value]) => value !== contact)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
          await admin.database().ref(`contacts/${userId}/list`).set(entries);
          res.json({ status: "success", message: "Contact removed" });
        })
      };
    }  


module.exports = {
    handleRequest,
    handleAccept,
    handleReject,
}*/