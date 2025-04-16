// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const PropertyList = () => {
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState('');

//     useEffect(() => {
//         const fetchProperties = async () => {
//             try {
//                 const response = await axios.get('/api/properties'); // Adjust the URL as necessary
//                 setProperties(response.data);
//             } catch (error) {
//                 console.error('Error fetching properties:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchProperties();
//     }, []);

//     const filteredProperties = properties.filter(property =>
//         property.title.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     if (loading) {
//         return <div>Loading...</div>;
//     }

//     return (
//         <div>
//             <input
//                 type="text"
//                 placeholder="Search properties..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="border border-gray-300 rounded-md p-2 mb-4"
//             />
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {filteredProperties.length > 0 ? (
//                     filteredProperties.map(property => (
//                         <div className="relative bg-white shadow-md rounded-lg overflow-hidden group" key={property.id}>
//                             <img src={property.images[0]?.url} alt={property.title} className="w-full h-48 object-cover" />
//                             <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                                 <h2 className="text-white text-lg font-bold">{property.title}</h2>
//                                 <p className="text-white">City: {property.city}</p>
//                                 <p className="text-white">Price: ${property.price}</p>
//                                 <p className="text-white">Bedrooms: {property.bedrooms}</p>
//                                 <p className="text-white">Bathrooms: {property.bathrooms}</p>
//                             </div>
//                         </div>
//                     ))
//                 ) : (
//                     <div>No properties available.</div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default PropertyList;
