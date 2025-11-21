  import React from "react";

  export default function SummaryBox({ subtotal = 0, shipping = 0, total }) {
    const subtotalNum = Number(subtotal) || 0;
    const shippingNum = Number(shipping) || 0;
    const totalToShow =
      total !== undefined && total !== null ? Number(total) || 0 : subtotalNum + shippingNum;

    return (
      <div className="p-4 rounded mb-6 border bg-white">
        <p>Subtotal: Rs.{subtotalNum}</p>
        <p>Shipping: Rs.{shippingNum}</p>
        <p className="font-bold">Total: Rs.{totalToShow}</p>
      </div>
    );
  }