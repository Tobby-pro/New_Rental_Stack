// In propertyController.js
const uploadProfilePic = async (req, res) => {
    try {
        const userId = req.user.id;
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'No image provided.' });
        }

        // Convert base64 string to buffer
        const buffer = Buffer.from(image, 'base64');

        const fileName = `profile-pictures/${userId}/avatar-${uuidv4()}.jpg`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: {
                contentType: 'image/jpeg',
            },
        });

        await file.makePublic(); // Optional if you're okay with a public URL

        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Save image URL in Firestore
        await firestore.collection('users').doc(userId).set(
            { profilePicUrl: downloadURL },
            { merge: true }
        );

        return res.status(200).json({ url: downloadURL });

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

// Export the function along with others
module.exports = {
    uploadProfilePic,
    // Add other functions like createProperty, getProperties, etc.
};
