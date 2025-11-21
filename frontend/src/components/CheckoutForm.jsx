// src/components/CheckoutForm.jsx
import { useState, useContext, useEffect } from "react";
import { CartContext } from "../contexts/CartContext";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

const inputBase =
  "block w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]";

const DELIVERY_FEE = 300;
const POINT_VALUE_LKR = 10; // 1 point = 10 LKR

const CheckoutForm = ({ onPlaceOrder, userData }) => {
  const { cart, subtotal } = useContext(CartContext);

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [errors, setErrors] = useState({});

  // Loyalty points
  const [loyaltyPoints, setLoyaltyPoints] = useState(userData?.loyaltyPoints ?? 0);
  const [serverPointsLoaded, setServerPointsLoaded] = useState(false);
  const availablePoints = Math.floor((loyaltyPoints) / 5) * 5; // clamp to nearest lower multiple of 5
  const [selectedPoints, setSelectedPoints] = useState(0);
  useEffect(() => {
    // Clamp selection if available points change
    setSelectedPoints((prev) => Math.min(prev, availablePoints));
  }, [availablePoints]);

  // Fetch latest loyalty points from backend to avoid stale context values (with retry if token not ready)
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

    const tryFetch = async () => {
      try {
        const auth = getAuth(app);
        const token = await auth.currentUser?.getIdToken?.();
        if (!token) {
          if (attempts < 3 && !cancelled) {
            attempts += 1;
            setTimeout(tryFetch, 800);
          }
          return;
        }
        const res = await fetch(`${base}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const pts = typeof data?.user?.loyaltyPoints === "number" ? data.user.loyaltyPoints : null;
          if (!cancelled && typeof pts === "number") {
            setLoyaltyPoints(pts);
            setServerPointsLoaded(true);
          }
        } else if (attempts < 3 && !cancelled) {
          attempts += 1;
          setTimeout(tryFetch, 800);
        }
      } catch (e) {
        // ignore
      }
    };

    tryFetch();
    return () => { cancelled = true; };
  }, [userData?.firebaseUid]);

  // Also sync from user data when it changes (in case context refreshes with latest points)
  useEffect(() => {
    if (typeof userData?.loyaltyPoints === "number") {
      setLoyaltyPoints(userData.loyaltyPoints);
      setServerPointsLoaded(true);
    }
  }, [userData?.loyaltyPoints]);

  // Fallback: derive points from appointments if backend/context are stale
  useEffect(() => {
    const ownerId = userData?.firebaseUid || userData?._id;
    if (!ownerId) return;

    let cancelled = false;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

    (async () => {
      try {
        let loadedAppointments = [];
        // Try owner-specific endpoint
        let res = await fetch(`${base}/appointments/owner/${ownerId}`);
        if (!res.ok) {
          // Fallback to all appointments and filter client-side if route unavailable
          if (res.status === 404) {
            const allRes = await fetch(`${base}/appointments`);
            if (allRes.ok) {
              const all = await allRes.json();
              loadedAppointments = Array.isArray(all) ? all.filter(a => a.user_id === ownerId) : [];
            }
          }
        } else {
          const data = await res.json();
          loadedAppointments = Array.isArray(data) ? data : [];
        }

        const derivedPoints = loadedAppointments.reduce((sum, a) => sum + (Number(a.points_awarded) || 0), 0);
        if (!cancelled && !serverPointsLoaded) {
          setLoyaltyPoints(derivedPoints);
        }
      } catch (_e) {
        // ignore
      }
    })();

    return () => { cancelled = true; };
  }, [userData?.firebaseUid, userData?._id, serverPointsLoaded]);

  // Email
  const [email, setEmail] = useState(userData?.email || "");
  useEffect(() => {
    if (userData?.email) setEmail(userData.email);
  }, [userData]);

  // Billing
  const [billing, setBilling] = useState({
    fullName: userData?.fullName || "",
    phone: userData?.phone || "",
    street: userData?.address?.street || "",
    city: userData?.address?.city || "",
    postalCode: userData?.address?.postalCode || "",
    country: userData?.address?.country || "",
  });

  // Shipping
  const [shipping, setShipping] = useState({ ...billing });
  useEffect(() => {
    if (sameAsBilling) setShipping({ ...billing });
  }, [billing, sameAsBilling]);

  // Validation
  const validateField = (name, value) => {
    let error = "";

    if (name === "fullName") {
      if (!/^[A-Za-z\s]*$/.test(value)) error = "Only letters allowed.";
      else if (value.length > 30) error = "Max 30 characters.";
      else if (!value.trim()) error = "Name is required.";
    }

    if (name === "phone") {
      if (!/^\d*$/.test(value)) error = "Only digits allowed.";
      else if (value.length !== 10) error = "Phone must be exactly 10 digits.";
    }

    if (name === "street") {
      if (value.length > 50) error = "Max 50 characters.";
      else if (!value.trim()) error = "Street is required.";
    }

    if (name === "city" || name === "country") {
      if (!/^[A-Za-z\s]*$/.test(value)) error = "Only letters allowed.";
      else if (value.length > 30) error = "Max 30 characters.";
      else if (!value.trim()) error = `${name} is required.`;
    }

    if (name === "postalCode") {
      if (!/^\d{5,6}$/.test(value)) error = "Postal code must be 5–6 digits.";
    }

    if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = "Invalid email address.";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Input change handlers
  const handleBillingChange = (field, value) => {
    setBilling({ ...billing, [field]: value });
    validateField(field, value);
  };

  const handleShippingChange = (field, value) => {
    setShipping({ ...shipping, [field]: value });
    validateField(field, value);
  };

  // Totals and discount
  const discountLKR = Math.min(selectedPoints * POINT_VALUE_LKR, subtotal + DELIVERY_FEE);
  const total = Math.max(0, subtotal + DELIVERY_FEE - discountLKR);

  const handleSubmit = (e) => {
    console.log("Submit");
    e.preventDefault();

    Object.entries({ email, ...billing, ...(sameAsBilling ? {} : shipping) }).forEach(
      ([field, value]) => validateField(field, value)
    );

    if (Object.values(errors).some((err) => err)) return;

    const orderData = {
      email,
      billing,
      shipping: sameAsBilling ? billing : shipping,
      paymentMethod,
      items: cart,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      pointsRedeemed: selectedPoints,
      total,
    };
    onPlaceOrder(orderData);
  };

  // Restriction handlers
  const restrictNameInput = (e) => {
    if (!/^[A-Za-z\s]*$/.test(e.key)) e.preventDefault();
  };
  const restrictPhoneInput = (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 flex flex-col items-center bg-white min-h-screen">
     {/* Company Logo & Name */}
<div className="flex items-center gap-4 mb-10 w-full">
  <img
    src="/public/images/t.jpeg" // Replace with your logo path
    alt="Company Logo"
    className="w-16 h-16 object-contain" // increased size
  />
  <h1 className="text-3xl font-bold text-[#1E40AF]">PETVERSE</h1>
</div>


      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Section */}
        <div className="md:col-span-2 space-y-8">
          {/* Email */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Contact Information</h2>
            <input
              type="email"
              placeholder="Email"
              className={inputBase}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateField("email", e.target.value);
              }}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* Billing */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Billing Address</h2>
            <input
              type="text"
              placeholder="Full Name"
              className={inputBase}
              value={billing.fullName}
              onChange={(e) => handleBillingChange("fullName", e.target.value)}
              onKeyPress={restrictNameInput}
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

            <input
              type="text"
              placeholder="Phone"
              className={inputBase}
              value={billing.phone}
              onChange={(e) => handleBillingChange("phone", e.target.value)}
              onKeyPress={restrictPhoneInput}
              maxLength={10}
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

            <input
              type="text"
              placeholder="Street"
              className={inputBase}
              value={billing.street}
              onChange={(e) => handleBillingChange("street", e.target.value)}
            />
            {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className={inputBase}
                value={billing.city}
                onChange={(e) => handleBillingChange("city", e.target.value)}
                onKeyPress={restrictNameInput}
              />
              {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}

              <input
                type="text"
                placeholder="Postal Code"
                className={inputBase}
                value={billing.postalCode}
                onChange={(e) => handleBillingChange("postalCode", e.target.value)}
                onKeyPress={restrictPhoneInput}
                maxLength={6}
              />
              {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
            </div>

            <input
              type="text"
              placeholder="Country"
              className={inputBase}
              value={billing.country}
              onChange={(e) => handleBillingChange("country", e.target.value)}
              onKeyPress={restrictNameInput}
            />
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>

          {/* Shipping */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Shipping Address</h2>
            <label className="inline-flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="h-4 w-4 text-[#1E40AF] focus:ring-[#1E40AF]"
              />
              Same as billing address
            </label>

            {!sameAsBilling && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  className={inputBase}
                  value={shipping.fullName}
                  onChange={(e) => handleShippingChange("fullName", e.target.value)}
                  onKeyPress={restrictNameInput}
                />
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

                <input
                  type="text"
                  placeholder="Phone"
                  className={inputBase}
                  value={shipping.phone}
                  onChange={(e) => handleShippingChange("phone", e.target.value)}
                  onKeyPress={restrictPhoneInput}
                  maxLength={10}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

                <input
                  type="text"
                  placeholder="Street"
                  className={inputBase}
                  value={shipping.street}
                  onChange={(e) => handleShippingChange("street", e.target.value)}
                />
                {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    className={inputBase}
                    value={shipping.city}
                    onChange={(e) => handleShippingChange("city", e.target.value)}
                    onKeyPress={restrictNameInput}
                  />
                  {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}

                  <input
                    type="text"
                    placeholder="Postal Code"
                    className={inputBase}
                    value={shipping.postalCode}
                    onChange={(e) => handleShippingChange("postalCode", e.target.value)}
                    onKeyPress={restrictPhoneInput}
                    maxLength={6}
                  />
                  {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
                </div>

                <input
                  type="text"
                  placeholder="Country"
                  className={inputBase}
                  value={shipping.country}
                  onChange={(e) => handleShippingChange("country", e.target.value)}
                  onKeyPress={restrictNameInput}
                />
                {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
              </>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-8">
          {/* Loyalty Points */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Loyalty Points</h2>
            <p className="text-sm text-gray-600 mb-3">
              Available: <span className="font-semibold">{availablePoints}</span> points (1 point = Rs.{POINT_VALUE_LKR})
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPoints((p) => Math.max(0, p - 5))}
                className="px-3 py-1.5 rounded-lg border border-gray-300"
              >
                -5
              </button>
              <input
                type="range"
                min="0"
                max={availablePoints}
                step="5"
                value={selectedPoints}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const rounded = Math.round(v / 5) * 5;
                  setSelectedPoints(Math.min(availablePoints, Math.max(0, rounded)));
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setSelectedPoints((p) => Math.min(availablePoints, p + 5))}
                className="px-3 py-1.5 rounded-lg border border-gray-300"
              >
                +5
              </button>
              <div className="w-20 text-center font-semibold">{selectedPoints}</div>
            </div>
            <p className="text-sm text-gray-600 mt-3">Discount: Rs.{(selectedPoints * POINT_VALUE_LKR).toFixed(2)}</p>
            <p className="text-sm text-gray-600">Product total after points: Rs.{Math.max(0, subtotal - selectedPoints * POINT_VALUE_LKR).toFixed(2)}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Order Summary</h2>
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm">
                <span>Delivery Fee</span>
                <span>Rs.{DELIVERY_FEE}</span>
              </div>
              {selectedPoints > 0 && (
                <div className="flex justify-between py-2 text-sm text-green-700">
                  <span>Loyalty Discount ({selectedPoints} pts)</span>
                  <span>-Rs.{(selectedPoints * POINT_VALUE_LKR).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4 font-bold text-lg">
              <span>Total:</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-xl mb-4">Payment Method</h2>
            {[{ id: "online", label: "Online Payment" }, { id: "bank_transfer", label: "Bank Transfer" }, { id: "cod", label: "Cash on Delivery (COD)" }].map((method) => (
              <label key={method.id} className="flex items-center gap-3 mb-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-5 w-5 text-[#1E40AF] focus:ring-[#1E40AF]"
                />
                {method.label}
              </label>
            ))}
          </div>

          {/* Place Order */}
          <button
            type="submit"
            className="w-full bg-[#1E40AF] hover:bg-[#F97316] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Place Order
          </button>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;