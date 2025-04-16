import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Image {
    url: string;
}

interface Property {
    id: number;
    title: string;
    description: string;
    city: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    images: Image[];
}

const AllPropertyList: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axios.get<Property[]>('/api/properties'); // Adjust the URL as necessary
                setProperties(response.data);
            } catch (error) {
                console.error('Error fetching properties:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.length > 0 ? (
                properties.map(property => (
                    <div className="relative bg-white shadow-md rounded-lg overflow-hidden group" key={property.id}>
                        <img src={property.images[0]?.url} alt={property.title} className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <h2 className="text-white text-lg font-bold">{property.title}</h2>
                            <p className="text-white">City: {property.city}</p>
                            <p className="text-white">Price: ${property.price}</p>
                            <p className="text-white">Bedrooms: {property.bedrooms}</p>
                            <p className="text-white">Bathrooms: {property.bathrooms}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div>No properties available.</div>
            )}
        </div>
    );
};

export default AllPropertyList;
