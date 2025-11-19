import React from "react";

const PaymentMethod = ({ paymentMethod, setPaymentMethod }) => (
  <>
    <h2 className="font-bold text-lg mb-2">Payment</h2>
    <div className="flex flex-col gap-2 mb-6">
      {["Online Payment", "Bank Transfer", "COD"].map((method) => (
        <label key={method} className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value={method}
            checked={paymentMethod === method}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          {method}
        </label>
      ))}
    </div>
  </>
);

export default PaymentMethod;
