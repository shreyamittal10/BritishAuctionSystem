import { pool } from "../server.js";

function formatTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortBids(bids) {
  return bids.sort((a, b) => {
    if (Number(a.total_price) !== Number(b.total_price)) {
      return Number(a.total_price) - Number(b.total_price);
    }
    return new Date(a.created_at) - new Date(b.created_at);
  });
}

export const placeBid = async (req, res) => {
  try {
    const { rfqId } = req.params;

    const {
      supplierName,
      freightCharge,
      originCharge,
      destinationCharge,
      transitTime,
      validity,
    } = req.body;

    const totalPrice =
      Number(freightCharge) +
      Number(originCharge) +
      Number(destinationCharge);

    const now = new Date();

    const rfqRes = await pool.query(
      "SELECT * FROM rfq WHERE id = $1",
      [rfqId]
    );

    if (rfqRes.rows.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const rfq = rfqRes.rows[0];

    if (now < rfq.start_time) {
      return res.status(400).json({ error: "Auction not started" });
    }

    if (now > rfq.bid_close_time || now > rfq.forced_close_time) {
      return res.status(400).json({ error: "Auction closed" });
    }

    let supplierRes = await pool.query(
      "SELECT * FROM suppliers WHERE name = $1",
      [supplierName]
    );

    let supplier;

    if (supplierRes.rows.length === 0) {
      const newSupplier = await pool.query(
        "INSERT INTO suppliers (name) VALUES ($1) RETURNING *",
        [supplierName]
      );
      supplier = newSupplier.rows[0];
    } else {
      supplier = supplierRes.rows[0];
    }

    const supplierId = supplier.id;

    const oldBidsRes = await pool.query(
      `SELECT DISTINCT ON (b.supplier_id)
         s.name,
         b.total_price,
         b.created_at
       FROM bids b
       JOIN suppliers s ON b.supplier_id = s.id
       WHERE b.rfq_id = $1
       ORDER BY b.supplier_id, b.created_at DESC`,
      [rfqId]
    );

    const oldBids = sortBids(oldBidsRes.rows);
    const oldL1 = oldBids[0]?.name || null;

    await pool.query(
      `INSERT INTO bids 
      (rfq_id, supplier_id, freight_charge, origin_charge, destination_charge, total_price, transit_time, validity)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        rfqId,
        supplierId,
        freightCharge,
        originCharge,
        destinationCharge,
        totalPrice,
        transitTime,
        validity,
      ]
    );

    const newBidsRes = await pool.query(
      `SELECT DISTINCT ON (b.supplier_id)
         s.name,
         b.total_price,
         b.created_at
       FROM bids b
       JOIN suppliers s ON b.supplier_id = s.id
       WHERE b.rfq_id = $1
       ORDER BY b.supplier_id, b.created_at DESC`,
      [rfqId]
    );

    const newBids = sortBids(newBidsRes.rows);
    const newL1 = newBids[0]?.name || null;

    // 🔥 7. DETECT CHANGES
const oldRanking = oldBids.map(b => b.name);
const newRanking = newBids.map(b => b.name);

let rankChanged = false;

if (oldBids.length > 0) {
  for (let i = 0; i < oldBids.length; i++) {
    if (!newBids[i]) break;

    if (oldBids[i].name !== newBids[i].name) {
      rankChanged = true;
      break;
    }
  }
}

    const l1Changed = oldL1 !== newL1;

    const timeDiff =
      new Date(rfq.bid_close_time).getTime() - now.getTime();

    const withinTriggerWindow =
      timeDiff > 0 &&
      timeDiff <= rfq.trigger_window * 60 * 1000;

    let extended = false;

    const triggerText = {
      ANY_BID: "new bid",
      ANY_RANK_CHANGE: "rank change",
      L1_CHANGE: "lowest bidder change",
    }[rfq.trigger_type];

    if (withinTriggerWindow) {
      if (
        rfq.trigger_type === "ANY_BID" ||
        (rfq.trigger_type === "ANY_RANK_CHANGE" && rankChanged) ||
        (rfq.trigger_type === "L1_CHANGE" && l1Changed)
      ) {
        const currentClose = new Date(rfq.bid_close_time);
const forcedClose = new Date(rfq.forced_close_time);

let newCloseTime = new Date(currentClose);
newCloseTime.setMinutes(
  newCloseTime.getMinutes() + rfq.extension_duration
);

let extensionBlocked = false;

if (currentClose.getTime() === forcedClose.getTime()) {

  await pool.query(
    `INSERT INTO logs (rfq_id, event_type, message)
     VALUES ($1, 'EXTENSION', $2)`,
    [
      rfqId,
      `Auction already at maximum time (${formatTime(forcedClose)})`
    ]
  );

}

else if (newCloseTime > forcedClose) {
  newCloseTime = forcedClose;
  extensionBlocked = true;

  await pool.query(
    "UPDATE rfq SET bid_close_time = $1 WHERE id = $2",
    [newCloseTime, rfqId]
  );

  await pool.query(
    `INSERT INTO logs (rfq_id, event_type, message)
     VALUES ($1, 'EXTENSION', $2)`,
    [
      rfqId,
      `Extended only until forced close (${formatTime(newCloseTime)})`
    ]
  );

  extended = true;
}

else {
  await pool.query(
    "UPDATE rfq SET bid_close_time = $1 WHERE id = $2",
    [newCloseTime, rfqId]
  );

  await pool.query(
    `INSERT INTO logs (rfq_id, event_type, message)
     VALUES ($1, 'EXTENSION', $2)`,
    [
      rfqId,
      `Extended by ${rfq.extension_duration} min due to ${triggerText}. New close: ${formatTime(newCloseTime)}`
    ]
  );

  extended = true;
}
      }
    }

    await pool.query(
      `INSERT INTO logs (rfq_id, event_type, message)
       VALUES ($1, 'BID', $2)`,
      [rfqId, `${supplierName} placed bid ₹${totalPrice}`]
    );

    res.json({
      message: "Bid placed successfully",
      totalPrice,
      extended,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};