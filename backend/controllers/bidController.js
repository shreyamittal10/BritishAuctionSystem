// import { pool } from "../server.js";

// function formatTime(date) {
//     return new Date(date).toLocaleString("en-IN", {
//       day: "numeric",
//       month: "short",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   }

// export const placeBid = async (req, res) => {
//   try {
//     const { rfqId } = req.params;

//     const {
//       supplierName,
//       freightCharge,
//       originCharge,
//       destinationCharge,
//       transitTime,
//       validity,
//     } = req.body;

//     const totalPrice =
//       Number(freightCharge) +
//       Number(originCharge) +
//       Number(destinationCharge);

//     const now = new Date();

//     // 🔥 1. GET RFQ
//     const rfqRes = await pool.query(
//       "SELECT * FROM rfq WHERE id = $1",
//       [rfqId]
//     );

//     if (rfqRes.rows.length === 0) {
//       return res.status(404).json({ error: "RFQ not found" });
//     }

//     const rfq = rfqRes.rows[0];

//     // 🔥 2. VALIDATE TIME
//     if (now < rfq.start_time) {
//       return res.status(400).json({ error: "Auction not started" });
//     }

//     if (now > rfq.bid_close_time || now > rfq.forced_close_time) {
//       return res.status(400).json({ error: "Auction closed" });
//     }

//     // 🔥 3. GET / CREATE SUPPLIER
//     let supplierRes = await pool.query(
//       "SELECT * FROM suppliers WHERE name = $1",
//       [supplierName]
//     );

//     let supplier;

//     if (supplierRes.rows.length === 0) {
//       const newSupplier = await pool.query(
//         "INSERT INTO suppliers (name) VALUES ($1) RETURNING *",
//         [supplierName]
//       );
//       supplier = newSupplier.rows[0];
//     } else {
//       supplier = supplierRes.rows[0];
//     }

//     const supplierId = supplier.id;

//     // 🔥 4. OLD RANKINGS (JOIN)
//     const oldBidsRes = await pool.query(
//   `SELECT DISTINCT ON (b.supplier_id)
//      s.name,
//      b.total_price,
//      b.created_at
//    FROM bids b
//    JOIN suppliers s ON b.supplier_id = s.id
//    WHERE b.rfq_id = $1
//    ORDER BY b.supplier_id, b.created_at DESC`,
//   [rfqId]
// );

// const oldBids = oldBidsRes.rows.sort(
//   (a, b) => a.total_price - b.total_price
// );

// const oldL1 = oldBids[0]?.name || null;

//     // 🔥 5. INSERT BID
//     await pool.query(
//       `INSERT INTO bids 
//       (rfq_id, supplier_id, freight_charge, origin_charge, destination_charge, total_price, transit_time, validity)
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
//       [
//         rfqId,
//         supplierId,
//         freightCharge,
//         originCharge,
//         destinationCharge,
//         totalPrice,
//         transitTime,
//         validity,
//       ]
//     );

//     // 🔥 6. NEW RANKINGS
//     const newBidsRes = await pool.query(
//         `SELECT DISTINCT ON (b.supplier_id)
//            s.name,
//            b.total_price,
//            b.created_at
//          FROM bids b
//          JOIN suppliers s ON b.supplier_id = s.id
//          WHERE b.rfq_id = $1
//          ORDER BY b.supplier_id, b.created_at DESC`,
//         [rfqId]
//       );
      
//       const newBids = newBidsRes.rows.sort(
//         (a, b) => a.total_price - b.total_price
//       );
      
//       const newL1 = newBids[0]?.name || null;

//     // 🔥 7. DETECT CHANGES
//     let rankChanged = oldBids.length !== newBids.length;
//     let l1Changed = oldL1 !== newL1;

//     // 🔥 8. CHECK TRIGGER WINDOW
//     const timeDiff =
//       new Date(rfq.bid_close_time).getTime() - now.getTime();

//     const withinTriggerWindow =
//       timeDiff <= rfq.trigger_window * 60 * 1000;

//     let extended = false;

//     // 🔥 9. EXTENSION LOGIC
//     const triggerText = {
//         ANY_BID: "new bid",
//         ANY_RANK_CHANGE: "rank change",
//         L1_CHANGE: "L1 change",
//       }[rfq.trigger_type];

