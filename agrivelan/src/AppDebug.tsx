import React, { useState, useEffect, useRef } from 'react';
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// import { Bar } from 'react-chartjs-2';
// Firebase imports removed


// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AppDebug() {
    console.log("AppDebug Rendering");
    return <div><h1>DEBUG MODE</h1></div>;
}
