import { pool } from "../server.js";

export const createRFQ = async (req, res) => {
  try {
    const {
      name,
      startTime,
      bidCloseTime,
      forcedCloseTime,
      pickupDate,
      triggerWindow,
      extensionDuration,
      triggerType,
    } = req.body;

    // ✅ VALIDATION
    if (new Date(forcedCloseTime) <= new Date(bidCloseTime)) {
      return res.status(400).json({
        error: "Forced close must be greater than bid close time",
      });
    }

    const result = await pool.query(
      `INSERT INTO rfq 
      (name, start_time, bid_close_time, forced_close_time, pickup_date, trigger_window, extension_duration, trigger_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        name,
        startTime,
        bidCloseTime,
        forcedCloseTime,
        pickupDate,
        triggerWindow,
        extensionDuration,
        triggerType,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getRFQs = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          r.*,
          COALESCE(MIN(lb.total_price), 0) AS lowest_bid
        FROM rfq r
  
        LEFT JOIN (
          SELECT DISTINCT ON (supplier_id, rfq_id)
            rfq_id,
            supplier_id,
            total_price
          FROM bids
          ORDER BY supplier_id, rfq_id, created_at DESC
        ) lb
  
        ON r.id = lb.rfq_id
  
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `);
  
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

export const getRFQDetails = async (req, res) => {
  try {
    const { rfqId } = req.params;

    // 🔥 1. GET RFQ
    const rfqRes = await pool.query(
      "SELECT * FROM rfq WHERE id = $1",
      [rfqId]
    );

    if (rfqRes.rows.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const rfq = rfqRes.rows[0];

    // 🔥 2. GET BIDS + SUPPLIER NAME (SORTED)
    const bidsRes = await pool.query(
        `SELECT DISTINCT ON (b.supplier_id)
           s.name AS supplier_name,
           b.freight_charge,
           b.origin_charge,
           b.destination_charge,
           b.total_price,
           b.transit_time,
           b.validity,
           b.created_at
         FROM bids b
         JOIN suppliers s ON b.supplier_id = s.id
         WHERE b.rfq_id = $1
         ORDER BY b.supplier_id, b.created_at DESC`,
        [rfqId]
      );
      
      // 🔥 Sort for ranking
      const sortedBids = bidsRes.rows.sort((a, b) => {
        if (Number(a.total_price) !== Number(b.total_price)) {
          return Number(a.total_price) - Number(b.total_price);
        }
        // 🔥 Tie-breaker → earlier bid wins
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      // 🔥 Add ranks
      const bidsWithRank = sortedBids.map((bid, index) => ({
        ...bid,
        rank: `L${index + 1}`,
      }));

    // 🔥 4. GET LOGS
    const logsRes = await pool.query(
      `SELECT event_type, message, created_at
       FROM logs
       WHERE rfq_id = $1
       ORDER BY created_at DESC`,
      [rfqId]
    );

    res.json({
      rfq,
      bids: bidsWithRank,
      logs: logsRes.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};