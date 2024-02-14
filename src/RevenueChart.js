import React from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';

const RevenueChart = ({ userData }) => {

  return (
    <LineChart
      width={600}
      height={300}
      data={userData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <XAxis dataKey="month" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="Actual" stroke="#8884d8" activeDot={{ r: 8 }} />
      <Line type="monotone" dataKey="Predicted" stroke="#82ca9d" />
    </LineChart>
  );
};

export default RevenueChart;