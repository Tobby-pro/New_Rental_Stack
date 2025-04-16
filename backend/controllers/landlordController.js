// landlordController.js
const prisma = require('../prisma/prismaClient'); // Import prisma client

// Function to fetch landlord info by ID
const getLandlordById = async (req, res) => {
    try {
        const { landlordId } = req.params;

        // Ensure landlordId is parsed correctly
        const parsedLandlordId = parseInt(landlordId, 10);
        console.log('Landlord ID:', parsedLandlordId);

        // Fetch landlord information from the database
        const landlord = await prisma.landlord.findUnique({
            where: { id: parsedLandlordId },
            select: {
                id: true,
                user: {
                    select: {
                        name: true, // Assuming 'name' exists in User model
                        email: true,
                    },
                },
                listings: true, // Fetch related listings if required
            },
        });
        console.log('Landlord data:', landlord); 

        if (!landlord) {
            return res.status(404).json({ message: 'Landlord not found' });
        }

        return res.status(200).json(landlord);
    } catch (error) {
        console.error('Error fetching landlord info:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getLandlordById };
