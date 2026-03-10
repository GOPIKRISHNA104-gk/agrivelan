import React, { useState } from 'react';

// Types
interface Order {
    id: string;
    date: string;
    productName: string;
    productImage: string;
    status: 'Ordered' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
    price: number;
}

const mockOrders: Order[] = [];

// Steps Definition
const trackingSteps = [
    { status: 'Ordered', label: 'Order Placed', date: 'Sep 19, 10:00 AM' },
    { status: 'Packed', label: 'Packed', date: 'Sep 19, 02:00 PM' },
    { status: 'Shipped', label: 'Shipped', date: 'Sep 19, 06:00 PM' },
    { status: 'Out for Delivery', label: 'Out for Delivery', date: 'Sep 20, 08:00 AM' },
    { status: 'Delivered', label: 'Delivered', date: 'Expected today' }
];

export default function OrdersTracking({ onBack }: { onBack: () => void }) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Helper to determine step state
    const getStepState = (stepStatus: string, currentStatus: string) => {
        const statuses = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
        const currentIndex = statuses.indexOf(currentStatus);
        const stepIndex = statuses.indexOf(stepStatus);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    // Render Tracking Modal
    const renderTrackingModal = () => {
        if (!selectedOrder) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Track Order</h3>
                            <p className="text-sm text-gray-500 font-mono">{selectedOrder.id}</p>
                        </div>
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Product Summary */}
                    <div className="p-6 pb-2 flex gap-4 items-center">
                        <img src={selectedOrder.productImage} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-gray-100" alt="Product" />
                        <div>
                            <h4 className="font-bold text-gray-800">{selectedOrder.productName}</h4>
                            <p className="text-green-600 font-medium text-sm">₹{selectedOrder.price} • Paid via UPI</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-6 pt-2">
                        <div className="relative pl-4 space-y-8 my-4">
                            {/* Connecting Line */}
                            <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-gray-100" />

                            {trackingSteps.map((step, index) => {
                                const state = getStepState(step.status, selectedOrder.status);

                                return (
                                    <div key={index} className="relative flex items-start group">
                                        {/* Icon Node */}
                                        <div className={`
                       relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 
                       ml-3 mr-4 shrink-0 transition-all duration-300
                       ${state === 'completed' ? 'bg-green-500 border-green-500 text-white shadow-green-200 shadow-lg' : ''}
                       ${state === 'active' ? 'bg-white border-orange-500 ring-4 ring-orange-100 text-orange-500 scale-110' : ''}
                       ${state === 'pending' ? 'bg-white border-gray-300' : ''}
                     `}>
                                            {state === 'completed' && (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {state === 'active' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                        </div>

                                        {/* Text Content */}
                                        <div className={`flex-1 pt-0.5 ${state === 'pending' ? 'opacity-40' : ''}`}>
                                            <h5 className={`font-bold text-sm ${state === 'active' ? 'text-orange-600' : 'text-gray-800'}`}>
                                                {step.label}
                                            </h5>
                                            <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        {selectedOrder.status === 'Delivered' ? (
                            <button className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed">
                                Order Completed
                            </button>
                        ) : (
                            <button onClick={() => alert('Support Chat Feature coming soon!')} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                                Need Help?
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 h-16 flex items-center gap-4 shadow-sm">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Ongoing Orders</h1>
            </div>

            {/* Orders List */}
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {mockOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No Ongoing Orders</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs">Looks like you haven't placed any orders yet. Start shopping to track your items here!</p>
                    </div>
                ) : (
                    mockOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
                        >
                            {/* Image */}
                            <div className="relative w-20 h-20 shrink-0">
                                <img
                                    src={order.productImage}
                                    alt={order.productName}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-black/5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 truncate">{order.productName}</h3>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{order.id} • {order.date}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${order.status === 'Delivered' ? 'bg-green-500' :
                                            order.status === 'Ordered' ? 'bg-gray-400' : 'bg-orange-500 animate-pulse'
                                            }`} />
                                        <span className="text-sm font-medium text-gray-600">{order.status}</span>
                                    </div>

                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                                    >
                                        Track Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    )))}

                <div className="pt-8 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">End of List</p>
                </div>
            </div>

            {/* Render Modal if active */}
            {selectedOrder && renderTrackingModal()}
        </div>
    );
}
