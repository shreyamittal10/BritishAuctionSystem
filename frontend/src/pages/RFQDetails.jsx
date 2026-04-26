import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function RFQDetails() {
  const { rfqId } = useParams();

  const [data, setData] = useState(null);

  const [form, setForm] = useState({
    supplierName: "",
    freightCharge: "",
    originCharge: "",
    destinationCharge: "",
    transitTime: "",
    validity: "",
  });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/rfq/${rfqId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetails();
  }, [rfqId]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch(`http://localhost:5000/rfq/${rfqId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
  
      const result = await res.json();
  
      if (!res.ok) {
        alert(result.error || "Failed to place bid");
        return;
      }
  
      alert("Bid placed successfully");
  
      // 🔥 REFRESH DATA
      const updated = await fetch(`http://localhost:5000/rfq/${rfqId}`);
      const updatedData = await updated.json();
      setData(updatedData);
  
      // reset form
      setForm({
        supplierName: "",
        freightCharge: "",
        originCharge: "",
        destinationCharge: "",
        transitTime: "",
        validity: "",
      });
  
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  const { rfq, bids, logs } = data;


return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-blue-50 p-6 space-y-6">
  
      {/* RFQ Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500">
      <div className="flex justify-between items-start">

<h1 className="text-3xl font-bold text-gray-800">
  {rfq.name}
</h1>

<button
  onClick={() => setShowModal(true)}
  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow"
>
  + Place Bid
</button>

</div>

        <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
          
          <div className="bg-indigo-50 p-3 rounded">
            <p className="font-medium text-indigo-700">Start</p>
            <p className="text-gray-700">{new Date(rfq.start_time).toLocaleString("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})}</p>
          </div>
  
          <div className="bg-yellow-50 p-3 rounded">
            <p className="font-medium text-yellow-700">Close</p>
            <p className="text-gray-700">{new Date(rfq.bid_close_time).toLocaleString("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})}</p>
          </div>
  
          <div className="bg-red-50 p-3 rounded">
            <p className="font-medium text-red-700">Forced Close</p>
            <p className="text-gray-700">{new Date(rfq.forced_close_time).toLocaleString("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})}</p>
          </div>
        </div>
  
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span className="bg-gray-100 px-3 py-1 rounded">
            Trigger: {rfq.trigger_type}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded">
            Window: {rfq.trigger_window}m
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded">
            Extension: {rfq.extension_duration}m
          </span>
        </div>
      </div>

  
      {/* Layout split */}
      <div className="grid md:grid-cols-2 gap-6">
  
        {/* Bids */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Bids Ranking
          </h2>
  
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="py-2">Rank</th>
                <th>Supplier</th>
                <th>Price</th>
                <th>Transit</th>
              </tr>
            </thead>
  
            <tbody>
              {bids.map((bid, index) => (
                <tr
                  key={index}
                  className={`border-b transition ${
                    bid.rank === "L1"
                      ? "bg-green-100 text-green-800 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-2">{bid.rank}</td>
                  <td>{bid.supplier_name}</td>
                  <td className="font-medium text-blue-600">
                    ₹{bid.total_price}
                  </td>
                  <td>{bid.transit_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Logs */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Activity Log
          </h2>
  
          <div className="space-y-3 max-h-100 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded border text-sm ${
                  log.event_type === "EXTENSION"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <p className="text-gray-700">{log.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                {new Date(log.created_at).toLocaleString("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})}
                </p>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg relative">

      {/* Close button */}
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4">Place Bid</h2>

      <form
  onSubmit={(e) => {
    handleSubmit(e);
    setShowModal(false);
  }}
  className="space-y-4"
>

  {/* Supplier Name */}
  <div>
    <label className="text-sm text-gray-600">Supplier Name</label>
    <input
      name="supplierName"
      value={form.supplierName}
      onChange={handleChange}
      placeholder="Enter supplier name"
      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>

  {/* Charges */}
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-sm text-gray-600">Freight Charges</label>
      <input
        name="freightCharge"
        value={form.freightCharge}
        onChange={handleChange}
        type="number"
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Origin Charges</label>
      <input
        name="originCharge"
        value={form.originCharge}
        onChange={handleChange}
        type="number"
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Destination Charges</label>
      <input
        name="destinationCharge"
        value={form.destinationCharge}
        onChange={handleChange}
        type="number"
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Transit Time</label>
      <input
        name="transitTime"
        value={form.transitTime}
        onChange={handleChange}
        placeholder="e.g. 2 days"
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  </div>

  {/* Validity */}
  <div>
    <label className="text-sm text-gray-600">Validity</label>
    <input
      name="validity"
      value={form.validity}
      onChange={handleChange}
      placeholder="e.g. 7 days"
      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
    />
  </div>

  {/* Button */}
  <button
    type="submit"
    className="w-full bg-linear-to-r from-indigo-500 to-blue-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
  >
    Submit Bid
  </button>

</form>

    </div>
  </div>
)}

      </div>
    </div>
  );
}