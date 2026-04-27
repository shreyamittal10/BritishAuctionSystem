import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RFQList() {
  const [rfqs, setRfqs] = useState([]);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

const [form, setForm] = useState({
  name: "",
  startTime: "",
  bidCloseTime: "",
  forcedCloseTime: "",
  pickupDate: "",
  triggerWindow: 10,
  extensionDuration: 5,
  triggerType: "ANY_BID",
});

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const res = await fetch("http://localhost:5000/rfq");

        if (!res.ok) {
          throw new Error("Failed to fetch RFQs");
        }

        const data = await res.json();
        setRfqs(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRFQs();
  }, []);

  const getStatus = (rfq) => {
    const now = new Date();

    if (now > new Date(rfq.forced_close_time)) return "Force Closed";
    if (now > new Date(rfq.bid_close_time)) return "Closed";
    if (now >= new Date(rfq.start_time)) return "Active";
    return "Not Started";
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch("http://localhost:5000/rfq/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.error);
        return;
      }
  
      alert("RFQ Created");

      setForm({
        name: "",
        startTime: "",
        bidCloseTime: "",
        forcedCloseTime: "",
        pickupDate: "",
        triggerWindow: 10,
        extensionDuration: 5,
        triggerType: "ANY_BID",
      });
  
      setShowModal(false);
  
      const updated = await fetch("http://localhost:5000/rfq");
      const updatedData = await updated.json();
      setRfqs(updatedData);
  
    } catch (err) {
      console.error(err);
    }
  };

return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-blue-50 p-6">
  
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          RFQs
        </h1>
  
        <button
          onClick={() => setShowModal(true)}
          className="bg-linear-to-r from-indigo-500 to-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow hover:opacity-90 transition"
        >
          + Create RFQ
        </button>
      </div>
  
      <div className="grid md:grid-cols-2 gap-6">
        {rfqs.map((rfq) => {
          const status = getStatus(rfq);
  
          const statusStyles = {
            Active: "bg-green-100 text-green-700",
            Closed: "bg-yellow-100 text-yellow-700",
            "Force Closed": "bg-red-100 text-red-700",
            "Not Started": "bg-gray-200 text-gray-600",
          };
  
          return (
            <div
              key={rfq.id}
              onClick={() => navigate(`/rfq/${rfq.id}`)}
              className="group bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                  {rfq.name}
                </h2>
  
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>
  
              <div className="space-y-3 text-sm text-gray-600">
  
                <div className="flex justify-between">
                  <span>💰 Lowest Bid</span>
                  <span className="font-semibold text-indigo-600">
                    ₹{rfq.lowest_bid || "--"}
                  </span>
                </div>
  
                <div className="flex justify-between">
                  <span>⏱ Close</span>
                  <span>
                    {new Date(rfq.bid_close_time).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
  
                <div className="flex justify-between">
                  <span>🚫 Forced Close</span>
                  <span>
                    {new Date(rfq.forced_close_time).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
  
              </div>
            </div>
          );
        })}
      </div>
  
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg relative">
  
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>
  
            <h2 className="text-xl font-semibold mb-4">Create RFQ</h2>
  
            <form
  onSubmit={(e) => {
    handleSubmit(e);
    setShowModal(false);
  }}
  className="space-y-4"
>

  <div>
    <label className="text-sm text-gray-600">RFQ Name</label>
    <input
      name="name"
      value={form.name}
      onChange={handleChange}
      placeholder="e.g. Delhi to Mumbai Shipment"
      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>

  <div className="grid grid-cols-2 gap-3">

    <div>
      <label className="text-sm text-gray-600">Start Time</label>
      <input
        type="datetime-local"
        name="startTime"
        value={form.startTime}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Pickup Date</label>
      <input
        type="datetime-local"
        name="pickupDate"
        value={form.pickupDate}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
      />
    </div>

  </div>

  <div className="grid grid-cols-2 gap-3">

    <div>
      <label className="text-sm text-gray-600">Bid Close Time</label>
      <input
        type="datetime-local"
        name="bidCloseTime"
        value={form.bidCloseTime}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Forced Close Time</label>
      <input
        type="datetime-local"
        name="forcedCloseTime"
        value={form.forcedCloseTime}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
        required
      />
    </div>

  </div>

  <div className="grid grid-cols-2 gap-3">

    <div>
      <label className="text-sm text-gray-600">Trigger Window (minutes)</label>
      <input
        type="number"
        name="triggerWindow"
        value={form.triggerWindow}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Extension Duration (minutes)</label>
      <input
        type="number"
        name="extensionDuration"
        value={form.extensionDuration}
        onChange={handleChange}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
      />
    </div>

  </div>

  <div>
    <label className="text-sm text-gray-600">Extension Trigger Type</label>
    <select
      name="triggerType"
      value={form.triggerType}
      onChange={handleChange}
      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
    >
      <option value="ANY_BID">Any Bid in last window</option>
      <option value="ANY_RANK_CHANGE">Any Rank Change</option>
      <option value="L1_CHANGE">Lowest Bidder Change (L1)</option>
    </select>
  </div>

  <button
    type="submit"
    className="w-full bg-linear-to-r from-indigo-500 to-blue-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition shadow"
  >
    Create RFQ
  </button>

</form>
          </div>
        </div>
      )}
    </div>
  );
}