//     if (withinTriggerWindow) {
//       if (
//         rfq.trigger_type === "ANY_BID" ||
//         (rfq.trigger_type === "ANY_RANK_CHANGE" && rankChanged) ||
//         (rfq.trigger_type === "L1_CHANGE" && l1Changed)
//       ) {
//         let newCloseTime = new Date(rfq.bid_close_time);
// newCloseTime.setMinutes(
//   newCloseTime.getMinutes() + rfq.extension_duration
// );

// let extensionBlocked = false;

// // check forced limit
// if (newCloseTime > new Date(rfq.forced_close_time)) {
//   newCloseTime = new Date(rfq.forced_close_time);
//   extensionBlocked = true;
// }

// // 🔥 CASE 1: extension possible
// if (newCloseTime.getTime() > new Date(rfq.bid_close_time).getTime()) {

//   await pool.query(
//     "UPDATE rfq SET bid_close_time = $1 WHERE id = $2",
//     [newCloseTime, rfqId]
//   );

//   await pool.query(
//     `INSERT INTO logs (rfq_id, event_type, message)
//      VALUES ($1, 'EXTENSION', $2)`,
//     [
//       rfqId,
//       extensionBlocked
//         ? `Extension stopped at forced close (${formatTime(newCloseTime)})`
//         : `Extended by ${rfq.extension_duration} min due to ${triggerText}. New close: ${formatTime(newCloseTime)}`
//     ]
//   );

// }

// // 🔥 CASE 2: already at forced limit → log anyway
// else if (extensionBlocked) {

//   await pool.query(
//     `INSERT INTO logs (rfq_id, event_type, message)
//      VALUES ($1, 'EXTENSION', $2)`,
//     [
//       rfqId,
//       `Extension attempted but already at forced close time (${formatTime(rfq.forced_close_time)})`
//     ]
//   );
// }
//       }
//     }

//     // 🔥 10. LOG BID
//     await pool.query(
//       `INSERT INTO logs (rfq_id, event_type, message)
//        VALUES ($1, 'BID', $2)`,
//       [rfqId, `${supplierName} placed bid ₹${totalPrice}`]
//     );

//     res.json({
//       message: "Bid placed successfully",
//       totalPrice,
//       extended,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };


import { pool } from "../server.js";

function formatTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 🔥 stable sorting (VERY IMPORTANT)
function sortBids(bids) {
  return bids.sort((a, b) => {
    if (Number(a.total_price) !== Number(b.total_price)) {
      return Number(a.total_price) - Number(b.total_price);
    }
    return new Date(a.created_at) - new Date(b.created_at); // tie-breaker
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

    // 🔥 1. GET RFQ
    const rfqRes = await pool.query(
      "SELECT * FROM rfq WHERE id = $1",
      [rfqId]
    );

    if (rfqRes.rows.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const rfq = rfqRes.rows[0];

    // 🔥 2. VALIDATE TIME
    if (now < rfq.start_time) {
      return res.status(400).json({ error: "Auction not started" });
    }

    if (now > rfq.bid_close_time || now > rfq.forced_close_time) {
      return res.status(400).json({ error: "Auction closed" });
    }

    // 🔥 3. GET / CREATE SUPPLIER
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

    // 🔥 4. OLD RANKINGS
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

    // 🔥 5. INSERT BID
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

    // 🔥 6. NEW RANKINGS
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

    // ✅ rank change (order change)
    const oldRanking = oldBids.map(b => b.name);
    const newRanking = newBids.map(b => b.name);

    let rankChanged = false;

    if (oldRanking.length === newRanking.length) {
      for (let i = 0; i < oldRanking.length; i++) {
        if (oldRanking[i] !== newRanking[i]) {
          rankChanged = true;
          break;
        }
      }
    }

    // ✅ L1 change
    const l1Changed = oldL1 !== newL1;

    // 🔥 8. CHECK TRIGGER WINDOW
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

    // 🔥 9. EXTENSION LOGIC
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

// 🚨 CASE 0: already at forced close
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

// 🚨 CASE 1: extension exceeds forced limit
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

// 🚨 CASE 2: normal extension
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

    // 🔥 10. LOG BID
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