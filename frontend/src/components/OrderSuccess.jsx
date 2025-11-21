import { useParams, Link } from "react-router-dom";

const OrderSuccess = () => {
  const { id } = useParams();
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Order Placed!</h1>
      <p className="text-lg">
        Your order ID: <span className="font-mono">{id}</span>
      </p>
      <Link to="/" className="mt-6 bg-[#1E40AF] text-white px-6 py-2 rounded">
        Back to Home
      </Link>
    </div>
  );
};

export default OrderSuccess;