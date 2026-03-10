
export const demoUser = {
    uid: 'demo_user_123',
    displayName: 'Demo Farmer',
    email: 'demo@gmail.com',
    mobile: '1234567890',
    role: 'farmer',
    location: 'Demo Village, TN'
};

export const demoBuyer = {
    uid: 'demo_buyer_456',
    displayName: 'Demo Buyer',
    email: 'demo@gmail.com',
    mobile: '1234567890',
    role: 'buyer',
    location: 'Demo City, TN'
};

export const demoFarmerPosts = [
    {
        id: 'demo_post_1',
        productName: 'Demo Tomatoes (High Yield)',
        productImg: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1000',
        quantity: '500kg',
        price: '₹25/kg',
        rating: 4.8,
        reviews: 12,
        farmerId: 'demo_user_123'
    },
    {
        id: 'demo_post_2',
        productName: 'Demo Potatoes',
        productImg: 'https://images.unsplash.com/photo-1518977676651-71f6480aeef9?auto=format&fit=crop&q=80&w=1000',
        quantity: '200kg',
        price: '₹18/kg',
        rating: 4.5,
        reviews: 8,
        farmerId: 'demo_user_123'
    },
    {
        id: 'demo_post_3',
        productName: 'Demo Tomatoes (High Yield)',
        productImg: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1000',
        quantity: '500kg',
        price: '₹25/kg',
        rating: 4.8,
        reviews: 12,
        farmerId: 'demo_user_123'
    }
];

export const demoMarketItems = [
    {
        id: 'demo_market_1',
        productName: 'Organic Carrots',
        productImg: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=1000',
        farmerName: 'Ravi Organic Farms',
        location: 'Ooty, TN',
        rate: 45,
        rating: 4.9,
        description: 'Sweet and crunchy carrots from the hills.',
        coords: { lat: 11.4102, lng: 76.6950 }
    },
    {
        id: 'demo_market_2',
        productName: 'Fresh Onions',
        productImg: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=1000',
        farmerName: 'Suresh Traders',
        location: 'Pollachi, TN',
        rate: 30,
        rating: 4.6,
        description: 'High quality pink onions.',
        coords: { lat: 10.6621, lng: 77.0118 }
    },
    {
        id: 'demo_market_3',
        productName: 'Green Spinach',
        productImg: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=1000',
        farmerName: 'Green Valley',
        location: 'Coimbatore, TN',
        rate: 15,
        rating: 4.8,
        description: 'Fresh leaf spinach, pesticide free.',
        coords: { lat: 11.0168, lng: 76.9558 }
    },
    {
        id: 'demo_market_4',
        productName: 'Organic Carrots',
        productImg: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=1000',
        farmerName: 'Ravi Organic Farms',
        location: 'Ooty, TN',
        rate: 45,
        rating: 4.9,
        description: 'Sweet and crunchy carrots from the hills.',
        coords: { lat: 11.4102, lng: 76.6950 }
    }
];
